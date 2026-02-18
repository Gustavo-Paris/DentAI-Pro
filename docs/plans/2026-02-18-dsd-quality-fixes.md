---
title: "DSD Quality Fixes — Implementation Plan"
created: 2026-02-18
updated: 2026-02-18
status: draft
tags:
  - type/plan
  - status/draft
  - domain/dsd
  - domain/quality
---

# DSD Quality Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 15 P0 critical issues and 19 P1 high-priority issues identified in the DSD Quality Audit.

**Architecture:** Three sprints of incremental fixes. Sprint 1 targets P0 issues (data integrity, security, clinical correctness). Sprint 2 targets P1 issues (model upgrades, validation, UX). Sprint 3 targets P2 issues (resilience, optimization). Each task is isolated and independently testable.

**Tech Stack:** TypeScript (Deno for edge functions, React for frontend), Supabase Edge Functions, Zod schemas, Claude API, Gemini API.

---

## Sprint 1 — P0 Critical Fixes

### Task 1: Fix Estelite Omega shade catalog errors

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:129-148`
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:393-402`

**Step 1: Fix the shade glossary (line 141)**

Change JE attribution from Estelite Omega to Estelite Sigma Quick:

```typescript
// Line 141: Change
- JE = Jewel Enamel (SOMENTE Estelite Omega)
// To:
- JE = Jewel Enamel (SOMENTE Estelite Sigma Quick)
```

**Step 2: Remove false BL prohibition (lines 148-149)**

```typescript
// Line 148-149: Change
- Estelite Omega: NAO possui shades BL. Para clareados usar Estelite Bianco W3/W4.
// To:
- Estelite Omega: Possui BL1, BL2 para clareados. Alternativa: Estelite Bianco W3/W4.
```

**Step 3: Fix Estelite Omega shade table (line 397)**

```typescript
// Line 397: Change
| Estelite Omega      | WE, JE, CT                                |
// To:
| Estelite Omega      | WE, MW, CT, BL1, BL2                      |
```

**Step 4: Fix Esmalte Final section (line 388)**

Update the P1 priority to remove JE from Omega and reflect correct shades:

```typescript
// Line 388: Change
- P1 (OBRIGATORIO quando disponível): Palfique LX5 (WE), Estelite Omega (WE/MW). MW para resultado natural. Clareados: W3/W4(Estelite Bianco). ⚠️ Z350 para Esmalte Final SOMENTE se P1 indisponível — shade A1E/A2E (NUNCA BL1, NAO EXISTE em Z350!)
// To:
- P1 (OBRIGATORIO quando disponível): Palfique LX5 (WE), Estelite Omega (WE/MW). MW para resultado natural. Clareados: BL1/BL2(Estelite Omega), W3/W4(Estelite Bianco). ⚠️ Z350 para Esmalte Final SOMENTE se P1 indisponível — shade A1E/A2E (NUNCA BL1, NAO EXISTE em Z350!)
```

**Step 5: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "fix(prompts): correct Estelite Omega shade catalog — add BL1/BL2, move JE to Sigma Quick"
```

---

### Task 2: Fix Palfique LX5 shade catalog errors

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:402`

**Step 1: Fix Palfique LX5 shade table**

```typescript
// Line 402: Change
| Palfique LX5        | MW, WE, CE, BL1, BL2, BL3, A1-A3, B1     |
// To:
| Palfique LX5        | WE, CE, BW, SW, A1-A3, B1                 |
```

