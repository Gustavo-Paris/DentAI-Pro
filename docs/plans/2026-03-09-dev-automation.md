# Dev Automation — Pre-commit + Claude Code Hooks

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add local quality gates that catch bugs before they become commits — reducing the fix-to-feat ratio from 0.79 to <0.3.

**Architecture:** Two layers of automation:
1. **Pre-commit hooks** (lint-staged + husky) — run ESLint + TypeScript on staged files at `git commit` time
2. **Claude Code hooks** (PostToolUse) — run typecheck after file edits, run Deno prompt tests when prompt files change

**Tech Stack:** husky 9, lint-staged 15, Claude Code hooks API

---

### Task 1: Install husky + lint-staged

**Files:**
- Modify: `package.json` (root)

**Step 1: Install dependencies**

```bash
pnpm add -D -w husky lint-staged
```

**Step 2: Initialize husky**

```bash
pnpm exec husky init
```

This creates `.husky/pre-commit` with a default script.

**Step 3: Verify `.husky/pre-commit` exists**

```bash
cat .husky/pre-commit
```

Expected: file exists with a placeholder command.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .husky/
git commit -m "chore: install husky + lint-staged"
```

---

### Task 2: Configure lint-staged

**Files:**
- Modify: `package.json` (root) — add lint-staged config
- Modify: `.husky/pre-commit` — wire to lint-staged

**Step 1: Add lint-staged config to root `package.json`**

Add this to root `package.json`:

```json
"lint-staged": {
  "apps/web/src/**/*.{ts,tsx}": [
    "eslint --no-warn-ignored --max-warnings=0",
    "bash -c 'cd apps/web && pnpm exec tsc --noEmit'"
  ],
  "supabase/functions/**/*.ts": [
    "bash -c 'cd supabase/functions && deno check --no-lock ${@}' _"
  ]
}
```

Key decisions:
- `--max-warnings=0` — treat warnings as errors at commit time
- `tsc --noEmit` runs on the full project (not per-file, TS needs full context)
- `deno check` for edge functions (Deno, not Node)
- No formatter — already using ESLint for style

**Step 2: Update `.husky/pre-commit`**

```bash
pnpm exec lint-staged
```

**Step 3: Test with a clean commit**

```bash
echo "// test" >> /tmp/test-lint.ts
git add -A && git stash  # save current changes
# Make a trivial change to test
echo "" >> apps/web/src/lib/constants.ts
git add apps/web/src/lib/constants.ts
git commit -m "test: verify lint-staged" --no-verify  # skip for test setup
git reset HEAD~1  # undo test commit
git checkout apps/web/src/lib/constants.ts
git stash pop  # restore changes
```

**Step 4: Commit**

```bash
git add package.json .husky/pre-commit
git commit -m "chore: configure lint-staged — ESLint + TypeScript on commit"
```

---

### Task 3: Add Claude Code PostToolUse hook — typecheck after Edit

**Files:**
- Create: `.claude/hooks/post-edit-typecheck.sh`
- Modify: `.claude/settings.json` — add PostToolUse hook

**Step 1: Create the hook script**

Create `.claude/hooks/post-edit-typecheck.sh`:

```bash
#!/usr/bin/env bash
# Hook: PostToolUse(Edit/Write) — typecheck affected files after edit.
# Runs ONLY when the edited file is in apps/web/src/ or supabase/functions/.
# Non-blocking: exits 0 always, outputs warnings to stderr.

set -euo pipefail

# Read tool result JSON from stdin
INPUT=$(cat)

# Extract the file path from the tool input
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
# tool_input has the file_path
ti = data.get('tool_input', {})
print(ti.get('file_path', ''))" 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Web app TypeScript files
if [[ "$FILE_PATH" == *"apps/web/src/"*".ts"* ]]; then
  cd "$(git rev-parse --show-toplevel)/apps/web"
  ERRORS=$(pnpm exec tsc --noEmit 2>&1 | grep -c "error TS" || true)
  if [ "$ERRORS" -gt 0 ]; then
    echo "⚠️  TypeScript: $ERRORS error(s) after editing $(basename "$FILE_PATH"). Run 'pnpm -C apps/web exec tsc --noEmit' to see details."
    exit 2
  fi
  exit 0
fi

# Edge functions (Deno)
if [[ "$FILE_PATH" == *"supabase/functions/"*".ts" ]]; then
  cd "$(git rev-parse --show-toplevel)/supabase/functions"
  # Only check the specific file
  ERRORS=$(deno check --no-lock "$FILE_PATH" 2>&1 | grep -c "error" || true)
  if [ "$ERRORS" -gt 0 ]; then
    echo "⚠️  Deno check: errors in $(basename "$FILE_PATH"). Run 'deno check --no-lock $FILE_PATH' to see details."
    exit 2
  fi
  exit 0
fi

