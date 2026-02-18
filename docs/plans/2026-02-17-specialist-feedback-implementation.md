# Specialist Feedback Corrections — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix DSD analysis false positives, improve restoration detection, harden stratification protocol validation, and improve simulation quality — all based on specialist clinical feedback.

**Architecture:** Prompt edits in edge function definitions + post-processing validation hardening in shade-validation.ts + threshold fix in smile-line-classifier.ts. No schema changes. No frontend changes except minor retry in share link.

**Tech Stack:** Deno edge functions, Claude Sonnet 4.5 / Haiku 4.5 prompts, Gemini simulation prompts, TypeScript

---

### Task 1: Fix smile line classifier threshold (false positive gengivoplasty)

**Files:**
- Modify: `supabase/functions/generate-dsd/smile-line-classifier.ts:70` (numeric override)
- Modify: `supabase/functions/_shared/prompts/definitions/smile-line-classifier.ts:37-39` (classifier prompt)
- Modify: `supabase/functions/_shared/prompts/shared/clinical-rules.ts:89` (GINGIVAL_CRITERIA shared rule)

**Step 1: Fix numeric override threshold in smile-line-classifier.ts**

In `smile-line-classifier.ts`, change line 70 from:
```typescript
if (classifierResult && classifierResult.gingival_exposure_mm >= 2 && analysis.smile_line !== 'alta') {
```
to:
```typescript
if (classifierResult && classifierResult.gingival_exposure_mm >= 3 && analysis.smile_line !== 'alta') {
```

Also update comment on line 68-69 from `≥2mm` to `≥3mm` and observation text on line 79 from `≥2mm` to `≥3mm`.

**Step 2: Fix classifier prompt thresholds**

In `smile-line-classifier.ts` (prompt definition), update PASSO 3 (lines 37-39):

Old:
```
- >=2mm de rosa claro entre labio e dentes → "alta" (gingival_exposure_mm = valor estimado)
- ~1mm de rosa claro em 2+ dentes → "alta" (gingival_exposure_mm = 1)
- ~1mm em 1 dente apenas → "media" (gingival_exposure_mm = 1)
```

New:
```
- >=3mm de rosa claro entre labio e dentes → "alta" (gingival_exposure_mm = valor estimado)
- 1-2mm de rosa claro em 2+ dentes → "media" (gingival_exposure_mm = valor estimado)
- ~1mm em 1 dente apenas → "media" (gingival_exposure_mm = 1)
```

**Step 3: Align GINGIVAL_CRITERIA shared rule**

In `clinical-rules.ts`, line 89, change `(>=2mm)` to `(>=3mm)`:

Old:
```
ha faixa rosa (>=2mm) entre onde o labio termina e onde os dentes comecam
```
New:
```
ha faixa rosa (>=3mm) entre onde o labio termina e onde os dentes comecam
```

**Step 4: Commit**

```bash
git add supabase/functions/generate-dsd/smile-line-classifier.ts supabase/functions/_shared/prompts/definitions/smile-line-classifier.ts supabase/functions/_shared/prompts/shared/clinical-rules.ts
git commit -m "fix(dsd): raise smile line threshold from ≥2mm to ≥3mm — fix false positive gengivoplasty"
```

---

### Task 2: Improve DSD analysis detection of unsatisfactory resins

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:92-101` (detection criteria)
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:101` (reclassification block)
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:215-240` (homologs section position)

**Step 1: Relax restoration detection criteria**

In `dsd-analysis.ts`, replace lines 92-101 (the ultra-conservative detection section):

Old:
```
=== DETECCAO ULTRA-CONSERVADORA DE RESTAURACOES ===
CRITERIOS para diagnosticar restauração existente:
- Diferença de COR clara e inequívoca
- Interface/margem CLARAMENTE VISIVEL
- Textura ou reflexo DIFERENTE do esmalte adjacente
- Forma anatômica ALTERADA

NAO diagnosticar baseado em: bordos incisais translúcidos (natural), manchas sem interface, variação sutil de cor, desgaste incisal leve.
NAO confundir sombra/iluminação com interface. NUNCA dizer "Substituir restauração" sem PROVA VISUAL.
RESPEITE A ANALISE CLINICA: Se camada anterior classificou dente como INTEGRO, o DSD NAO deve reclassificar como restauração.
```

New:
```
=== DETECCAO DE RESTAURACOES EXISTENTES ===
Diagnosticar restauração existente quando 2 OU MAIS dos seguintes sinais estiverem presentes:
- Diferença de COR entre material e dente adjacente (pigmentação, amarelamento, opacidade)
- Interface/margem visível (linha de transição dente/restauração)
- Textura ou reflexo DIFERENTE do esmalte adjacente (mais liso, mais opaco)
- Forma anatômica ALTERADA (perda de convexidade, lascamento de bordo)
- PIGMENTACAO MARGINAL: escurecimento/amarelamento ao redor das margens da restauração
- LASCAMENTO/FRATURA: perda parcial de material restaurador, expondo substrato

