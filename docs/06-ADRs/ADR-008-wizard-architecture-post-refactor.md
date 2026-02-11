---
title: "ADR-008: Wizard Architecture (Post-Refactor)"
adr_id: ADR-008
created: 2026-02-10
updated: 2026-02-10
status: accepted
deciders: Team DentAI
tags:
  - type/adr
  - status/accepted
  - domain/frontend
  - domain/architecture
related:
  - "[[ADR-001-3-layer-frontend-architecture]]"
  - "[[ADR-004-credit-model-and-monetization]]"
  - "[[ADR-006-ai-integration-strategy]]"
  - "[[ADR-007-clinical-photo-storage]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-008: Wizard Architecture (Post-Refactor)

## Status

**Accepted** (2026-02-10)

## Context

The AURIA case creation wizard (`NewCase.tsx`) is the most complex page in the application. Before refactoring, it was a single monolithic component with:

- **25+ `useState` calls** in a single component.
- **~800 lines of business logic** mixing navigation, photo analysis, DSD integration, form state, submission, and draft persistence.
- **Circular dependencies** between navigation logic and photo analysis (navigation triggers analysis, analysis changes the step).
- **No separation of concerns** -- credit checking, AI calls, patient creation, and protocol generation all lived in the same function.

This made the wizard nearly impossible to test, debug, or extend. Adding new features (e.g., credit confirmation, patient preferences, additional photos) required modifying an already-overloaded component.

## Decision

Decompose the wizard into an **orchestrator hook** (`useWizardFlow`) that delegates to **6 specialized sub-hooks**, following the domain hook pattern from [[ADR-001-3-layer-frontend-architecture]].

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  NewCase.tsx (Page Adapter)                                  │
│  - Maps wizard state to PageShell WizardPage composite       │
│  - Passes props to step components                           │
├──────────────────────────────────────────────────────────────┤
│  useWizardFlow (Orchestrator)                                │
│  - Owns shared state (imageBase64, analysisResult, etc.)     │
│  - Composes sub-hooks                                        │
│  - Manages side effects (auto-save, beforeunload, etc.)      │
│  - Returns unified WizardFlowState & WizardFlowActions       │
├──────────────────────────────────────────────────────────────┤
│  Sub-hooks (apps/web/src/hooks/domain/wizard/)               │
│  ┌──────────────────┬────────────────────────────────────┐   │
│  │ usePhotoAnalysis  │ Photo upload, AI analysis, reanalyze │ │
│  │ useDSDIntegration │ DSD flow: skip, complete, update    │ │
│  │ useWizardSubmit   │ Per-tooth parallel submission       │ │
│  │ useWizardNavigation│ Step transitions, credit pre-check │ │
│  │ useWizardReview   │ Form field updates, patient select  │ │
│  │ useWizardDraftRestore│ Draft load/restore/discard       │ │
│  └──────────────────┴────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│  Data Layer (apps/web/src/data/wizard.ts)                    │
│  - uploadPhoto, downloadPhoto                                │
│  - createPatient, createEvaluation                           │
│  - invokeRecommendResin, invokeRecommendCementation          │
│  - savePendingTeeth, updateEvaluationStatus                  │
└──────────────────────────────────────────────────────────────┘
```

### The 6 Sub-Hooks

| Hook | File | Responsibility |
|------|------|---------------|
| `usePhotoAnalysis` | `wizard/usePhotoAnalysis.ts` | Manages photo capture, base64 conversion, AI analysis invocation, reanalysis, uploaded photo path tracking |
| `useDSDIntegration` | `wizard/useDSDIntegration.ts` | Handles DSD completion, skip, and result updates; merges DSD suggestions into selected teeth |
| `useWizardSubmit` | `wizard/useWizardSubmit.ts` | Orchestrates multi-tooth parallel submission with `Promise.allSettled`, per-tooth retry, patient creation, pending teeth persistence |
| `useWizardNavigation` | `wizard/useWizardNavigation.ts` | Step state machine (0-6), direction tracking, credit pre-checks before advancing, abort handling |
| `useWizardReview` | `wizard/useWizardReview.ts` | Form data updates, tooth treatment changes, AI suggestion restoration, patient selection, birth date handling |
| `useWizardDraftRestore` | `wizard/useWizardDraftRestore.ts` | Loads persisted drafts from storage, presents restore/discard modal, rehydrates wizard state from draft |

### Supporting Files

| File | Purpose |
|------|---------|
| `wizard/types.ts` | `WizardFlowState`, `WizardFlowActions`, `SubmissionStep`, `CreditConfirmData` types |
| `wizard/constants.ts` | `INITIAL_FORM_DATA`, `ANTERIOR_TEETH` list |
| `wizard/helpers.ts` | Pure functions: `inferCavityClass`, `getFullRegion`, `getGenericProtocol`, `isAnterior` |

### Circular Dependency Resolution

The wizard has a fundamental circular dependency: **navigation needs to trigger photo analysis** (when moving to step 2), but **photo analysis needs to set the step** (when analysis completes, move to step 3).

This is resolved using **forward refs**:

```typescript
// In useWizardFlow orchestrator:

