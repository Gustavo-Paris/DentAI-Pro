---
title: Glossary of Terms
created: 2026-02-05
updated: 2026-02-08
author: Team AURIA
status: published
tags:
  - type/glossary
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[06-ADRs/ADR-Index]]"
---

# Glossary of Terms

> Domain and technical terms used throughout AURIA (formerly DentAI Pro).

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

Referring to the inside of the mouth. Intraoral photos are the primary input for AURIA's AI analysis pipeline.

### Quick Case

A simplified 1-credit analysis mode that skips the full DSD and detailed protocol steps. Provides fast AI assessment for straightforward cases. Contrasts with the full 3-credit "Analisar com IA" flow.

### Complexity Score

An automated case difficulty rating calculated from the AI analysis output. Considers number of teeth involved, treatment types required, and clinical conditions. Used to help dentists triage and prioritize cases.

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

A package that re-exports all symbols from multiple sub-packages through a single entry point. In AURIA, `@repo/page-shell` is the barrel that re-exports all `@pageshell/*` packages. Located at `packages/page-shell/`.

### WizardPage

A PageShell [[#Composite|Composite]] for multi-step flows. Used by the AURIA case analysis wizard (photo upload → patient preferences → AI analysis → DSD → review → protocol). The wizard implementation (`useWizardFlow.ts`) is the largest hook in the codebase at ~1,626 lines.

### SettingsPage

A PageShell [[#Composite|Composite]] for settings and configuration screens. Provides standard layout for grouped settings with sections, toggles, and form controls.

### Credit System

The usage-based billing mechanism in AURIA. Users have monthly credit allowances based on subscription tier (e.g., Elite = 200 credits/month). Quick Case costs 1 credit, full AI analysis costs 3 credits. Credits are deducted via `use_credits()` in `supabase/functions/_shared/credits.ts`.

### Prompt Management Module

Centralized module at `supabase/functions/_shared/prompts/` that manages all AI prompt templates used by Edge Functions. Contains 5 prompts across 7 subdirectories. Follows the adapter pattern with a `MetricsPort` interface. See [[06-ADRs/ADR-003-centralized-prompt-management|ADR-003]].

---

## Infrastructure Terms

### Edge Function

A serverless function running on Supabase's Deno runtime, deployed at the network edge for low latency. AURIA has 8 Edge Functions: 4 AI functions (analyze-dental-photo, generate-dsd, recommend-resin, recommend-cementation) and 4 billing functions (stripe-webhook, create-checkout-session, create-portal-session, sync-subscription). Located at `supabase/functions/`.

### MetricsPort

An interface defined in the [[06-ADRs/ADR-003-centralized-prompt-management|prompt management module]] that abstracts metric persistence. Consumers implement `MetricsPort.log(execution)` to store prompt execution data (tokens, latency, cost). Follows the adapter pattern — the prompt module has zero runtime dependencies.

### PageShell

The layered component design system used by DentAI Pro, organized in 11 packages across 5 layers: Core (L0) > Primitives (L1) > Layouts + Interactions (L2) > Features (L3) > Composites (L4). Shared across projects via monorepo. See [[06-ADRs/ADR-002-pageshell-design-system-adoption|ADR-002]].

---

## See Also

- [[06-ADRs/ADR-Index]] — Architecture Decision Records
- [[docs/00-Index/Home]] — Documentation Hub
- [[02-Architecture/Overview]] — Architecture Overview
- [[02-Architecture/Tech-Stack]] — Technology Stack & Dependencies
- [[plans/2026-02-04-frontend-architecture-design]] — Frontend Architecture Design

---
*Updated: 2026-02-08*