NAO diagnosticar baseado em: bordos incisais translúcidos (natural), manchas sem interface, desgaste incisal leve isolado.
NAO confundir sombra/iluminação com interface.
REGRA DE COMPLEMENTACAO: Se a análise clínica classificou dente como "íntegro" mas o DSD detecta sinais visuais claros de restauração existente (2+ critérios acima), ADICIONAR o achado como observação com linguagem: "Possível restauração existente detectada na vista de sorriso — confirmar clinicamente."
NUNCA contradizer achados POSITIVOS da análise clínica (ex: se clínica disse "restauração Classe III", DSD não pode reclassificar como "íntegro").
```

**Step 2: Add explicit instruction for width asymmetry detection**

Move the homologous comparison section (currently at lines 215-240) to appear BEFORE the gingival evaluation section (line 126). This puts it higher in the prompt where the model pays more attention.

Also add after the moved section:
```
EXEMPLO CONCRETO DE ASSIMETRIA:
Se incisivo central 11 é visivelmente mais LARGO ou mais ESTREITO que o 21 → sugestão OBRIGATÓRIA de "Reanatomização em Resina Composta" para harmonizar larguras. Especificar: "Dente [X] com largura diferente do contralateral [Y] — reanatomização para equalizar proporções."
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
git commit -m "fix(prompts): improve restoration detection + homolog comparison priority in DSD analysis"
```

---

### Task 3: Fix DSD simulation — canine edge correction

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts` (buildBaseCorrections function)

**Step 1: Add explicit canine correction instruction**

In `dsd-simulation.ts`, in the `buildBaseCorrections()` function, after line 167 ("6. PRESERVAR translucidez incisal natural..."), add:

```
7. CORRIGIR ARESTAS INCISAIS DE CANINOS (13/23): Se os caninos apresentam bordos incisais fraturados, lascados ou irregulares, RESTAURAR o contorno pontudo natural do canino. Caninos devem ter ponta incisal definida — não plana ou arredondada por fratura.
8. CORRIGIR BORDOS INCISAIS de TODOS os dentes anteriores (13-23): lascas, irregularidades, assimetrias de comprimento entre homólogos devem ser corrigidas para harmonia do arco
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-simulation.ts
git commit -m "fix(prompts): add explicit canine edge correction to DSD simulation"
```

---

### Task 4: Harden shade-validation.ts — fix cristas + add dentina/esmalte validation

**Files:**
- Modify: `supabase/functions/recommend-resin/shade-validation.ts:91-101` (cristas: fix, not just warn)
- Modify: `supabase/functions/recommend-resin/shade-validation.ts` (add new validation blocks)

**Step 1: Make cristas validation auto-fix**

In `shade-validation.ts`, replace lines 91-101 (the cristas warning-only block):

Old:
```typescript
// Enforce: cristas should use Harmonize XLE or Empress BL-L — flag if not
if (isCristasLayer && productLine) {
  const plLower = productLine.toLowerCase();
  const isAllowedForCristas = plLower.includes('harmonize') || plLower.includes('empress') || (plLower.includes('z350') && layer.shade === 'WE');
  if (!isAllowedForCristas) {
    validationAlerts.push(
      `Cristas Proximais: ${productLine} (${layer.shade}) não é ideal. Recomendado: XLE(Harmonize) ou BL-L(Empress Direct).`
    );
    logger.warn(`Cristas enforcement: ${productLine} ${layer.shade} flagged — should use Harmonize/Empress`);
  }
}
```