// Forward ref: navigation calls analyzePhoto, but photo hook is created after navigation.
const analyzePhotoRef = useRef<() => void>(() => {});
const photoSettersRef = useRef({
  setAnalysisError: (_error: string | null) => {},
  setIsAnalyzing: (_analyzing: boolean) => {},
});

// Create navigation hook first (with forward refs)
const nav = useWizardNavigation({
  analyzePhoto: () => analyzePhotoRef.current(),
  setAnalysisError: (error) => photoSettersRef.current.setAnalysisError(error),
  // ...
});

// Create photo hook second
const photo = usePhotoAnalysis({ setStep: nav.setStep, /* ... */ });

// Wire up forward refs now that photo hook is created
analyzePhotoRef.current = photo.analyzePhoto;
photoSettersRef.current.setAnalysisError = photo.setAnalysisError;
```

### Parallel Protocol Generation

On submission, the wizard processes all selected teeth in parallel:

```typescript
const results = await Promise.allSettled(
  teethToProcess.map(async (tooth) => {
    const evaluation = await wizardData.createEvaluation(insertData);
    await withRetry(async () => {
      switch (normalizedTreatment) {
        case 'resina': await wizardData.invokeRecommendResin({ ... });
        case 'porcelana': await wizardData.invokeRecommendCementation({ ... });
        // ...
      }
    }, { maxRetries: 2, baseDelay: 2000 });
  })
);
```

This enables **partial success** -- if 3 of 5 teeth complete, those 3 are saved. Failed teeth are marked with `status: 'error'` and the user is notified.

### Draft Persistence

The wizard auto-saves state to local storage on every meaningful change (from step 1 with a captured image):

```typescript
useEffect(() => {
  if (nav.step >= 1 && imageBase64 !== null && user) {
    saveDraft({
      step: nav.step, formData, selectedTeeth,
      toothTreatments, analysisResult, dsdResult,
      uploadedPhotoPath, additionalPhotos, patientPreferences,
    });
  }
}, [nav.step, formData, selectedTeeth, /* ... */]);
```

On mount, the wizard checks for a pending draft and offers a restore/discard modal.

### Credit Confirmation Flow

Before operations that consume credits, the wizard presents a confirmation dialog:

```typescript
const confirmCreditUse = useCallback(
  (operation: string, operationLabel: string): Promise<boolean> => {
    return new Promise((resolve) => {
      creditConfirmResolveRef.current = resolve;
      setCreditConfirmData({ operation, operationLabel, cost, remaining: creditsRemaining });
    });
  },
  [getCreditCost, creditsRemaining],
);
```

The navigation hook calls `confirmCreditUse()` before advancing to steps that trigger AI calls (analysis, DSD). The Promise resolves when the user clicks confirm or cancel. See [[ADR-004-credit-model-and-monetization]] for the credit system details.

### Wizard Steps

| Step | Name | Key Actions |
|------|------|-------------|
| 0 | Photo Capture | Capture/upload intraoral photo + optional additional photos |
| 1 | Patient Preferences | Whitening level selection |
| 2 | AI Analysis | Auto-triggered photo analysis (credit check first) |
| 3 | Review/Edit | Edit AI-detected data, select teeth, assign treatments |
| 4 | DSD | Optional: Digital Smile Design analysis + simulation |
| 5 | Final Review | Confirm before submission |
| 6 | Submission | Per-tooth parallel protocol generation with progress UI |

### Beforeunload Protection

Steps 2-5 show a browser confirmation dialog when the user tries to navigate away, preventing accidental loss of in-progress work.

## Alternatives Considered

### 1. Keep Monolithic Hook

- **Pros:** No refactoring cost, single file to maintain
- **Cons:** 800+ lines in a single hook, impossible to test individual concerns, every feature addition increases complexity exponentially
- **Rejected because:** The wizard was already at the limit of maintainability. Adding credit confirmation, additional photos, and DSD layers would have pushed it past 1200 lines.

### 2. State Machine (XState)

- **Pros:** Formal state machine with visual diagram, impossible invalid states, built-in side effect management
- **Cons:** Steep learning curve, heavy dependency, difficult to integrate with React Query and existing hooks
- **Rejected because:** The step progression is relatively linear (0-6). A formal state machine adds complexity without proportional benefit for this flow. The ref-based forward dependency resolution is simpler.

### 3. Multi-Page Wizard (React Router)

- **Pros:** Each step is a separate page/route, clean separation, browser back/forward works natively
- **Cons:** Requires shared state across routes (context or URL params), loses form state on navigation errors, additional route configuration
- **Rejected because:** The wizard needs to share large state objects (base64 images, analysis results) between steps. Serializing this to URL params or context is impractical.

## Consequences

### Positive

- **Testable units** -- Each sub-hook can be tested independently with mocked dependencies.
- **Separation of concerns** -- Navigation logic, photo analysis, and submission are in separate files.
- **Extensibility** -- Adding a new step or feature means creating a new sub-hook rather than modifying a 800-line function.
- **Partial success** -- Parallel per-tooth submission allows partial completion.
- **Draft safety** -- Auto-save prevents loss of work on browser crashes or accidental navigation.

### Negative

- **File count** -- 6 sub-hooks + types + constants + helpers = 9 files for one feature.
- **Forward ref complexity** -- The circular dependency resolution pattern is non-obvious and fragile.
- **Prop threading** -- The orchestrator passes many props to each sub-hook, creating long parameter lists.

### Risks

- **Forward ref staleness** -- If the ref wiring order changes, navigation could call stale photo analysis functions. Mitigated by the deterministic hook creation order in the orchestrator.
- **Auto-save performance** -- Saving large state (with base64 images) on every change could cause jank. Mitigated by debouncing in `useWizardDraft`.

## Implementation

Key files:

- `apps/web/src/hooks/domain/useWizardFlow.ts` -- Orchestrator
- `apps/web/src/hooks/domain/wizard/usePhotoAnalysis.ts` -- Photo analysis sub-hook
- `apps/web/src/hooks/domain/wizard/useDSDIntegration.ts` -- DSD sub-hook
- `apps/web/src/hooks/domain/wizard/useWizardSubmit.ts` -- Submission sub-hook
- `apps/web/src/hooks/domain/wizard/useWizardNavigation.ts` -- Navigation sub-hook
- `apps/web/src/hooks/domain/wizard/useWizardReview.ts` -- Review sub-hook
- `apps/web/src/hooks/domain/wizard/useWizardDraftRestore.ts` -- Draft restore sub-hook
- `apps/web/src/hooks/domain/wizard/types.ts` -- Shared types
- `apps/web/src/hooks/domain/wizard/constants.ts` -- Initial form data
- `apps/web/src/hooks/domain/wizard/helpers.ts` -- Pure helper functions
- `apps/web/src/data/wizard.ts` -- Data layer (storage, patients, evaluations, edge function calls)
- `apps/web/src/pages/NewCase.tsx` -- Page adapter

## Links

- [[ADR-001-3-layer-frontend-architecture]] -- The 3-layer pattern this refactor follows
- [[ADR-004-credit-model-and-monetization]] -- Credit confirmation flow
- [[ADR-006-ai-integration-strategy]] -- AI edge functions called during submission
- [[ADR-007-clinical-photo-storage]] -- Photo upload during wizard flow
- [[ADR-Index]] -- ADR Index

---
*Created: 2026-02-10 | Last updated: 2026-02-10*
