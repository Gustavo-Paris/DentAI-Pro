---
title: "ADR-010: Accepted Risks"
adr_id: ADR-010
created: 2026-02-27
updated: 2026-02-27
status: accepted
deciders: Team AURIA
tags:
  - type/adr
  - status/published
  - domain/security
  - domain/performance
related:
  - "[[ADR-002-pageshell-design-system-adoption]]"
  - "[[ADR-009-Design-System-Coexistence]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-010: Accepted Risks

## Status

**Accepted** (2026-02-27)

## Context

During the full application audit (2026-02-26), two issues were identified that cannot be fully resolved within the current project scope. Both relate to external dependencies -- Tailwind CSS / Radix UI runtime behavior and the `@parisgroup-ai/pageshell` external package -- and require upstream changes or ecosystem-level shifts to fully address.

Rather than leave these as undocumented tech debt, this ADR formally records them as **accepted risks** with explicit mitigation strategies and review triggers.

### Risk 1: `unsafe-inline` in `style-src` CSP Directive

Tailwind CSS and Radix UI (used via PageShell) generate inline styles at runtime. A strict Content-Security-Policy without `unsafe-inline` for `style-src` would break the UI -- elements would lose positioning, transitions, and dynamic sizing.

The CSS-in-JS and utility-first CSS ecosystem broadly relies on inline style injection. Neither Tailwind nor Radix currently supports nonce-based style injection as a general mechanism.

### Risk 2: `vendor-pageshell` Bundle Size (1069KB)

`@parisgroup-ai/pageshell` is an external package containing the full design system (11 packages). The resulting vendor chunk is ~1069KB uncompressed (~280KB gzipped). This is the single largest chunk in the application bundle.

Optimization requires structural changes in the external pageshell repository (better tree-shaking, sub-path exports, component-level code splitting), which is outside this project's scope.

## Decision

### Risk 1: Accept `unsafe-inline` in `style-src`

Accept `unsafe-inline` in the `style-src` CSP directive. This is a known limitation of the CSS-in-JS / utility-first CSS ecosystem and is the standard practice for applications built with Tailwind CSS and Radix UI.

### Risk 2: Accept Current PageShell Bundle Size

Accept the current ~1069KB vendor-pageshell chunk size. Optimization requires changes in the external pageshell repository, which is maintained separately.

## Alternatives Considered

### Risk 1 Alternatives

#### 1a. Nonce-Based `style-src` (Eliminate `unsafe-inline`)

- **Pros:** Achieves the highest CSP grade for style-src, blocks style injection attacks
- **Cons:** Requires all inline styles to carry a server-generated nonce. Tailwind does not support nonce injection for its runtime styles. Radix UI injects styles dynamically via `document.createElement('style')` without nonce support.
- **Rejected because:** Would break the UI. No viable path without upstream library changes.

#### 1b. Extract All Styles to Static CSS (No Inline Styles)

- **Pros:** No `unsafe-inline` needed, best CSP posture
- **Cons:** Fundamentally incompatible with Tailwind's utility-first model and Radix's runtime style injection. Would require replacing both libraries.
- **Rejected because:** The effort to replace the entire UI stack far exceeds the marginal security gain, given that script-src and other CSP directives already provide XSS mitigation.

### Risk 2 Alternatives

#### 2a. Fork and Optimize PageShell

- **Pros:** Full control over tree-shaking and code splitting
- **Cons:** Maintaining a fork of 11 packages is a significant ongoing burden. Diverges from the upstream design system.
- **Rejected because:** Maintenance cost exceeds the performance benefit. The upstream repository is the appropriate place for these optimizations.

#### 2b. Replace PageShell with Inline Components

- **Pros:** Eliminates the vendor chunk entirely, full tree-shaking control
- **Cons:** Loses the 70-85% code reduction that PageShell composites provide (see [[ADR-009-Design-System-Coexistence]]). Every page would need to re-implement layout, navigation, pagination, and interaction patterns.
- **Rejected because:** The productivity and consistency benefits of PageShell composites outweigh the bundle size cost.

## Consequences

### Positive

- **Transparency** -- Both risks are formally documented with clear ownership and review triggers, rather than existing as undocumented tech debt.
- **Pragmatic security posture** -- The CSP policy is as strict as the ecosystem allows, with `unsafe-inline` scoped to `style-src` only.
- **No unnecessary churn** -- Accepting these risks avoids costly migrations that would provide marginal benefit.

### Negative

- **CSP grade** -- Cannot achieve an A+ CSP grade for `style-src`. Security scanners will flag `unsafe-inline` as a finding.
- **First-load performance** -- The ~280KB gzipped pageshell chunk impacts Time-to-Interactive on slow connections. Lighthouse performance score is lower than ideal.

### Risks

- **Style injection XSS** -- `unsafe-inline` in `style-src` theoretically allows CSS-based data exfiltration (e.g., attribute selectors leaking input values). **Mitigated by:** strict `script-src` policy, input sanitization, and the fact that CSS-only attacks have very limited practical impact compared to script injection.
- **Bundle size growth** -- Future pageshell releases could increase the chunk further. **Mitigated by:** monitoring bundle size in CI and setting alerts if the chunk exceeds 1200KB.

## Mitigation and Review Triggers

### Risk 1: `unsafe-inline` in `style-src`

| Mitigation | Status |
|------------|--------|
| `script-src` CSP directive blocks script injection | Active |
| Input sanitization on all user-facing inputs | Active |
| Monitor Tailwind RFC for nonce-based style support | Watching |
| Monitor Radix UI for nonce-based style injection | Watching |

**Review trigger:** Re-evaluate this decision if Tailwind or Radix ships nonce-based style support.

### Risk 2: `vendor-pageshell` Bundle Size

| Mitigation | Status |
|------------|--------|
| Lazy routes (code-splitting at page level) | Active |
| Tree-shaking via Vite/Rollup | Active |
| Gzip/Brotli compression on CDN | Active |
| Prefetch on hover for critical routes | Active |

**Review trigger:** Re-evaluate if pageshell releases a version with improved tree-shaking or sub-path exports.

## Implementation

No code changes are required. This ADR documents existing conditions and formalizes the acceptance of these risks.

Relevant configuration:

- CSP headers: configured in `vercel.json` (or equivalent deployment config)
- Bundle analysis: `npx vite-bundle-visualizer` shows the `vendor-pageshell` chunk
- PageShell version: `@parisgroup-ai/pageshell` in `apps/web/package.json`

## Links

- [[ADR-002-pageshell-design-system-adoption]] -- PageShell adoption decision
- [[ADR-009-Design-System-Coexistence]] -- PageShell + shadcn/ui coexistence model
- [[ADR-Index]] -- ADR Index

---
*Created: 2026-02-27 | Last updated: 2026-02-27*