New:
```typescript
// Enforce: cristas MUST use Harmonize XLE, Empress BL-L/BL-XL, or Z350 WE — auto-fix if not
if (isCristasLayer && productLine) {
  const plLower = productLine.toLowerCase();
  const isAllowedForCristas = plLower.includes('harmonize') || plLower.includes('empress') || (plLower.includes('z350') && layer.shade === 'WE');
  if (!isAllowedForCristas) {
    const originalBrand = layer.resin_brand;
    const originalShade = layer.shade;
    // Try to find Harmonize or Empress in catalog
    const harmonizeRows = catalogRows.filter(r => r.product_line.toLowerCase().includes('harmonize'));
    const empressRows = catalogRows.filter(r => r.product_line.toLowerCase().includes('empress'));
    if (harmonizeRows.length > 0) {
      const xle = harmonizeRows.find(r => r.shade === 'XLE') || harmonizeRows.find(r => r.type?.toLowerCase().includes('esmalte'));
      if (xle) {
        layer.resin_brand = `Kerr - Harmonize`;
        layer.shade = xle.shade;
        shadeReplacements[originalShade] = xle.shade;
      }
    } else if (empressRows.length > 0) {
      const blL = empressRows.find(r => /BL-?L/i.test(r.shade)) || empressRows.find(r => r.type?.toLowerCase().includes('esmalte'));
      if (blL) {
        layer.resin_brand = `Ivoclar - IPS Empress Direct`;
        layer.shade = blL.shade;
        shadeReplacements[originalShade] = blL.shade;
      }
    }
    validationAlerts.push(
      `Cristas Proximais: ${originalBrand} (${originalShade}) substituído por ${layer.resin_brand} (${layer.shade}). Cristas requerem XLE(Harmonize) ou BL-L(Empress Direct).`
    );
    logger.warn(`Cristas auto-fix: ${originalBrand} ${originalShade} → ${layer.resin_brand} ${layer.shade}`);
  }
}
```

**Step 2: Add dentina/corpo validation block**

After the cristas validation block (and before the Z350 BL enforcement), add:

```typescript
// Enforce: dentina/corpo layers must NOT use enamel shades
const isDentinaCorpoLayer = layerType.includes('dentina') || layerType.includes('corpo') || layerType.includes('body');
if (isDentinaCorpoLayer && layer.shade) {
  const enamelShades = ['WE', 'A1E', 'A2E', 'A3E', 'B1E', 'B2E', 'CT', 'GT', 'BT', 'YT', 'MW', 'CE', 'JE', 'Trans', 'INC', 'TN'];
  const isEnamelShade = enamelShades.some(es => layer.shade.toUpperCase() === es.toUpperCase());
  if (isEnamelShade) {
    const originalShade = layer.shade;
    // Prefer WB, then DA1, then A1 as body shade
    const bodyRows = lineRows.filter(r => r.type?.toLowerCase().includes('body') || r.type?.toLowerCase().includes('dentina'));
    const wbRow = bodyRows.find(r => r.shade === 'WB');
    const da1Row = bodyRows.find(r => r.shade === 'DA1');
    const a1Row = bodyRows.find(r => r.shade.startsWith('A1'));
    const replacement = wbRow || da1Row || a1Row || bodyRows[0];
    if (replacement) {
      layer.shade = replacement.shade;
      shadeReplacements[originalShade] = replacement.shade;
      validationAlerts.push(
        `Dentina/Corpo: shade ${originalShade} é shade de ESMALTE, inválido para camada de corpo. Substituído por ${replacement.shade}.`
      );
      logger.warn(`Dentina/corpo enforcement: ${originalShade} → ${replacement.shade}`);
    }
  }
}
```

**Step 3: Add esmalte vestibular validation block**

After the enamel layer optimization block (~line 156), add:

```typescript
// Enforce: esmalte vestibular final must NOT use translucent shades
if (isEnamelLayer && layer.shade) {
  const translucentShades = ['CT', 'GT', 'BT', 'YT', 'WT', 'Trans', 'Trans20', 'Trans30'];
  const isTranslucent = translucentShades.some(ts => layer.shade.toUpperCase() === ts.toUpperCase());
  const isVestibularFinal = layerType.includes('vestibular') || layerType.includes('final');
  if (isTranslucent && isVestibularFinal) {
    const originalShade = layer.shade;
    // Prefer WE, then MW, then A1E
    const weRow = lineRows.find(r => r.shade === 'WE');
    const mwRow = lineRows.find(r => r.shade === 'MW');
    const a1eRow = lineRows.find(r => r.shade === 'A1E');
    const replacement = weRow || mwRow || a1eRow;
    if (replacement) {
      layer.shade = replacement.shade;
      shadeReplacements[originalShade] = replacement.shade;
      validationAlerts.push(
        `Esmalte Vestibular Final: shade translúcido ${originalShade} inválido para esmalte final. Substituído por ${replacement.shade}.`
      );
      logger.warn(`Enamel final enforcement: ${originalShade} → ${replacement.shade}`);
    }
  }
}
```

**Step 4: Add fallback for empty lineRows in Z350 BL validation**

In the existing Z350 BL enforcement block (line ~103), add a fallback when lineRows is empty:

