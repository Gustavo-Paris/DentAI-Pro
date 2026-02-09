---
title: Git Workflow
created: 2026-02-09
updated: 2026-02-09
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[04-Development/Setup-Guide]]"
  - "[[04-Development/Testing-Guide]]"
---

# Git Workflow

Branch strategy, commit conventions, CI/CD pipeline, and PR process for AURIA.

---

## Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production-ready code | CI must pass (lint, type-check, test, build) |
| `feature/*` | New features | PR to main |
| `fix/*` | Bug fixes | PR to main |

Vercel auto-deploys:
- **Push to `main`** → Production deploy
- **PR to `main`** → Preview deploy (unique URL)

---

## Commit Conventions

[Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature or capability | `feat(wizard): add multi-tooth detection` |
| `fix` | Bug fix | `fix(credits): race condition in use_credits RPC` |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(data): extract patient data client` |
| `docs` | Documentation only | `docs: add API reference for edge functions` |
| `chore` | Build, deps, CI, tooling | `chore: upgrade vitest to 3.2` |
| `test` | Adding or fixing tests | `test(auth): add ProtectedRoute tests` |
| `perf` | Performance improvement | `perf(dashboard): memoize stats calculation` |
| `style` | Code style (formatting, no logic change) | `style: fix indentation in vite.config` |

### Scope (Optional)

Common scopes: `wizard`, `dsd`, `auth`, `credits`, `protocol`, `dashboard`, `edge`, `prompt`, `pageshell`.

### Style Notes

- Use lowercase for type and description
- No period at the end of the subject line
- Use em-dash `—` to separate detail in subject line (project convention)
- Body explains **why**, not what

```bash
# Good
fix(dsd): gengivoplasty compositing — handle missing layer tabs

# Good (multi-item)
feat: implement 11 clinical expert corrections across 5 phases

# Bad — too vague
fix: bug fix

# Bad — not conventional
Fixed the DSD simulation bug
```

> [!info] Convention, not enforced
> Conventional commits are followed by convention. There is no commitlint or pre-commit hook validating message format. CI does not check commit messages.

---

## CI/CD Pipeline

### What Runs on Push/PR to `main`

```
┌──────┐  ┌────────────┐  ┌──────┐
│ Lint │  │ Type Check  │  │ Test │     ← Run in parallel
└──┬───┘  └─────┬──────┘  └──┬───┘
   │            │             │
   └────────────┴─────────────┘
                │
           ┌────┴────┐
           │  Build   │     ← Runs only after all three pass
           └─────────┘
```

**Pipeline details** (`.github/workflows/test.yml`):

| Job | Command | Notes |
|-----|---------|-------|
| **Lint** | `pnpm turbo run lint` | ESLint 9 flat config |
| **Type Check** | `pnpm turbo run type-check` | `tsc --noEmit` across all packages |
| **Test** | `pnpm turbo run test` | Vitest, uploads coverage artifact (14 days) |
| **Build** | `pnpm turbo run build` | Vite production build, uploads dist artifact (7 days) |

All jobs use Node.js 20 and pnpm with caching.

### Reproducing CI Locally

```bash
pnpm install --frozen-lockfile
pnpm turbo run lint
pnpm turbo run type-check
pnpm turbo run test
pnpm turbo run build
```

> [!tip] Run before pushing
> CI uses placeholder Supabase URLs. If your code requires real API calls at build time, it will fail in CI even if it works locally.

---

## ESLint: Architecture Enforcement

The ESLint config enforces the [[02-Architecture/Overview|3-layer architecture]] with `no-restricted-imports`:

```
src/pages/**     ──✗──→  @/integrations/supabase/*
src/hooks/domain/**  ──✗──→  @/integrations/supabase/*
```

**Rule:** Pages and domain hooks cannot import Supabase directly. All data access goes through `src/data/` (data client layer).

**Exceptions** (in `eslint.config.js`): Auth pages, SharedEvaluation, useWizardFlow.

This is an **error**, not a warning. Violations will fail the lint CI job.

---

## PR Process

### Before Opening a PR

1. Run the CI checks locally:
   ```bash
   pnpm lint && pnpm type-check && pnpm test && pnpm build
   ```

2. Ensure conventional commit messages on all commits.

3. **If structural change** (new dependency, architecture change, schema change):
   - Create an ADR first (see [[06-ADRs/ADR-Index]])
   - Link ADR in PR description

### PR Description

Include:
- **Summary** — What changed and why (2-3 sentences)
- **Scope** — What's included/excluded
- **Testing** — How to verify the change
- **ADR link** — If structural (mandatory per governance rules)

### Review & Merge

- All 4 CI checks must pass (lint, type-check, test, build)
- Vercel preview deploy provides a testable URL
- Merge to `main` triggers production deploy

---

## Governance Rules

From [[06-ADRs/ADR-Index|ADR governance]]:

| Rule | Enforcement |
|------|-------------|
| Conventional commits | Convention (not CI-enforced) |
| ADR required for structural changes | Policy (review-enforced) |
| Bidirectional links (ADR ↔ Plan ↔ PR) | Policy |
| Rollback plan for structural PRs | Policy |
| pnpm only (no npm/yarn) | `packageManager` field in package.json |
| TypeScript strict mode | `tsconfig.json` across all packages |
| 3-layer architecture | ESLint `no-restricted-imports` (CI-enforced) |

---

## Quick Reference

```bash
# Start feature work
git checkout -b feature/my-feature main

# Work, commit with conventional format
git add <files>
git commit -m "feat(scope): description"

# Push and open PR
git push -u origin feature/my-feature
gh pr create --title "feat(scope): description" --body "..."

# After merge, clean up
git checkout main
git pull
git branch -d feature/my-feature
```

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[04-Development/Setup-Guide]] — Environment Setup
- [[04-Development/Testing-Guide]] — Testing Conventions
- [[06-ADRs/ADR-Index]] — Architecture Decision Records
- [[01-Getting-Started/Troubleshooting]] — Common Issues

---
*Updated: 2026-02-09*