Note: Palfique LX5 does NOT have MW (that's Estelite Omega), BL1, BL2, BL3. Bleach shades are BW (Bleach White) and SW (Snow White).

**Step 2: Update bleach shade references for Palfique LX5**

Search for any other references to `Palfique LX5` with BL shades and update them. The clareamento section (line 416) references `Palfique LX5 (BL1-3)`:

```typescript
// Line 416: Change
  COM BL: Palfique LX5 (BL1-3), Forma (BL), Estelite Bianco (W1-W4), Empress (BL-L). ⚠️ Z350 NAO possui shades BL — usar WE/A1E como aproximação.
// To:
  COM BL: Palfique LX5 (BW/SW), Estelite Omega (BL1/BL2), Forma (BL), Estelite Bianco (W1-W4), Empress (BL-L). ⚠️ Z350 NAO possui shades BL — usar WE/A1E como aproximação.
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "fix(prompts): correct Palfique LX5 shades — BW/SW not BL1/BL2/BL3, remove MW"
```

---

### Task 3: Fix Sof-Lex disc color sequence

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:457-462`

**Step 1: Fix the Sof-Lex blue sequence**

```typescript
// Lines 457-458: Change
3. Discos Sof-Lex (SEQUENCIA AZUL — padrão):
   - Preto (Grosso) -> Azul Escuro (Médio) -> Azul Médio (Fino) -> Azul Claro (Ultrafino)
// To:
3. Discos Sof-Lex (SEQUENCIA LARANJA — padrão):
   - Laranja Escuro (Grosso) -> Laranja Médio (Médio) -> Laranja Claro (Fino) -> Amarelo (Ultrafino)
```

**Step 2: Also fix the JSON template reference (lines 536-539)**

```typescript
// Lines 536-539: Fix the polishing tool names in the JSON template
{"order":1,"tool":"Disco Sof-Lex Laranja Escuro","grit":"Grossa",...},
{"order":2,"tool":"Disco Sof-Lex Laranja Médio","grit":"Média",...},
{"order":3,"tool":"Disco Sof-Lex Laranja Claro","grit":"Fina",...},
{"order":4,"tool":"Disco Sof-Lex Amarelo","grit":"Ultrafina",...},
```

**Step 3: Fix the recontorno section (line 342)**

```typescript
// Line 342: Change
  4. Acabamento (Sof-Lex: Preto->Azul escuro->Azul médio->Azul claro OU sequência vermelha)
// To:
  4. Acabamento (Sof-Lex: Laranja Escuro->Laranja Médio->Laranja Claro->Amarelo OU sequência vermelha)
```

**Step 4: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "fix(prompts): correct Sof-Lex disc colors — Laranja sequence, not Azul"
```

---

### Task 4: Fix cross-user cache leak + add prompt version to cache hash

**Files:**
- Modify: `supabase/functions/generate-dsd/index.ts:116-143`

**Step 1: Add PROMPT_VERSION to cache hash computation**

```typescript
// Line 116: Change the hash source to include prompt version
import { PROMPT_VERSION } from "../_shared/metrics-adapter.ts";
// Already imported at top of simulation.ts; add to index.ts if not present.

// Lines 116-118: Change
const hashEncoder = new TextEncoder();
const imageHashBuffer = await crypto.subtle.digest('SHA-256', hashEncoder.encode(rawBase64ForHash.substring(0, 2000)));
// To:
const hashEncoder = new TextEncoder();
const hashSource = `${PROMPT_VERSION}:${rawBase64ForHash.substring(0, 50000)}`;
const imageHashBuffer = await crypto.subtle.digest('SHA-256', hashEncoder.encode(hashSource));
```

**Step 2: Add user_id filter to cache query**

```typescript
// Lines 131-137: Change
const { data: cached } = await supabase
  .from("evaluations")
  .select("dsd_analysis")
  .eq("dsd_image_hash", dsdImageHash)
  .not("dsd_analysis", "is", null)
  .limit(1)
  .single();
// To:
const { data: cached } = await supabase
  .from("evaluations")
  .select("dsd_analysis")
  .eq("dsd_image_hash", dsdImageHash)
  .eq("user_id", user.id)
  .not("dsd_analysis", "is", null)
  .limit(1)
  .single();
```

**Step 3: Commit**

```bash
git add supabase/functions/generate-dsd/index.ts
git commit -m "fix(dsd): add user_id filter to cache + include prompt version in hash"
```

---

### Task 5: Fix smile line threshold inconsistency (>3mm vs >=3mm)

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:37`

**Step 1: Align threshold to >=3mm**

```typescript
// Line 37: Change
   - ALTA (>3mm gengiva exposta): Faixa CONTINUA de gengiva visivel acima dos zenites dos centrais.
// To:
   - ALTA (>=3mm gengiva exposta): Faixa CONTINUA de gengiva visivel acima dos zenites dos centrais.
```

**Step 2: Also align the Passo 4 reference**

```typescript
// Line 52: Change
   Passo 4: Classificar: >3mm=ALTA, 0-3mm=MEDIA, gengiva coberta=BAIXA
// To:
   Passo 4: Classificar: >=3mm=ALTA, 0-3mm (exclusive)=MEDIA, gengiva coberta=BAIXA
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
git commit -m "fix(prompts): align smile line threshold to >=3mm across dsd-analysis and clinical-rules"
```

---

### Task 6: Fix gengivoplasty allowed with 0mm tissue (post-processing)

**Files:**
- Modify: `supabase/functions/generate-dsd/post-processing.ts:35-49`

**Step 1: Extend gengivoplasty stripping to include "média" with insufficient exposure**

```typescript
// Lines 35-49: Change
  // Safety net #2: Strip gengivoplastia suggestions only for low smile line.
  // Both "alta" and "média" have sufficient gingival visibility for gengivoplasty.
  // The AI prompt already instructs conservatism for "média" cases.
  if (analysis.smile_line === 'baixa') {
// To:
  // Safety net #2: Strip gengivoplastia for low smile line AND for média when no gingival exposure is described.
  // "alta" always has sufficient visibility. "média" CAN have 0mm exposure (lip tangent) —
  // only allow gengivoplasty for média if observations mention visible gingiva or asymmetry.
  const smileLine = (analysis.smile_line || '').toLowerCase();
  const shouldStripGingivo = smileLine === 'baixa' || (
    smileLine === 'média' && !analysis.observations?.some(obs => {
      const lower = obs.toLowerCase();
      return lower.includes('assimetria gengival') ||
             lower.includes('coroa clínica curta') ||
             lower.includes('gengiva') && lower.includes('visível');
    })
  );
  if (shouldStripGingivo) {
```

**Step 2: Commit**

```bash
git add supabase/functions/generate-dsd/post-processing.ts
git commit -m "fix(dsd): strip gengivoplasty for média smile line without visible gingival evidence"
```

---

### Task 7: Add retry + backoff to callGeminiImageEdit

**Files:**
- Modify: `supabase/functions/_shared/gemini.ts:761-879`

**Step 1: Add retry logic with exponential backoff**

Wrap the fetch call inside a retry loop. Only retry on 503 (server overload) and 429 (rate limit) errors, up to 2 retries (3 total attempts).

```typescript
// After line 795 (after building the request object), wrap the fetch in a retry loop:

  const MAX_RETRIES = 2;
  const RETRY_DELAYS = [2000, 5000]; // 2s, 5s exponential backoff

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 60000
    );

    try {
      logger.log(`Calling Gemini Image Edit API (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();

        // Retry on 503 and 429 if attempts remain
        if ((response.status === 503 || response.status === 429) && attempt < MAX_RETRIES) {
          logger.warn(`Gemini Image API ${response.status}, retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }

        // ... existing error handling (429 and generic errors) ...
      }

      // ... existing success handling (parse response, extract image) ...
      // Return result on success

    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === "AbortError" && attempt < MAX_RETRIES) {
        logger.warn(`Gemini Image timeout, retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }

      // ... existing catch handling ...
    }
  }
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/gemini.ts
git commit -m "fix(gemini): add retry with exponential backoff to callGeminiImageEdit (2 retries for 503/429)"
```

---

### Task 8: Fix deterministic seed preventing meaningful regeneration

**Files:**
- Modify: `supabase/functions/generate-dsd/simulation.ts:256-262`

**Step 1: Add random offset to seed for regeneration variability**

```typescript
// Lines 256-262: Change
  // Compute deterministic seed from image hash for reproducibility
  const hashSource = inputBase64Data.substring(0, 1000);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashSource));
  const hashArray = new Uint8Array(hashBuffer);
  // Mask to 31 bits (0x7FFFFFFF) — Gemini expects signed INT32 (max 2147483647)
  const imageSeed = ((hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3]) & 0x7FFFFFFF;
// To:
  // Compute semi-deterministic seed: image hash + timestamp offset for regeneration variability
  const hashSource = inputBase64Data.substring(0, 1000);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashSource));
  const hashArray = new Uint8Array(hashBuffer);
  const baseSeed = ((hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3]) & 0x7FFFFFFF;
  // Add time-based offset so "regenerate" produces a different result (different minute = different seed)
  const timeOffset = Math.floor(Date.now() / 60000) % 1000;
  const imageSeed = (baseSeed + timeOffset) & 0x7FFFFFFF;
```

**Step 2: Commit**

```bash
git add supabase/functions/generate-dsd/simulation.ts
git commit -m "fix(dsd): add time-based seed offset so regeneration produces different results"
```

---

### Task 9: Fix double JPEG compression for HEIC + raise quality to 0.88

**Files:**
- Modify: `apps/web/src/lib/imageUtils.ts:8`
- Modify: `apps/web/src/components/wizard/PhotoUploadStep.tsx:48-52`

**Step 1: Raise JPEG quality from 0.7 to 0.88**

```typescript
// imageUtils.ts line 8: Change
  quality: number = 0.7
// To:
  quality: number = 0.88
```

**Step 2: Fix HEIC conversion quality to match**

```typescript
// PhotoUploadStep.tsx lines 48-52: Change
const convertHeicToJpeg = async (file: File): Promise<Blob> => {
  const { heicTo } = await import('heic-to');
  const jpegBlob = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: 0.7,
  });
  return jpegBlob;
};
// To:
const convertHeicToJpeg = async (file: File): Promise<Blob> => {
  const { heicTo } = await import('heic-to');
  const jpegBlob = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: 0.88,
  });
  return jpegBlob;
};
```

**Step 3: Skip recompression for already-converted HEIC files**

In `handleFile`, after HEIC conversion the blob is already JPEG at 0.88 quality. Passing it through `compressImage` recompresses it. Fix:

```typescript
// PhotoUploadStep.tsx handleFile callback (~line 127-133): Change
      if (fileIsHeic) {
        toast.info(t('components.wizard.photoUpload.convertingIphone'));
        processedBlob = await convertHeicToJpeg(file);
      }

      // Comprimir a imagem
      const compressedBase64 = await compressImage(processedBlob);
// To:
      if (fileIsHeic) {
        toast.info(t('components.wizard.photoUpload.convertingIphone'));
        processedBlob = await convertHeicToJpeg(file);
        // HEIC already converted to JPEG at 0.88 — only resize, don't recompress
        const compressedBase64 = await compressImage(processedBlob, 1280, 1.0);
        onImageChange(compressedBase64);
        trackEvent('photo_uploaded', { file_size: file.size, file_type: 'heic' });
        return;
      }

      // Comprimir a imagem (non-HEIC files)
      const compressedBase64 = await compressImage(processedBlob);
```

Apply the same pattern to `handleOptionalFile` (~line 209-216).

**Step 4: Commit**

```bash
git add apps/web/src/lib/imageUtils.ts apps/web/src/components/wizard/PhotoUploadStep.tsx
git commit -m "fix(image): raise JPEG quality to 0.88 + prevent double compression for HEIC"
```

---

### Task 10: Fix overbite criterion (reformulate for indirect visual signs)

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:63-78`

**Step 1: Rewrite overbite criteria for photo-feasible detection**

```typescript
// Lines 63-78: Replace the entire overbite section with:
=== SOBREMORDIDA (OVERBITE) - CAMPO OBRIGATORIO ===

Retorne overbite_suspicion: "sim"|"não"|"indeterminado"

Critérios observacionais INDIRETOS (avaliáveis em foto frontal de sorriso):
- "sim": Bordos incisais superiores cobrem VISIVELMENTE >2/3 dos inferiores (quando ambas arcadas visíveis), OU dentes superiores apresentam desgaste incisal severo compatível com contato excessivo, OU linha do sorriso alta com incisivos superiores alongados e curva de Spee acentuada visível.
- "não": Arcada inferior CLARAMENTE VISÍVEL com trespasse vertical normal (1/3 a 1/2).
- "indeterminado": Inferiores NÃO visíveis na foto (caso mais comum em foto frontal de sorriso), OU evidência insuficiente.

REGRA: Foto frontal mostrando APENAS arcada superior → SEMPRE "indeterminado".
REGRA: Na dúvida → "indeterminado" (NUNCA "não" sem evidência positiva).
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
git commit -m "fix(prompts): reformulate overbite criterion for indirect visual signs feasible from photos"
```

---

## Sprint 2 — P1 High-Priority Fixes

### Task 11: Fix Vittra APS INC shade + Palfique LX5 MW cross-contamination

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:390,401`

**Step 1: Fix Vittra APS shade references**

```typescript
// Line 390: Change
   - P3: Harmonize (Incisal/TN), Vittra APS (INC)
// To:
   - P3: Harmonize (Incisal/TN), Vittra APS (Trans)
```

```typescript
// Line 401: Change
| Vittra APS          | Trans, INC                                |
// To:
| Vittra APS          | Trans, Trans OPL, Trans N, EA1, EA2       |
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "fix(prompts): correct Vittra APS shades — Trans/EA1/EA2, not INC"
```

---

### Task 12: Upgrade Claude Sonnet 4.5 → 4.6

**Files:**
- Modify: `supabase/functions/_shared/claude.ts:16`
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:14`
- Modify: `supabase/functions/_shared/prompts/metrics.ts:8-9`

**Step 1: Update DEFAULT_MODEL in claude.ts**

```typescript
// claude.ts line 16: Change
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
// To:
const DEFAULT_MODEL = "claude-sonnet-4-6-20250929";
```

Note: Verify the exact model ID from Anthropic docs before changing. The model ID pattern may be `claude-sonnet-4-6-YYYYMMDD`.

**Step 2: Update dsd-analysis prompt definition**

```typescript
// dsd-analysis.ts line 14: Change
  model: 'claude-sonnet-4-5-20250929',
// To:
  model: 'claude-sonnet-4-6-20250929',
```

**Step 3: Add cost entry for Sonnet 4.6 in metrics.ts**

```typescript
// metrics.ts: Add entry (same pricing as 4.5)
  'claude-sonnet-4-6-20250929': { input: 0.003, output: 0.015 },
```

**Step 4: Commit**

```bash
git add supabase/functions/_shared/claude.ts supabase/functions/_shared/prompts/definitions/dsd-analysis.ts supabase/functions/_shared/prompts/metrics.ts
git commit -m "feat(models): upgrade Claude Sonnet 4.5 → 4.6 (same price, better quality)"
```

---

### Task 13: Fix Gemini cost tracking (16-24x underestimated)

**Files:**
- Modify: `supabase/functions/_shared/prompts/metrics.ts:6-7`

**Step 1: Update Gemini pricing**

```typescript
// metrics.ts lines 6-7: Change
  'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-3-pro-image-preview': { input: 0.00125, output: 0.005 },
// To:
  'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-3-pro-image-preview': { input: 0.0025, output: 0.01 },
```

Note: The exact pricing for `gemini-3-pro-image-preview` should be verified from Google Cloud pricing page. The audit found $2.00/$12.00 per MTok, which translates to $0.002/$0.012 per 1K tokens. Use best available data.

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/metrics.ts
git commit -m "fix(metrics): correct Gemini 3 Pro Image Preview cost tracking"
```

---

### Task 14: Move lip validation from Sonnet to Haiku

**Files:**
- Modify: `supabase/functions/generate-dsd/simulation.ts:276-301`

**Step 1: Use Haiku model for lip validation**

```typescript
// simulation.ts line 276: Change
  const dsdAnalysisPromptDef = getPrompt('dsd-analysis');
// To:
  const smileLinePromptDef = getPrompt('smile-line-classifier');
```

```typescript
// simulation.ts line 284: Change
      const lipCheck = await callClaudeVision(
        dsdAnalysisPromptDef.model,
// To:
      const lipCheck = await callClaudeVision(
        smileLinePromptDef.model, // Haiku 4.5 — binary SIM/NÃO task doesn't need Sonnet
```

**Step 2: Commit**

```bash
git add supabase/functions/generate-dsd/simulation.ts
git commit -m "perf(dsd): use Haiku 4.5 for lip validation (3.75x cheaper for binary task)"
```

---

### Task 15: Add FDI tooth validation to DSDSuggestionSchema

**Files:**
- Modify: `supabase/functions/_shared/aiSchemas.ts:115-122`

**Step 1: Replace loose string with FDI regex**

```typescript
// aiSchemas.ts lines 115-122: Change
const DSDSuggestionSchema = z
  .object({
    tooth: z.string(),
// To:
const FDI_TOOTH_PATTERN = /^[1-4][1-8]$/;

const DSDSuggestionSchema = z
  .object({
    tooth: z.string().regex(FDI_TOOTH_PATTERN, "Tooth must be FDI notation (11-48)"),
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/aiSchemas.ts
git commit -m "fix(validation): add FDI notation regex to DSD tooth field (11-48 only)"
```

---

### Task 16: Complete enum normalization mappings

**Files:**
- Modify: `supabase/functions/_shared/aiSchemas.ts:156-163`

**Step 1: Add missing enum mappings**

```typescript
// aiSchemas.ts lines 156-163: Change
const ENUM_MAPPINGS: Record<string, Record<string, string>> = {
  smile_line: { low: "baixa", medium: "média", high: "alta" },
  buccal_corridor: { adequate: "adequado", excessive: "excessivo", absent: "ausente" },
  confidence: { low: "baixa", medium: "média", high: "alta" },
  facial_midline: { centered: "centrada" },
  dental_midline: { aligned: "alinhada" },
  occlusal_plane: { level: "nivelado" },
};
// To:
const ENUM_MAPPINGS: Record<string, Record<string, string>> = {
  smile_line: { low: "baixa", medium: "média", high: "alta" },
  buccal_corridor: { adequate: "adequado", excessive: "excessivo", absent: "ausente" },
  confidence: { low: "baixa", medium: "média", high: "alta" },
  facial_midline: { centered: "centrada", deviated: "desviada" },
  dental_midline: { aligned: "alinhada", deviated: "desviada" },
  occlusal_plane: { level: "nivelado", tilted: "inclinado" },
  lip_thickness: { thin: "fino", medium: "médio", thick: "volumoso" },
  overbite_suspicion: { yes: "sim", no: "não", undetermined: "indeterminado" },
  face_shape: { oval: "oval", square: "quadrado", triangular: "triangular", rectangular: "retangular", round: "redondo" },
  perceived_temperament: { choleric: "colérico", sanguine: "sanguíneo", melancholic: "melancólico", phlegmatic: "fleumático" },
  smile_arc: { consonant: "consonante", flat: "plano", reverse: "reverso" },
};
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/aiSchemas.ts
git commit -m "fix(validation): complete enum normalization — add lip_thickness, overbite, face_shape, temperament, smile_arc"
```

---

### Task 17: Fix silent DB write failure in recommend-cementation

**Files:**
- Modify: `supabase/functions/recommend-cementation/index.ts:343-354`

**Step 1: Return 500 when DB update fails**

```typescript
// Lines 352-354: Change
    if (updateError) {
      logger.error("Update error:", updateError);
    }
// To:
    if (updateError) {
      logger.error("Update error:", updateError);
      // Refund credits since protocol won't be persisted
      if (creditsConsumed && supabaseForRefund && userIdForRefund) {
        await refundCredits(supabaseForRefund, userIdForRefund, "cementation_recommendation", reqId);
      }
      return createErrorResponse("Protocolo gerado mas falhou ao salvar. Tente novamente.", 500, corsHeaders);
    }
```

**Step 2: Commit**

```bash
git add supabase/functions/recommend-cementation/index.ts
git commit -m "fix(cementation): return 500 + refund credits on DB write failure instead of silent 200"
```

---

### Task 18: Expand dsdContext passed to recommend-resin

**Files:**
- Modify: `apps/web/src/hooks/domain/wizard/useWizardSubmit.ts:361-367`
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:48-52`

**Step 1: Expand the Params interface for dsdContext**

```typescript
// recommend-resin.ts lines 48-52: Change
  dsdContext?: {
    currentIssue: string
    proposedChange: string
    observations: string[]
  }
// To:
  dsdContext?: {
    currentIssue: string
    proposedChange: string
    observations: string[]
    smileLine?: string
    faceShape?: string
    symmetryScore?: number
    smileArc?: string
  }
```

**Step 2: Update buildDSDContextSection to include new fields**

```typescript
// recommend-resin.ts buildDSDContextSection function: Add after line 198:
  const extra = [
    dsdContext.smileLine && `- Linha do sorriso: ${dsdContext.smileLine}`,
    dsdContext.faceShape && `- Formato facial: ${dsdContext.faceShape}`,
    dsdContext.symmetryScore != null && `- Score de simetria: ${dsdContext.symmetryScore}%`,
    dsdContext.smileArc && `- Arco do sorriso: ${dsdContext.smileArc}`,
  ].filter(Boolean).join('\n');
  // Add after observations line in the template:
  return `...${extra ? `\nContexto clínico adicional:\n${extra}` : ''}...`;
```

**Step 3: Pass expanded context from useWizardSubmit**

```typescript
// useWizardSubmit.ts lines 361-367: Change
                      dsdContext: resinDsdSuggestion
                        ? {
                            currentIssue: resinDsdSuggestion.current_issue,
                            proposedChange: resinDsdSuggestion.proposed_change,
                            observations: dsdResult?.analysis?.observations || [],
                          }
                        : undefined,
// To:
                      dsdContext: resinDsdSuggestion
                        ? {
                            currentIssue: resinDsdSuggestion.current_issue,
                            proposedChange: resinDsdSuggestion.proposed_change,
                            observations: dsdResult?.analysis?.observations || [],
                            smileLine: dsdResult?.analysis?.smile_line,
                            faceShape: dsdResult?.analysis?.face_shape,
                            symmetryScore: dsdResult?.analysis?.symmetry_score,
                            smileArc: dsdResult?.analysis?.smile_arc,
                          }
                        : undefined,
```

**Step 4: Commit**

```bash
git add apps/web/src/hooks/domain/wizard/useWizardSubmit.ts supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "feat(dsd): expand dsdContext with smile_line, face_shape, symmetry_score, smile_arc"
```

---

### Task 19: Fix double-charge on retry (reqId idempotency)

**Files:**
- Modify: `supabase/functions/generate-dsd/index.ts:19`
- Modify: `supabase/functions/generate-dsd/validation.ts` (add reqId to request body)

**Step 1: Accept client-generated reqId for idempotency**

```typescript
// index.ts line 19: Change
  const reqId = generateRequestId();
// To:
  // Use client-provided reqId for idempotency (same retry = same reqId = no double charge)
  const body = await req.clone().json().catch(() => ({}));
  const reqId = (typeof body.reqId === 'string' && body.reqId.length > 0)
    ? body.reqId
    : generateRequestId();
```

Note: The credit system already uses reqId for deduplication. By accepting the client's reqId, retries won't create duplicate charges.

**Step 2: Pass reqId from frontend**

In the frontend hook that calls generate-dsd, generate reqId once per user action (not per retry attempt) and include it in the request body. This is in `useDSDStep.ts` — the reqId should be generated when the user clicks "Analyze" and reused on retries.

**Step 3: Commit**

```bash
git add supabase/functions/generate-dsd/index.ts
git commit -m "fix(dsd): accept client reqId for idempotency — prevent double-charge on retry"
```

---

### Task 20: Add HF concentration decision tree to cementation prompt

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-cementation.ts`

**Step 1: Add HF concentration section to the cementation prompt**

Find the ceramic surface treatment section and add:

```
=== CONCENTRAÇÃO DE ÁCIDO FLUORÍDRICO (HF) ===

| Tipo Cerâmico | Concentração HF | Tempo |
|---------------|-----------------|-------|
| Dissilicato de lítio (IPS e.max) | 5% | 20s |
| Leucita (IPS Empress) | 5% | 60s |
| Feldspática (VITA Mark II) | 5-10% | 60-120s |
| Zircônia (Vitallium, Lava) | NÃO USAR HF — jateamento Al₂O₃ + primer MDP |

REGRA: Se tipo cerâmico é zircônia → NÃO condicionar com HF. Usar jateamento com Al₂O₃ 50μm + primer universal com MDP (Monobond Plus ou Z-Prime Plus).
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-cementation.ts
git commit -m "feat(prompts): add HF concentration decision tree to cementation protocol"
```

---

### Task 21: Persist vitaShadeManuallySet in wizard draft

**Files:**
- Modify: `apps/web/src/hooks/domain/wizard/usePhotoAnalysis.ts`

**Step 1: Replace useRef with draft-persisted state**

Find `vitaShadeManuallySetRef` and replace the `useRef` with state persisted to the wizard draft:

```typescript
// Change:
const vitaShadeManuallySetRef = useRef(false);
// To: Use the draft state system already in place for other wizard fields
// Add vitaShadeManuallySet to the draft fields and persist it
```

The exact implementation depends on how the wizard draft system works. The key is that `vitaShadeManuallySet` must survive page refresh.

**Step 2: Commit**

```bash
git add apps/web/src/hooks/domain/wizard/usePhotoAnalysis.ts
git commit -m "fix(wizard): persist vitaShadeManuallySet in draft to survive page refresh"
```

---

## Sprint 3 — P2 Medium-Priority Fixes

### Task 22: Reduce OBRIGATÓRIO overuse in DSD analysis prompt

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`

**Step 1: Replace excessive OBRIGATÓRIO instances with structured numbered checklists**

Reduce from ~35 uses to ≤5. Keep OBRIGATÓRIO only for truly critical instructions:
1. FDI notation
2. Smile line classification protocol
3. Conservative treatment priority
4. Gengivoplasty caveat
5. Overbite rules

Replace all other uses with numbered checklists or bold text.

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
git commit -m "refactor(prompts): reduce OBRIGATÓRIO to ≤5 uses, use numbered checklists instead"
```

---

### Task 23: Fix gingival asymmetry threshold (1mm → 1.5mm)

**Files:**
- Modify: `supabase/functions/_shared/prompts/shared/clinical-rules.ts:102`

**Step 1: Update threshold**

```typescript
// Line 102: Change
2. Assimetria gengival: comparar homologos (11 vs 21, 12 vs 22, 13 vs 23), diferenca >1mm -> gengivoplastia
// To:
2. Assimetria gengival: comparar homologos (11 vs 21, 12 vs 22, 13 vs 23), diferenca >1.5mm -> gengivoplastia
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/shared/clinical-rules.ts
git commit -m "fix(prompts): raise gingival asymmetry threshold from 1mm to 1.5mm (reduce false positives)"
```

---

### Task 24: Add thinkingLevel: "low" to Gemini image edit config

**Files:**
- Modify: `supabase/functions/_shared/gemini.ts` (inside callGeminiImageEdit)

**Step 1: Add thinkingConfig to the request**

```typescript
// In the request object, add thinkingConfig:
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      responseModalities: ["TEXT", "IMAGE"],
      ...(options.seed !== undefined && { seed: options.seed }),
    },
    // Add:
    thinkingConfig: {
      thinkingLevel: "low",
    },
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/gemini.ts
git commit -m "perf(gemini): set thinkingLevel to low for image edit (reduce latency)"
```

---

## Verification

After all tasks, run:

```bash
# Type check edge functions
cd supabase/functions && deno check _shared/prompts/definitions/recommend-resin.ts
cd supabase/functions && deno check generate-dsd/index.ts
cd supabase/functions && deno check _shared/gemini.ts

# Type check frontend
cd apps/web && npx tsc --noEmit

# Run tests
cd apps/web && pnpm test
```

---

## References

- Audit report: [[2026-02-18-dsd-quality-audit]]
- Design doc: [[2026-02-18-dsd-quality-audit-design]]