After `const z350Rows = getRowsForLine(productLine);`, add:
```typescript
if (z350Rows.length === 0) {
  // Catalog missing for this product line — force safe default
  logger.warn(`Z350 BL enforcement: no catalog rows for ${productLine}, forcing A1E as safe default`);
  layer.shade = isEnamelLayer ? 'A1E' : 'A1';
  shadeReplacements[originalShade] = layer.shade;
  validationAlerts.push(
    `Cor ${originalShade} NÃO EXISTE na linha Filtek Z350 XT (catálogo vazio). Substituída por ${layer.shade}.`
  );
  continue; // Skip to next layer
}
```

Note: the `continue` won't work since we're not in a standalone loop at that point. Instead, wrap the existing replacement logic in an `else` block after this check.

**Step 5: Commit**

```bash
git add supabase/functions/recommend-resin/shade-validation.ts
git commit -m "fix(validation): auto-fix cristas + add dentina/esmalte validation + Z350 BL fallback"
```

---

### Task 5: Fix stale prompt — Z350 WB exists

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:147`

**Step 1: Fix incorrect WB prohibition for Z350**

In `recommend-resin.ts`, line 147, change:
```
- Filtek Z350 XT: NAO possui BL1, BL2, BL3, WB. Usar WB somente de FORMA ou outra linha.
```
to:
```
- Filtek Z350 XT: NAO possui BL1, BL2, BL3. Possui WB (Body).
```

Also in the dentina/corpo layer line 131 and line 374, ensure WB(Z350) is listed as valid option (it already is — confirm).

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "fix(prompts): correct Z350 WB availability — Z350 has WB since catalog v2"
```

---

### Task 6: Add retry to share link generation (low priority)

**Files:**
- Modify: `apps/web/src/data/evaluations.ts:283-305` (getOrCreateShareLink)

**Step 1: Add retry logic**

In `evaluations.ts`, wrap the insert in `getOrCreateShareLink` with a single retry:

Replace the existing function:
```typescript
export async function getOrCreateShareLink(sessionId: string, userId: string) {
  const { data: existing } = await supabase
    .from('shared_links')
    .select('token')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existing?.token) return existing.token;

  const created = await withQuery(() =>
    supabase
      .from('shared_links')
      .insert({ user_id: userId, session_id: sessionId })
      .select('token')
      .single(),
  );

  return created.token as string;
}
```

With:
```typescript
export async function getOrCreateShareLink(sessionId: string, userId: string) {
  const { data: existing } = await supabase
    .from('shared_links')
    .select('token')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existing?.token) return existing.token;

  try {
    const created = await withQuery(() =>
      supabase
        .from('shared_links')
        .insert({ user_id: userId, session_id: sessionId })
        .select('token')
        .single(),
    );
    return created.token as string;
  } catch (err) {
    // Single retry after 2s delay for transient errors
    await new Promise(r => setTimeout(r, 2000));
    const created = await withQuery(() =>
      supabase
        .from('shared_links')
        .insert({ user_id: userId, session_id: sessionId })
        .select('token')
        .single(),
    );
    return created.token as string;
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/src/data/evaluations.ts
git commit -m "fix(share): add retry with 2s delay for transient share link errors"
```

---

### Task 7: Deploy edge functions

**Step 1: Verify TypeScript compiles**

```bash
cd /Users/gustavoparis/www/DentAI-Pro
# Check for TS errors in modified edge functions (Deno style)
npx supabase functions serve generate-dsd --no-verify-jwt 2>&1 | head -20
# If it starts without errors, Ctrl+C and continue
```

**Step 2: Deploy generate-dsd**

```bash
open -a Docker  # Ensure Docker Desktop is running
npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker
```

**Step 3: Deploy recommend-resin**

```bash
npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker
```

**Step 4: Commit (if any deploy-related changes)**

No commit needed unless deploy config changes.

---

### Task 8: Final commit — all changes together

```bash
git add -A
git status  # Verify only expected files changed
git commit -m "fix: specialist feedback corrections — DSD detection, smile line threshold, protocol validation

- Raise smile line classifier threshold from ≥2mm to ≥3mm (fix false positive gengivoplasty)
- Improve DSD restoration detection: relax from 4-of-4 to 2-of-4 criteria
- Add pigmentation/chipping as explicit detection criteria
- Allow DSD to complement (not contradict) clinical analysis
- Move homolog comparison higher in prompt for better attention
- Add explicit canine edge correction to DSD simulation
- Auto-fix cristas brand (must be Harmonize XLE or Empress BL-L)
- Add dentina/corpo validation (reject enamel shades)
- Add esmalte vestibular validation (reject translucent shades)
- Add Z350 BL validation fallback for empty catalog
- Fix stale Z350 WB prohibition in prompt (Z350 has WB since catalog v2)
- Add retry for share link generation"
```

Note: This final commit is ONLY if not all individual commits were done. If Tasks 1-6 each have their own commit, this is unnecessary.
