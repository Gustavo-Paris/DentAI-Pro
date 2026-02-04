# WizardPage Consolidation Analysis

> Task 7: Document WizardPage vs EnhancedWizardPage Differences
> Created: 2026-01-09

## Current State

| File | Lines | Dependencies | Purpose |
|------|-------|--------------|---------|
| `WizardPage.tsx` | 435 | `@pageshell/core`, `@pageshell/primitives` | Basic step-by-step wizard |
| `EnhancedWizardPage.tsx` | 438 | `@pageshell/core`, `@pageshell/primitives`, `@pageshell/interactions`, `@pageshell/features`, `@pageshell/theme`, `react-hook-form`, `lucide-react` | Full-featured AI-integrated wizard |

Despite similar line counts, these are **fundamentally different components** targeting distinct use cases.

## Architecture Comparison

### WizardPage (Simple)

```
WizardPage
  |-- useWizardLogic (from @pageshell/core)
  |-- StepIndicator (internal component)
  |-- WizardBackground
  |-- WizardSidePanel
```

**Key Characteristics:**
- Self-contained step state management via `useWizardLogic` hook from core
- Generic `TValues` type for form values (flexible)
- StepIndicator rendered inline with checkmarks
- Navigation with keyboard hints
- Resumable via localStorage (simple config)
- Side panel via config OR slots (legacy)
- No external dependencies beyond core/primitives

### EnhancedWizardPage (Full-Featured)

```
EnhancedWizardPage
  |-- useWizardPageLogic (custom hook in ./hooks/)
  |-- WizardProgress (from @pageshell/interactions)
  |-- WizardBackground (from @pageshell/interactions)
  |-- WizardSkeleton (from @pageshell/interactions)
  |-- WizardChatPanel (AI integration)
  |-- EnhancedWizardSidePanel
  |-- FormFieldsRenderer (declarative fields)
  |-- PageShellProvider (theme context)
```

**Key Characteristics:**
- Controlled step management (parent controls `currentStep`)
- React Hook Form integration (`UseFormReturn<TFieldValues>`)
- Declarative fields API per step
- AI Chat Panel with message streaming
- Query integration (loading, error, data states)
- Completion redirect with pattern interpolation
- Theme-aware wrapper (`PageShellProvider`)
- Skip step functionality
- Validation error banners

## Feature Matrix

| Feature | WizardPage | EnhancedWizardPage |
|---------|:----------:|:------------------:|
| Step indicator | Inline checkmarks | WizardProgress (bar/dots/steps) |
| Keyboard navigation | Yes | Yes |
| Resumable progress | Yes | Yes |
| Side panel | Yes (config + slots) | Yes (config + slots) |
| Background variants | Yes | Yes |
| **AI Chat integration** | No | Yes |
| **Declarative fields** | No | Yes (FormFieldsRenderer) |
| **Query integration** | No | Yes (loading/error states) |
| **React Hook Form** | No | Yes (required for fields) |
| **Skip step** | No | Yes |
| **Completion redirect** | No | Yes (with :param interpolation) |
| **Theme provider** | No | Yes (PageShellProvider) |
| **Validation banner** | No | Yes |
| Step indexing | 0-based | 1-based |

## Code Duplication Analysis

### Shared Patterns (Potential Extraction)
1. **Keyboard navigation logic** - Both implement similar arrow key handling
2. **Resumable storage** - Similar localStorage patterns (already shared via `defaults.ts`)
3. **Side panel visibility** - Similar `showInSteps` logic
4. **Scroll-to-top on step change** - Identical pattern

### NOT Duplicated (Intentionally Different)
1. **Step state management** - WizardPage uses internal state, Enhanced uses controlled props
2. **Step indexing** - WizardPage 0-based, Enhanced 1-based
3. **Form handling** - WizardPage generic values, Enhanced requires react-hook-form
4. **Progress indicator** - Inline vs WizardProgress component

### Code Overlap Estimate
- ~15-20% shared patterns (keyboard nav, storage utils)
- ~80% unique implementation per variant

## Use Case Guidance

### Use WizardPage When:
- Simple onboarding flows
- Configuration wizards without complex forms
- Surveys or multi-step questionnaires
- No AI assistance needed
- Lightweight dependency footprint required
- 0-indexed step handling preferred

### Use EnhancedWizardPage When:
- AI-assisted creation flows (course creation, content generation)
- Complex forms with validation per step
- Need declarative field definitions
- Integrating with tRPC queries
- Requiring theme context
- 1-indexed step handling preferred (matches human language)

## Recommendation

**DO NOT CONSOLIDATE** - These serve fundamentally different use cases:

| Aspect | WizardPage | EnhancedWizardPage |
|--------|------------|-------------------|
| Complexity | Low | High |
| Dependencies | Minimal | Full stack |
| Target | Simple forms | AI-assisted flows |
| Form lib | Optional | react-hook-form |
| Bundle impact | Light | Heavier |

### Rationale
1. **Different abstractions** - WizardPage manages its own state; EnhancedWizardPage expects controlled state
2. **Different dependencies** - Consolidating would force react-hook-form on simple wizards
3. **Bundle size** - WizardPage users shouldn't pay for AI chat, form renderers
4. **API stability** - Both have established APIs; merging would break consumers

## Action Items

### Recommended Improvements

- [ ] **Extract shared keyboard navigation** to `useWizardKeyboardNav` hook
- [ ] **Unify step indexing** - Consider making WizardPage 1-indexed with migration guide
- [ ] **Document use case guidance** in index.ts JSDoc
- [ ] **Add WizardPage.Simple alias** for clearer naming intent

### Keep As-Is
- [ ] Separate type definitions (`types.ts` vs `enhanced-types.ts`)
- [ ] Separate hook files (`@pageshell/core` vs local `hooks/`)
- [ ] Different step state models (internal vs controlled)

### Documentation Needed
- [ ] Add TSDoc examples showing when to use each
- [ ] Create migration guide for switching between variants
- [ ] Document the declarative fields API separately

## References

- `WizardPage.tsx` - Simple wizard implementation
- `EnhancedWizardPage.tsx` - Full-featured implementation
- `hooks/useWizardPageLogic.ts` - Enhanced logic hook
- `FormFieldsRenderer.tsx` - Declarative fields system
- `components/WizardChatPanel.tsx` - AI chat integration