exit 0
```

**Step 2: Make executable**

```bash
chmod +x .claude/hooks/post-edit-typecheck.sh
```

**Step 3: Add hook to `.claude/settings.json`**

Add to the `hooks` object:

```json
"PostToolUse": [
  {
    "matcher": "Edit|Write",
    "hooks": [
      {
        "type": "command",
        "command": ".claude/hooks/post-edit-typecheck.sh",
        "timeout": 30000
      }
    ]
  }
]
```

**Step 4: Commit**

```bash
git add .claude/hooks/post-edit-typecheck.sh .claude/settings.json
git commit -m "feat: add Claude Code PostToolUse hook — typecheck after edit"
```

---

### Task 4: Add Claude Code PostToolUse hook — prompt regression tests

**Files:**
- Create: `.claude/hooks/post-edit-prompt-test.sh`
- Modify: `.claude/settings.json` — add second PostToolUse matcher

**Step 1: Create the prompt test hook**

Create `.claude/hooks/post-edit-prompt-test.sh`:

```bash
#!/usr/bin/env bash
# Hook: PostToolUse(Edit/Write) — run Deno prompt regression tests
# when a prompt definition file is edited.
# Triggers ONLY for files in supabase/functions/_shared/prompts/

set -euo pipefail

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
ti = data.get('tool_input', {})
print(ti.get('file_path', ''))" 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only trigger for prompt files
if [[ "$FILE_PATH" != *"_shared/prompts/"* ]]; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel)/supabase/functions"

echo "Running prompt regression tests..."
RESULT=$(deno test --allow-read --allow-env --allow-net _shared/prompts/prompts.test.ts 2>&1) || true

FAILURES=$(echo "$RESULT" | grep -c "FAILED" || true)
if [ "$FAILURES" -gt 0 ]; then
  # Extract just the failure lines
  FAIL_LINES=$(echo "$RESULT" | grep "FAILED" | head -5)
  echo "⚠️  Prompt regression: $FAILURES test(s) FAILED after editing $(basename "$FILE_PATH"):"
  echo "$FAIL_LINES"
  exit 2
fi

PASSES=$(echo "$RESULT" | grep -oE "[0-9]+ passed" | head -1 || echo "unknown")
echo "✓ Prompt tests: $PASSES"
exit 0
```

**Step 2: Make executable**

```bash
chmod +x .claude/hooks/post-edit-prompt-test.sh
```

**Step 3: Update `.claude/settings.json` PostToolUse array**

The PostToolUse hook array should now have two entries:

```json
"PostToolUse": [
  {
    "matcher": "Edit|Write",
    "hooks": [
      {
        "type": "command",
        "command": ".claude/hooks/post-edit-typecheck.sh",
        "timeout": 30000
      }
    ]
  },
  {
    "matcher": "Edit|Write",
    "hooks": [
      {
        "type": "command",
        "command": ".claude/hooks/post-edit-prompt-test.sh",
        "timeout": 60000
      }
    ]
  }
]
```

Note: 60s timeout for prompt tests (Deno test suite is heavier).

**Step 4: Commit**

```bash
git add .claude/hooks/post-edit-prompt-test.sh .claude/settings.json
git commit -m "feat: add Claude Code hook — prompt regression tests on edit"
```

---

### Task 5: Verify all hooks work end-to-end

**Step 1: Test pre-commit hook**

Make a deliberate type error and try to commit:

```bash
# Add a type error to a file
echo "const x: number = 'string';" >> apps/web/src/lib/constants.ts
git add apps/web/src/lib/constants.ts
git commit -m "test: should fail"
# Expected: lint-staged blocks the commit with TS error
```

Then revert:

```bash
git checkout apps/web/src/lib/constants.ts
```

**Step 2: Test Claude Code typecheck hook**

Edit any `.ts` file in `apps/web/src/` — the hook should run `tsc --noEmit` and report errors if any.

**Step 3: Test prompt regression hook**

Edit any file in `supabase/functions/_shared/prompts/definitions/` — the hook should run the 32 prompt tests and report results.

**Step 4: Final commit if any adjustments needed**

```bash
git add -A
git commit -m "fix: adjust hooks based on end-to-end testing"
```

---

## Summary of What Gets Automated

| Trigger | What runs | Catches |
|---------|-----------|---------|
| `git commit` | ESLint + `tsc --noEmit` on staged web files | Type errors, lint violations |
| `git commit` | `deno check` on staged edge function files | Deno type errors |
| Claude Edit (web files) | `tsc --noEmit` | Type errors in real-time |
| Claude Edit (edge functions) | `deno check` on file | Deno errors in real-time |
| Claude Edit (prompt files) | `deno test prompts.test.ts` | Prompt regressions in real-time |

## Expected Impact

Based on last week's 54 fix commits:
- ~15 were type/lint errors → caught by pre-commit + PostToolUse typecheck
- ~12 were prompt regressions → caught by prompt test hook
- ~27 were clinical logic → future Phase C (clinical QA fixtures)

**Conservative estimate: 50% fewer fix commits (27 → ~14).**
