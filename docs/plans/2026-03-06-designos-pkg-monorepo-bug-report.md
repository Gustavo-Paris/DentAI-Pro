# QA Report: design-os-pkg — commands not installed at monorepo root

**Package**: `@parisgroup-ai/design-os-pkg@0.14.0`
**Reporter**: DentAI-Pro (AURIA) project team
**Date**: 2026-03-06
**Severity**: Medium — commands silently not available in monorepo setups

---

## Summary

In monorepo projects (Turborepo + pnpm workspaces), `designos migrate` installs commands and agents into `<app>/.claude/` instead of the monorepo root `<root>/.claude/`. Claude Code runs from the monorepo root and only loads commands/agents from `<root>/.claude/`, so **all Design OS commands are invisible** unless manually duplicated.

---

## Reproduction

### Project structure

```
monorepo-root/              <-- Claude Code cwd, git root
├── .claude/
│   ├── commands/           <-- Claude Code reads from HERE
│   └── agents/
├── apps/
│   └── web/                <-- designos init/migrate runs HERE
│       ├── .designos-version   (0.14.0)
│       ├── .claude/
│       │   ├── commands/   <-- migrations install HERE (wrong)
│       │   │   ├── apply-design.md           ✓ exists
│       │   │   ├── design-os-orchestrator.md ✓ exists
│       │   │   ├── implement.md              ✓ exists
│       │   │   └── pageshell-sync.md         ✓ exists
│       │   └── agents/
│       │       ├── design-architect.md       ✓ exists
│       │       ├── data-engineer.md          ✓ exists
│       │       ├── frontend-dev.md           ✓ exists
│       │       └── ...
│       └── design/
├── packages/
└── pnpm-workspace.yaml
```

### Steps to reproduce

1. Create a Turborepo monorepo with `apps/web/`
2. Run `cd apps/web && npx designos init`
3. Run `npx designos migrate`
4. Open Claude Code from monorepo root
5. Try `/design-os-orchestrator` — **command not found**

### Expected behavior

Commands and agents should be installed at the **git/monorepo root** `.claude/` directory, where Claude Code actually reads them.

### Actual behavior

Commands and agents are installed at `apps/web/.claude/`, which is never read by Claude Code.

---

## Root cause analysis

### Migration runner (`src/migrations/runner.mjs`)

The runner receives `projectDir` (line 52) and all migrations use it as the base for `.claude/` paths. When run from `apps/web/`, `projectDir = apps/web/`, so files go to `apps/web/.claude/`.

### Affected migrations

| Migration | File | Issue |
|---|---|---|
| `0.4.0` | `install-skills-agents.mjs` | Installs `design-os-orchestrator.md` + 3 agents to `<projectDir>/.claude/` |
| `0.5.0` | `install-pageshell-sync.mjs` | Likely same pattern |
| `0.6.0` | `codebase-aware-commands.mjs` | Likely same pattern |
| `0.8.0` | `apply-design.mjs` | Installs `apply-design.md` to `<projectDir>/.claude/` |
| `0.9.0` | `implement.mjs` | Installs `implement.md` to `<projectDir>/.claude/` |
| `0.10.0` | `skills-to-commands.mjs` | Moves all 4 commands to `<projectDir>/.claude/commands/` |

### Why it's silent

No migration emits a warning about monorepo detection. The `runner.mjs` has no concept of monorepo roots. Files are installed successfully — just in the wrong directory.

---

## Proposed fix

### Option A: Detect monorepo root automatically (recommended)

Add a `findMonorepoRoot(projectDir)` utility that walks up from `projectDir` looking for monorepo indicators:

```javascript
// src/cli/monorepo.mjs
import fs from 'node:fs/promises'
import path from 'node:path'

const MONOREPO_MARKERS = [
  'pnpm-workspace.yaml',
  'lerna.json',
  'nx.json',
  'turbo.json',
  'rush.json',
]

/**
 * Walks up from startDir looking for monorepo root indicators.
 * Returns the monorepo root if found, or startDir if not a monorepo.
 */
export async function findMonorepoRoot(startDir) {
  let dir = path.resolve(startDir)

  while (true) {
    for (const marker of MONOREPO_MARKERS) {
      try {
        await fs.access(path.join(dir, marker))
        return dir // found monorepo root
      } catch {
        // not here, keep looking
      }
    }

    const parent = path.dirname(dir)
    if (parent === dir) break // reached filesystem root
    dir = parent
  }

  return startDir // not a monorepo
}

/**
 * Finds the git root (where .git/ lives).
 * Claude Code uses the git root as cwd.
 */
export async function findGitRoot(startDir) {
  let dir = path.resolve(startDir)

  while (true) {
    try {
      await fs.access(path.join(dir, '.git'))
      return dir
    } catch {
      // not here
    }

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return startDir
}

/**
 * Determines where .claude/ should be installed.
 * Priority: git root > monorepo root > projectDir
 */
export async function findClaudeRoot(projectDir) {
  // Git root takes priority (Claude Code uses git root as cwd)
  const gitRoot = await findGitRoot(projectDir)
  if (gitRoot !== projectDir) return gitRoot

  // Fallback to monorepo root
  const monoRoot = await findMonorepoRoot(projectDir)
  return monoRoot
}
```

