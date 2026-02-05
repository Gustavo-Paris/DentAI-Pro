---
title: Glossary of Terms
created: 2026-02-05
updated: 2026-02-05
author: Team DentAI
status: published
tags:
  - type/glossary
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[06-ADRs/ADR-Index]]"
---

# Glossary of Terms

> Domain and technical terms used throughout DentAI Pro.

---

## Clinical Terms

### DSD

**Digital Smile Design.** A treatment planning methodology that uses digital tools to analyze dental proportions, simulate aesthetic outcomes, and communicate treatment plans visually. In DentAI Pro, DSD involves AI-powered proportion analysis and smile simulation via Google Gemini.

### VITA Color

A standardized shade system (VITA classical / VITA 3D-Master) used worldwide to match dental restorations to natural tooth color. DentAI Pro identifies VITA shades from intraoral photos during AI analysis.

### Stratification

The layered application technique for dental composite resins, building up dentin and enamel layers to replicate natural tooth translucency and color. The resin recommendation engine outputs stratification protocols.

### Cementation

The process of bonding indirect dental restorations (crowns, veneers, inlays) using dental cements. DentAI Pro recommends cementation protocols including cement type, technique, and surface preparation.

### Intraoral

Referring to the inside of the mouth. Intraoral photos are the primary input for DentAI Pro's AI analysis pipeline.

---

## Architecture Terms

### Data Client

The lowest application layer in the [[06-ADRs/ADR-001-3-layer-frontend-architecture|3-layer architecture]]. Typed async functions grouped by entity (`patients.list()`, `evaluations.getById()`) that wrap Supabase queries. Contains no business logic and no React dependencies. Located at `apps/web/src/data/`.

### Domain Hook

The middle layer in the [[06-ADRs/ADR-001-3-layer-frontend-architecture|3-layer architecture]]. React hooks that consume the Data Client via React Query and apply business rules — grouping, filtering, status calculation, derived state. Return domain-shaped data, not raw database rows. Located at `apps/web/src/hooks/domain/`.

### Page Adapter

The top application layer in the [[06-ADRs/ADR-001-3-layer-frontend-architecture|3-layer architecture]]. Thin React components that map Domain Hook output to [[#Composite|PageShell Composite]] props. Contain no business logic, no data fetching, no direct Supabase imports. Located at `apps/web/src/pages/`.

### Composite

A high-level page pattern component from the [[#PageShell|PageShell]] design system (Layer 4). Available composites: `ListPage`, `DetailPage`, `FormPage`, `FormModal`, `DashboardPage`, `WizardPage`, `SettingsPage`. Each encapsulates layout, interaction patterns, and responsive behavior. See [[06-ADRs/ADR-002-pageshell-design-system-adoption|ADR-002]].

### Barrel Package

A package that re-exports all symbols from multiple sub-packages through a single entry point. In DentAI Pro, `@repo/page-shell` is the barrel that re-exports all `@pageshell/*` packages. Located at `packages/page-shell/`.

---

## Infrastructure Terms

### Edge Function

A serverless function running on Supabase's Deno runtime, deployed at the network edge for low latency. DentAI Pro uses Edge Functions for AI processing (Gemini API calls) and Stripe billing. Located at `supabase/functions/`.

### MetricsPort

An interface defined in the [[06-ADRs/ADR-003-centralized-prompt-management|prompt management module]] that abstracts metric persistence. Consumers implement `MetricsPort.log(execution)` to store prompt execution data (tokens, latency, cost). Follows the adapter pattern — the prompt module has zero runtime dependencies.

### PageShell

The layered component design system used by DentAI Pro, organized in 11 packages across 5 layers: Core (L0) > Primitives (L1) > Layouts + Interactions (L2) > Features (L3) > Composites (L4). Shared across projects via monorepo. See [[06-ADRs/ADR-002-pageshell-design-system-adoption|ADR-002]].

---

## See Also

- [[06-ADRs/ADR-Index]] — Architecture Decision Records
- [[docs/00-Index/Home]] — Documentation Hub
- [[plans/2026-02-04-frontend-architecture-design]] — Frontend Architecture Design

---
*Updated: 2026-02-05*
