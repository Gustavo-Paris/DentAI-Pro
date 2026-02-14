# Specialist Feedback Adjustments — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply specialist's clinical feedback — restrict incisal effects to Empress Direct Color only, remove MW from body/enamel options, and hide individual tooth rows in grouped treatment list UI.

**Architecture:** Two independent changes: (1) text edits in the AI prompt template for `recommend-resin` edge function, (2) conditional rendering change in `EvaluationDetails.tsx` to skip individual tooth rows when a group header is shown.

**Tech Stack:** TypeScript (Deno edge functions + React frontend)

**Design doc:** `docs/plans/2026-02-14-specialist-feedback-adjustments-design.md`

---

### Task 1: Restrict Efeitos Incisais to Empress Direct Color only

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:129`
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:139-145`
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:270`

**Step 1: Edit line 129 — materials table**

Change:
```
| Efeitos Incisais   | IPS Color(Ivoclar), Kolor+(Kerr) — Z350 NAO tem corantes! |
```
To:
```
| Efeitos Incisais   | EMPRESS DIRECT COLOR White/Blue (Ivoclar) — UNICA opcao! Z350/Kolor+ NAO! |
```

**Step 2: Edit lines 139-145 — sub-options table**

Change the EFEITOS INCISAIS sub-options table from:
```
EFEITOS INCISAIS (sub-opções):
| Efeito         | Materiais                                                |
|----------------|----------------------------------------------------------|
| Halo Opaco     | Opallis Flow(FGM) ou Empress Opal — 0.1mm borda incisal |
| Corante Branco | Kolor+ White(Kerr) ou IPS Color White — micro-pontos     |
| Corante Ambar  | Kolor+ Amber(Kerr) ou IPS Color Honey — linhas finas     |
| Mamelos        | Dentina clara (A1/B1) em projeções verticais na incisal  |
```
To:
```
EFEITOS INCISAIS (sub-opções):
| Efeito         | Materiais                                                |
|----------------|----------------------------------------------------------|
| Halo Opaco     | Opallis Flow(FGM) ou Empress Opal — 0.1mm borda incisal |
| Corante Branco | Empress Direct Color White — micro-pontos                |
| Corante Ambar  | Empress Direct Color Honey/Amber — linhas finas          |
| Mamelos        | Dentina clara (A1/B1) em projeções verticais na incisal  |
```

**Step 3: Edit line 270 — aesthetic level instruction**

Change:
```
4. Efeitos Incisais (optional:true): Corantes IVOCLAR IPS Empress Direct Color ou IPS Color — NUNCA Z350! Shade DIFERENTE do esmalte (usar CT/GT/BT/YT). Aplicar com pincel fino, 0.1mm.
```
To:
```
4. Efeitos Incisais (optional:true): SEMPRE corantes EMPRESS DIRECT COLOR White/Blue — NUNCA Z350, NUNCA Kolor+! Shade DIFERENTE do esmalte (usar CT/GT/BT/YT). Aplicar com pincel fino, 0.1mm.
```

**Step 4: Verify no other references to Kolor+ exist in this file**

Run: `grep -n "Kolor" supabase/functions/_shared/prompts/definitions/recommend-resin.ts`
Expected: No matches (all removed in steps above).

---

### Task 2: Remove MW from body/enamel options and add simplified alternative rule

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:130`
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:274`
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:282`
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:288` (add after)

**Step 1: Edit line 130 — enamel final table row**

Change:
```
| Esmalte Final      | WE(Palfique LX5), MW(Estelite Omega), A1E/A2E(Z350)      |
```
To:
```
| Esmalte Final      | WE(Palfique LX5), A1E/A2E(Z350)                          |
```

**Step 2: Edit line 274 — P1 priorities**

Change:
```
   - P1: Palfique LX5 (WE), Estelite Omega (MW/WE) — acabamento espelhado
```
To:
```
   - P1: Palfique LX5 (WE), Estelite Omega (WE) — acabamento espelhado. MW NAO SERVE para corpo!
```

**Step 3: Edit line 282 — Estelite Omega color list**

Change:
```
| Estelite Omega      | WE, JE, CT, MW                            |
```
To:
```
| Estelite Omega      | WE, JE, CT                                |
```

**Step 4: Add simplified alternative rule after line 288**

After the `| Palfique LX5 ...` row (last row of the CORES DE ESMALTE POR LINHA table), add:

```
ALTERNATIVA SIMPLIFICADA: Para corpo usar WE/W3/W4 (NUNCA MW). MW e Medium White — inadequado para corpo.
```

This goes right before `=== CLAREAMENTO (BLEACH SHADES) ===`.

---

### Task 3: Commit prompt changes

**Step 1: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "fix(prompt): restrict incisal effects to Empress Direct Color, remove MW from body

Specialist feedback:
- Efeitos incisais: only Empress Direct Color white/blue (no Kolor+, no Z350)
- MW (Medium White) removed from body/enamel — use WE/W3/W4 instead
- Added simplified alternative rule"
```

---

### Task 4: Hide individual tooth rows when group header is shown

**Files:**
- Modify: `apps/web/src/pages/EvaluationDetails.tsx:402-452`

**Step 1: Conditionally skip individual rows**

In `EvaluationDetails.tsx`, the return array at line 364 currently returns:
```tsx
return [
  showGroupHeader && ( /* group header row */ ),
  ...group.evaluations.map((evaluation) => ( /* individual tooth rows */ )),
];
```

Change the spread to only render individual rows when there is NO group header:
```tsx
return [
  showGroupHeader && ( /* group header row - unchanged */ ),
  ...(!showGroupHeader ? group.evaluations.map((evaluation) => ( /* individual tooth rows - unchanged */ )) : []),
];
```

This is a single-line change: wrap the existing `...group.evaluations.map(...)` spread with `...(!showGroupHeader ? group.evaluations.map(...) : [])`.

**Step 2: Verify build passes**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No new errors.

---

### Task 5: Commit UI change

**Step 1: Commit**

```bash
git add apps/web/src/pages/EvaluationDetails.tsx
git commit -m "fix(ui): hide individual tooth rows when group protocol is shown

Specialist feedback: show only the group row (e.g. 'RESINA — 6 DENTES')
with 'Ver Protocolo' button. Individual tooth rows are redundant when
all teeth share the same protocol."
```

---

### Task 6: Deploy edge function

**Step 1: Ensure Docker is running**

Run: `open -a Docker` (if not already running)

**Step 2: Deploy recommend-resin**

Run: `npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker`
Expected: Deployment succeeds.

---

### Summary

| Task | What | File |
|------|------|------|
| 1 | Restrict efeitos incisais to Empress Direct Color | recommend-resin.ts |
| 2 | Remove MW, add WE/W3/W4 rule | recommend-resin.ts |
| 3 | Commit prompt changes | git |
| 4 | Hide individual tooth rows in grouped list | EvaluationDetails.tsx |
| 5 | Commit UI change | git |
| 6 | Deploy edge function | supabase deploy |