### Changes to migrations

Each migration that writes to `.claude/` should resolve the target directory:

```javascript
// Before (current):
const cmdDest = path.join(projectDir, '.claude', 'commands', 'design-os-orchestrator.md')

// After (proposed):
import { findClaudeRoot } from '../cli/monorepo.mjs'

const claudeRoot = await findClaudeRoot(projectDir)
const cmdDest = path.join(claudeRoot, '.claude', 'commands', 'design-os-orchestrator.md')

if (claudeRoot !== projectDir) {
  console.log(`    Monorepo detected: installing .claude/ at ${claudeRoot}`)
}
```

### Changes to runner.mjs

Alternatively, resolve once in the runner and pass both dirs:

```javascript
// src/migrations/runner.mjs (proposed change)
import { findClaudeRoot } from '../cli/monorepo.mjs'

export async function runMigrations(projectDir, migrations, options = {}) {
  const { dryRun = false, logger = console } = options
  const claudeRoot = await findClaudeRoot(projectDir)

  if (claudeRoot !== projectDir) {
    logger.log(`  Monorepo detected: .claude/ will be installed at ${claudeRoot}`)
  }

  const sorted = [...migrations].sort((a, b) =>
    compareSemver(a.version, b.version),
  )

  for (const migration of sorted) {
    if (dryRun) {
      logger.log(`  [dry-run] Would run: v${migration.version} — ${migration.description}`)
      continue
    }

    logger.log(`  Running v${migration.version}: ${migration.description}...`)
    await createBackup(projectDir, migration.version)
    // Pass claudeRoot as second argument
    await migration.up(projectDir, { claudeRoot })
    await fs.writeFile(
      path.join(projectDir, '.designos-version'),
      `${migration.version}\n`,
    )
    logger.log(`  ✓ v${migration.version} complete`)
  }

  return sorted.length
}
```

Then each migration receives `options.claudeRoot`:

```javascript
// Example: 0.4.0-install-skills-agents.mjs
async up(projectDir, options = {}) {
  const claudeRoot = options.claudeRoot || projectDir
  const cmdDest = path.join(claudeRoot, '.claude', 'commands', 'design-os-orchestrator.md')
  // ...
}
```

### Option B: CLI flag `--root`

```bash
cd apps/web
npx designos migrate --root ../..
```

Less automatic but simpler to implement. Not recommended as primary solution — users will forget the flag.

---

## Additional issues found

### 1. `createBackup` fails silently in monorepos without `design/` at root

`runner.mjs:34-50` — `createBackup` reads `design/` from `projectDir`. This works correctly since `design/` is in the app dir. No issue here, just noting the asymmetry: design content stays in `apps/web/design/`, but `.claude/` goes to root.

### 2. No idempotency check for commands already at root

If a user manually copies commands to root (workaround), then runs migrate again, the migration should detect and skip (migration 0.4.0 does `fs.access` check, but against `projectDir` not `claudeRoot`).

### 3. `.designos-version` location

Currently at `apps/web/.designos-version`. Consider also writing a version marker at root to help with detection. Or use a single location based on the same root-finding logic.

---

## Workaround (current)

Manually copy commands from `apps/web/.claude/` to root `.claude/`:

```bash
cp apps/web/.claude/commands/*.md .claude/commands/
cp -r apps/web/.claude/commands/design-os/ .claude/commands/design-os/
cp apps/web/.claude/agents/*.md .claude/agents/
```

This must be repeated after every `designos migrate`.

---

## Test case suggestion

```javascript
// tests/migration-monorepo.test.mjs
import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

describe('monorepo detection', () => {
  it('installs .claude/ at git root when projectDir is nested', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'designos-'))

    // Create monorepo structure
    await fs.mkdir(path.join(tmpDir, '.git'))
    await fs.writeFile(path.join(tmpDir, 'turbo.json'), '{}')
    await fs.writeFile(path.join(tmpDir, 'pnpm-workspace.yaml'), '')

    const appDir = path.join(tmpDir, 'apps', 'web')
    await fs.mkdir(appDir, { recursive: true })
    await fs.mkdir(path.join(appDir, 'design'), { recursive: true })

    // Run migration targeting appDir
    // ...

    // Assert: commands at monorepo root
    assert.ok(
      await fs.access(path.join(tmpDir, '.claude', 'commands', 'design-os-orchestrator.md'))
        .then(() => true).catch(() => false),
      '.claude/commands should be at monorepo root'
    )

    await fs.rm(tmpDir, { recursive: true })
  })
})
```

---

## Impact

- **All monorepo users** of design-os-pkg are affected
- Commands appear installed (exist in `apps/*/. claude/`) but are **invisible to Claude Code**
- Users must manually copy files — fragile, breaks on every migrate
- The `autoTrigger` feature of `design-os-orchestrator` (trigger on `.designos-version`) never fires because the command isn't at root

---

## Recommended release

- **Patch version** (0.14.1): Add `findClaudeRoot` + update all migrations to use it
- **New migration** (0.15.0): Add a migration that detects existing `apps/*/.claude/` installs and copies them to root (one-time fix for existing projects)
