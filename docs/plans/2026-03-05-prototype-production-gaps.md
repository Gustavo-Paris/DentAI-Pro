# Prototype → Production Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the 5 verified gaps between Design OS prototypes and production app.

**Architecture:** Minimal changes — add tab navigation to Result.tsx via ProtocolSections `visibleSection` prop, add visual indicators to 3 components, plumb `patient_age` through CasosTab data layer.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, PageShell primitives, recharts, i18n (react-i18next)

---

## Pre-implementation Notes

**FALSE POSITIVES (already implemented, removed from scope):**
- "Ver Protocolo" quick-link → already in EvaluationTable:130-138 and EvaluationCards:79-87
- "Novo" badge → already in Evaluations.tsx:121-125 with sessionStorage TTL
- MoreVertical context menu → already as MoreHorizontal dropdown in EvaluationTable:169-209 and EvaluationCards:127-156

---

### Task 1: Result.tsx — Tab Navigation for Resina Protocols

**Files:**
- Modify: `apps/web/src/components/protocol/ProtocolSections.tsx`
- Modify: `apps/web/src/pages/Result.tsx`
- Modify: `apps/web/src/locales/pt-BR.json`
- Modify: `apps/web/src/locales/en-US.json`

**Context:** The prototype (`design-src/sections/evaluations/ProtocolPreview.tsx:159-173`) shows a glass-panel tab bar with 4 tabs: Protocolo / Acabamento / Checklist / DSD. Production renders all sections linearly. Tabs only apply to `resina` treatment type (porcelain/special keep current layout).

**Step 1: Add `visibleSection` prop to ProtocolSections**

In `ProtocolSections.tsx`, add an optional prop:
```typescript
// Add to ProtocolSectionsProps interface:
/** When set, only render the specified section (for tabbed layout). Default: render all. */
visibleSection?: 'protocol' | 'finishing' | 'checklist';
```

Then wrap each section group in conditional checks:
- `'protocol'` or undefined → render: layers + resins badge + alternative + alerts + warnings + confidence
- `'finishing'` or undefined → render: FinishingPolishingCard
- `'checklist'` or undefined → render: step-by-step checklist
- When `visibleSection` is set, skip sections that don't match

