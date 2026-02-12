---
title: "DSD Improvements: Chaining, Protocols, Grouping"
created: 2026-02-11
updated: 2026-02-11
status: draft
tags: [type/plan, status/draft]
---

# DSD Improvements: Full Layer Chaining, Gengivoplasty Protocol, Unified Group Protocol

## Summary

Three improvements to the DSD simulation and protocol system:

1. **Full L1→L2→L3 layer chaining** — each layer uses the previous layer's composited output as input for visual consistency
2. **Gengivoplasty protocol in evaluation results** — auto-include GENGIVO as a selected tooth when gengivoplasty was approved in DSD
3. **Unified group protocol view** — new dedicated route showing one protocol covering all grouped teeth

---

## 1. Full Layer Chaining (L1→L2→L3)

### Current behavior

- Layer 1 (restorations-only) and Layer 2 (whitening+restorations) are generated **in parallel**, both from the **original photo**
- Layer 3 (complete-treatment) uses Layer 2's composited output as input (already implemented)

### Problem

Layer 2 starts from scratch instead of building on Layer 1. This means whitening is applied to the original teeth rather than to already-corrected teeth. Visual inconsistency between layers.

### Solution — Sequential chaining

Generate layers sequentially: **L1 → composite → L2 → composite → L3**

**Prompt changes** (`dsd-simulation.ts`):

Add a new `buildWhiteningOnlyPrompt(params)` function (analogous to `buildGengivoplastyOnlyPrompt`):
- Removes tooth corrections/reshaping instructions (already applied)
- Keeps ONLY whitening instructions + absolute lip preservation
- Adds: "The input image ALREADY has corrected teeth. Do NOT change tooth shape. ONLY apply whitening."

Update `buildWithWhiteningPrompt()`:
- When `params.inputAlreadyProcessed === true`, delegate to `buildWhiteningOnlyPrompt()`

**Edge function** (`generate-dsd/index.ts`):

No changes needed — `inputAlreadyProcessed` flag already supported.

**Client** (`useDSDStep.ts`):

Modify `generateAllLayers()`:
```
Phase 1: Generate L1 (restorations-only) from original photo
         → composite L1 (teeth-only onto original)
Phase 2: Generate L2 (whitening-restorations) using L1 composite as input
         → pass inputAlreadyProcessed: true
         → composite L2
Phase 3: Generate L3 (complete-treatment) using L2 composite as input
         → pass inputAlreadyProcessed: true (already implemented)
```

Remove the `initialSimulationUrl` optimization for L2 since L2 now depends on L1.

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts` | Add `buildWhiteningOnlyPrompt`, update `buildWithWhiteningPrompt` to delegate when `inputAlreadyProcessed` |
| `apps/web/src/components/wizard/dsd/useDSDStep.ts` | Sequential L1→L2→L3 in `generateAllLayers()` |

---

## 2. Gengivoplasty Protocol in Evaluation Results

### Current behavior

When the user approves gengivoplasty in the DSD step, the `gingivoplastyApproved` flag lives only inside `useDSDStep`. The review step and submit flow don't know about it, so no GENGIVO evaluation is created.

### Solution — Surface flag to review, auto-include GENGIVO

**Flow**: `useDSDStep` → `DSDResult` → wizard state → ReviewAnalysisStep → Submit

1. Add `gingivoplastyApproved?: boolean` to `DSDResult` interface
2. In `useDSDStep.handleContinue()`, include `gingivoplastyApproved` in the result passed to `onComplete`
3. In `NewCase.tsx` ReviewAnalysisStep render, pass `dsdResult.gingivoplastyApproved` as a new prop
4. In `ReviewAnalysisStep` / `ToothSelectionCard`, when `gingivoplastyApproved === true`:
   - Auto-add `'GENGIVO'` to `selectedTeeth` on mount (pre-selected, user can deselect)
   - Show a visual indicator (badge or info banner) that gengivoplasty is included
5. Submit flow already handles `tooth === 'GENGIVO'` with generic protocol — no changes needed there

### Files to modify

| File | Change |
|------|--------|
| `apps/web/src/types/dsd.ts` | Add `gingivoplastyApproved?: boolean` to `DSDResult` |
| `apps/web/src/components/wizard/dsd/useDSDStep.ts` | Include flag in `handleContinue` result |
| `apps/web/src/components/wizard/ReviewAnalysisStep.tsx` | Accept prop, auto-add GENGIVO |
| `apps/web/src/components/wizard/review/ToothSelectionCard.tsx` | Show GENGIVO entry when approved |

---

## 3. Unified Group Protocol Route

### Current behavior

In `EvaluationDetails.tsx`, `groupByTreatment()` groups evaluations with identical protocols (same resin + same stratification layers). The "Ver Protocolo" button on a group navigates to `/result/${group.evaluations[0].id}` — the first tooth's individual result page. This is misleading: the user sees protocol for tooth 11 only, not for teeth 11, 12, 21, 22.

### Solution — New route `/result/group/:sessionId/:fingerprint`

1. **New route** `/result/group/:sessionId/:fingerprint` that loads all evaluations in the group and displays:
   - Header: "Protocolo Unificado — Dentes 11, 12, 21, 22"
   - Single protocol display (same components as Result.tsx)
   - List of covered teeth with their individual badges

2. **Navigation change** in `EvaluationDetails.tsx`: group "Ver Protocolo" button navigates to the new route instead of first evaluation's result page.

3. **Fingerprint encoding**: URL-encode the `getProtocolFingerprint()` value and pass as route param. The new page uses it to filter evaluations by matching fingerprint.

4. **New hook** `useGroupResult.ts`:
   - Reads `sessionId` and `fingerprint` from route params
   - Loads all evaluations for the session
   - Filters to those matching the fingerprint
   - Returns: protocol data from first evaluation, list of all teeth in group, shared data

5. **New page** `GroupResult.tsx`:
   - Reuses existing protocol components (ProtocolTable, ProtocolChecklist, etc.)
   - Shows "Dentes: 11, 12, 21, 22" in header
   - Single checklist (checking an item checks it for ALL evaluations in group)
   - Single "Mark as completed" marks ALL evaluations

### Files to create/modify

| File | Change |
|------|--------|
| `apps/web/src/pages/GroupResult.tsx` | New page component |
| `apps/web/src/hooks/domain/useGroupResult.ts` | New hook for group data |
| `apps/web/src/App.tsx` or router config | Add `/result/group/:sessionId/:fingerprint` route |
| `apps/web/src/pages/EvaluationDetails.tsx` | Update group "Ver Protocolo" navigation |

---

## Implementation Order

1. **Layer chaining** (prompt + client) — independent, can be deployed and tested alone
2. **Gengivoplasty protocol** (type + DSD step + review) — independent, straightforward data flow
3. **Group protocol route** (new page + hook + routing) — most code, but isolated from other changes

## Verification

- Layer chaining: Generate all 3 layers, compare teeth color across L1→L2→L3 — should be consistent
- Gengivoplasty: Approve gingivoplasty in DSD → review step shows GENGIVO pre-selected → submit creates GENGIVO evaluation with protocol
- Group protocol: Click "Ver Protocolo" on a 4-tooth group → see unified page with all teeth listed, single checklist