Implementation: wrap existing JSX blocks with `(!visibleSection || visibleSection === 'xxx')` guards. Special treatment sections always render (they don't use tabs).

**Step 2: Add i18n keys for tab labels**

pt-BR.json — inside `"result"` object:
```json
"tabs": {
  "protocol": "Protocolo",
  "finishing": "Acabamento",
  "checklist": "Checklist",
  "dsd": "DSD"
}
```

en-US.json — inside `"result"` object:
```json
"tabs": {
  "protocol": "Protocol",
  "finishing": "Finishing",
  "checklist": "Checklist",
  "dsd": "DSD"
}
```

**Step 3: Add tab navigation in Result.tsx**

Add `useState` for active tab:
```typescript
type ResultTab = 'protocol' | 'finishing' | 'checklist' | 'dsd';
const [activeTab, setActiveTab] = useState<ResultTab>('protocol');
```

Add tab bar component (matches prototype pattern — `glass-panel rounded-xl px-3 py-2 inline-flex gap-1` with `rounded-full` pills):
```tsx
const RESULT_TABS: { key: ResultTab; labelKey: string }[] = [
  { key: 'protocol', labelKey: 'result.tabs.protocol' },
  { key: 'finishing', labelKey: 'result.tabs.finishing' },
  { key: 'checklist', labelKey: 'result.tabs.checklist' },
  { key: 'dsd', labelKey: 'result.tabs.dsd' },
];
```

Render tab bar AFTER the resin card, BEFORE ProtocolSections — only for `resina` treatment type:
```tsx
{r.treatmentType === 'resina' && r.hasProtocol && (
  <div className="glass-panel rounded-xl px-3 py-2 inline-flex gap-1 mb-6">
    {RESULT_TABS
      .filter(tab => tab.key !== 'dsd' || evaluation.dsd_analysis)
      .map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t(tab.labelKey)}
        </button>
      ))}
  </div>
)}
```

Replace the single `<ProtocolSections>` call with tab-conditional rendering:
```tsx
{/* When tabs active: render per-tab; otherwise: render all */}
{r.treatmentType === 'resina' && r.hasProtocol ? (
  <>
    {activeTab !== 'dsd' && (
      <ProtocolSections
        {...protocolProps}
        visibleSection={activeTab === 'protocol' ? 'protocol' : activeTab === 'finishing' ? 'finishing' : 'checklist'}
      />
    )}
    {activeTab === 'dsd' && evaluation.dsd_analysis && (
      <CollapsibleDSD
        analysis={evaluation.dsd_analysis}
        beforeImage={r.photoUrls.frontal}
        afterImage={r.dsdSimulationUrl}
        defaultOpen={true}
        layers={r.dsdSimulationLayers}
        layerUrls={r.dsdLayerUrls}
      />
    )}
  </>
) : (
  <ProtocolSections {...protocolProps} />
)}
```

Move CollapsibleDSD from its current position (after CaseSummaryBox) into the tab-controlled section. Keep the non-resina DSD rendering where it is.

**Step 4: Run TypeScript check**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: no errors

**Step 5: Commit**

```bash
git add apps/web/src/components/protocol/ProtocolSections.tsx apps/web/src/pages/Result.tsx apps/web/src/locales/pt-BR.json apps/web/src/locales/en-US.json
git commit -m "feat: add tab navigation to Result page (Protocolo/Acabamento/Checklist/DSD)"
```

---

### Task 2: InsightsTab — Trophy Icon on #1 Resin

**Files:**
- Modify: `apps/web/src/pages/dashboard/InsightsTab.tsx`

**Context:** Prototype (`design-src/sections/dashboard/InsightsTab.tsx:314-317`) shows a Trophy icon (`text-warning`) next to the #1 resin name. Production uses recharts BarChart with plain YAxis labels.

**Step 1: Add trophy indicator**

Import `Trophy` from lucide-react (add to existing import).

In `TopResinsChart`, add a custom `tick` component for YAxis that renders Trophy for the first item:

```tsx
function TopResinTick({ x, y, payload, index }: any) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-4} y={0} dy={4} textAnchor="end" fontSize={11} fill="currentColor" className="fill-foreground">
        {payload.value}
      </text>
      {index === 0 && (
        <foreignObject x={-4} y={-8} width={16} height={16}>
          <Trophy className="w-3.5 h-3.5 text-warning" />
        </foreignObject>
      )}
    </g>
  );
}
```

Actually, `foreignObject` in recharts SVG can be tricky. Simpler approach: add a small trophy indicator ABOVE the chart for the #1 resin:

```tsx
{resins.length > 0 && (
  <div className="flex items-center gap-1.5 mb-2">
    <Trophy className="w-3.5 h-3.5 text-warning" />
    <span className="text-xs font-medium">{resins[0].name}</span>
  </div>
)}
```

Place after the `<h3>` title and before `<ChartContainer>`.

**Step 2: Run TypeScript check**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/dashboard/InsightsTab.tsx
git commit -m "feat: add trophy indicator for #1 resin in InsightsTab"
```

---

### Task 3: PrincipalTab — Credit Cost Hint on HeroCard

**Files:**
- Modify: `apps/web/src/pages/dashboard/PrincipalTab.tsx`
- Modify: `apps/web/src/locales/pt-BR.json`
- Modify: `apps/web/src/locales/en-US.json`

**Context:** Prototype (`design-src/sections/dashboard/PrincipalTab.tsx:64`) shows `"2 creditos"` sub-label below the CTA. Production HeroCard has title + subtitle but no credit cost hint.

**Step 1: Add i18n key**

pt-BR.json — inside `"dashboard" > "hero"`:
```json
"creditsCost": "{{count}} créditos"
```

en-US.json — inside `"dashboard" > "hero"`:
```json
"creditsCost": "{{count}} credits"
```

Wait — `dashboard.hero.credits` already exists with `"{{count}} créditos"` / `"{{count}} credits"`. Use that key directly.

**Step 2: Add credit hint to HeroCard**

Import `useSubscription` and `Zap` in PrincipalTab. In `HeroCard`, call `useSubscription()` to get `getCreditCost`. Compute total cost:
```tsx
const { getCreditCost } = useSubscription();
const totalCost = getCreditCost('case_analysis') + getCreditCost('dsd_simulation');
```

Add a small sub-text after the subtitle `<p>`:
```tsx
<span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
  <Zap className="w-3 h-3 text-primary" />
  {t('dashboard.hero.credits', { count: totalCost })}
</span>
```

**Step 3: Run TypeScript check**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add apps/web/src/pages/dashboard/PrincipalTab.tsx
git commit -m "feat: add credit cost hint to dashboard HeroCard"
```

---

### Task 4: CasosTab — Patient Age on Session Cards

**Files:**
- Modify: `apps/web/src/data/evaluations.ts` (add `patient_age` to select)
- Modify: `apps/web/src/hooks/domain/useEvaluationSessions.ts` (add to types + grouping)

**Context:** Dashboard `SessionCard` already renders `patientAge` when available (line 110). But `CasosTab` uses `useEvaluationSessions` which fetches via `evaluations.list()` — this query doesn't include `patient_age`. The `useDashboard` hook DOES include it, so PrincipalTab sessions show age but CasosTab sessions don't.

**Step 1: Add `patient_age` to evaluations.list() select**

In `apps/web/src/data/evaluations.ts:118`, add `patient_age` to the select string:
```typescript
'id, created_at, patient_name, patient_age, tooth, cavity_class, status, session_id, treatment_type'
```

**Step 2: Add to RawEvaluation type**

In `apps/web/src/hooks/domain/useEvaluationSessions.ts`, add to `RawEvaluation`:
```typescript
patient_age: number | null;
```

**Step 3: Add to EvaluationSession type**

```typescript
patientAge: number | null;
```

**Step 4: Carry through in groupBySession**

In `groupBySession`, add to the return object:
```typescript
patientAge: evals[0].patient_age ?? null,
```

**Step 5: Run TypeScript check**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: no errors (SessionCard already accepts optional `patientAge`)

**Step 6: Commit**

```bash
git add apps/web/src/data/evaluations.ts apps/web/src/hooks/domain/useEvaluationSessions.ts
git commit -m "feat: show patient age on CasosTab session cards"
```

---

### Task 5: SubscriptionStatus — Rollover Credits as Badge

**Files:**
- Modify: `apps/web/src/components/pricing/SubscriptionStatus.tsx`

**Context:** Prototype (`design-src/sections/profile/ProfilePreview.tsx:273-277`) shows rollover credits as an inline badge: `rounded-full px-2.5 py-1 bg-muted`. Production shows it as a grid cell (`p-3 bg-muted/30 rounded-lg`). Change to badge style for more prominent, compact display.

**Step 1: Replace rollover grid cell with inline badge**

In `SubscriptionStatus.tsx`, change the rollover credits section (lines 177-185) from a grid cell to an inline badge placed after the credit breakdown grid:

```tsx
{creditsRollover > 0 && (
  <div className="flex items-center gap-1.5">
    <RefreshCw className="h-3 w-3 text-success" />
    <span className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 bg-muted text-muted-foreground font-medium">
      +{creditsRollover} {t('pricing.creditRollover')}
    </span>
  </div>
)}
```

Move it OUT of the grid and after the grid `</div>`. Keep the grid with only the plan credits cell (full width when rollover is 0, or single column).

**Step 2: Run TypeScript check**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add apps/web/src/components/pricing/SubscriptionStatus.tsx
git commit -m "feat: show rollover credits as inline badge in SubscriptionStatus"
```

---

### Task 6: Final Verification

**Step 1:** Run `pnpm --filter web exec tsc --noEmit` — should pass clean.

**Step 2:** Visual verification checklist:
- [ ] Result page (resina): tab bar visible, switching between Protocolo/Acabamento/Checklist/DSD works
- [ ] Result page (porcelain/special): no tab bar, current layout preserved
- [ ] InsightsTab: Trophy icon visible next to #1 resin name
- [ ] Dashboard HeroCard: credit cost hint visible below subtitle
- [ ] CasosTab: patient age shown on session cards (desktop)
- [ ] SubscriptionStatus: rollover credits as badge, not grid cell

**Step 3:** Final commit with any cleanup.
