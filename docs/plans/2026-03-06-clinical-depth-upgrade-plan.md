# Clinical Depth Upgrade - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elevate clinical depth by adding anamnesis transcription + radiograph upload to the wizard, upgrading AI models (Gemini 2.5 Pro, Claude Opus 4.6), deepening prompts, and fixing gengivoplasty inconsistencies.

**Architecture:** 4-phase incremental approach. Phase 1 expands the photo step with anamnesis + radiograph inputs and swaps AI models. Phase 2 deepens prompts for richer clinical output. Phase 3 fixes gengivoplasty detection/simulation. Phase 4 wires cross-integration (rx informs gengivo, anamnesis informs protocols).

**Tech Stack:** React 18, TypeScript, Vite, Supabase Edge Functions (Deno), Gemini 2.5 Pro, Claude Opus 4.6, Web Speech API, Tailwind CSS, shadcn/ui

---

## Phase 1: Inputs + Model Upgrade

### Task 1: Database migration — add anamnesis and radiograph columns

**Files:**
- Create: `supabase/migrations/051_anamnesis_and_radiograph.sql`

**Step 1: Write migration**

```sql
-- 051_anamnesis_and_radiograph.sql
-- Add anamnesis text and radiograph fields to evaluations

ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS anamnesis TEXT,
  ADD COLUMN IF NOT EXISTS radiograph_url TEXT,
  ADD COLUMN IF NOT EXISTS radiograph_type TEXT;

-- Add anamnesis to session_detected_teeth parent (session-level, not per-tooth)
-- No index needed — only queried by session_id which is already indexed

COMMENT ON COLUMN public.evaluations.anamnesis IS 'Free-form anamnesis transcription from voice recording or text input';
COMMENT ON COLUMN public.evaluations.radiograph_url IS 'Supabase Storage path for uploaded radiograph (panoramic/periapical/bitewing)';
COMMENT ON COLUMN public.evaluations.radiograph_type IS 'AI-detected type: panoramic, periapical, bitewing';
```

**Step 2: Apply migration locally**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/051_anamnesis_and_radiograph.sql
git commit -m "feat: add anamnesis and radiograph columns to evaluations"
```

---

### Task 2: Frontend types — add anamnesis and radiograph to wizard state

**Files:**
- Modify: `apps/web/src/hooks/domain/wizard/types.ts`
- Modify: `apps/web/src/components/wizard/PhotoUploadStep.tsx` (AdditionalPhotos interface)
- Modify: `apps/web/src/hooks/useWizardDraft.ts` (WizardDraft interface)
- Modify: `apps/web/src/types/evaluation.ts`

**Step 1: Update AdditionalPhotos in PhotoUploadStep.tsx**

At line 12, expand the interface:

```typescript
export interface AdditionalPhotos {
  smile45: string | null;
  face: string | null;
  radiograph: string | null;  // NEW
}
```

**Step 2: Update WizardFlowState in types.ts**

Add to the state interface (around line 34):

```typescript
anamnesis: string;
```

Add to actions interface (around line 96):

```typescript
setAnamnesis: (text: string) => void;
```

**Step 3: Update WizardDraft in useWizardDraft.ts**

Add to the interface (around line 22):

```typescript
anamnesis?: string;
```

**Step 4: Update evaluation types**

Add `anamnesis`, `radiograph_url`, `radiograph_type` to the Evaluation type in `types/evaluation.ts`.

**Step 5: Commit**

```bash
git add apps/web/src/hooks/domain/wizard/types.ts apps/web/src/components/wizard/PhotoUploadStep.tsx apps/web/src/hooks/useWizardDraft.ts apps/web/src/types/evaluation.ts
git commit -m "feat: add anamnesis and radiograph types to wizard state"
```

---

### Task 3: UI — add radiograph upload + anamnesis recording to PhotoUploadStep

**Files:**
- Modify: `apps/web/src/components/wizard/PhotoUploadStep.tsx`

**Step 1: Add radiograph upload section**

After the existing smile45/face optional photo sections, add a new collapsible section for radiograph upload. Follow the same pattern as the existing optional photo uploads (file input ref, processing state, preview).

Key differences from other photos:
- Icon: use `FileImage` or `ScanLine` from lucide-react (radiology-like)
- Label: "Radiografia (opcional)" with hint "Panoramica, periapical ou bitewing"
- Same compression/validation pipeline as other photos
- Store in `additionalPhotos.radiograph`

**Step 2: Add anamnesis section**

After the radiograph section, add:
- Section header: "Anamnese (opcional)" with hint "Grave ou digite observacoes do paciente"
- Mic button (large, centered) using `useSpeechToText('pt-BR')`
- Textarea below for editing/manual input
- Same pattern as ReviewAnalysisStep.tsx lines 248-288 (clinical notes with mic)
- Transcript appends to textarea on stop (same useEffect pattern, lines 96-103)
- Pass anamnesis value up via new `onAnamnesisChange` prop

**Step 3: Update props interface**

```typescript
interface PhotoUploadStepProps {
  // ... existing props
  anamnesis?: string;
  onAnamnesisChange?: (text: string) => void;
}
```

**Step 4: Add i18n keys**

Add keys to both `pt-BR.json` and `en-US.json`:
- `components.wizard.photo.radiograph`
- `components.wizard.photo.radiographHint`
- `components.wizard.photo.anamnesis`
- `components.wizard.photo.anamnesisHint`
- `components.wizard.photo.anamnesisPlaceholder`

**Step 5: Commit**

```bash
git add apps/web/src/components/wizard/PhotoUploadStep.tsx apps/web/src/i18n/locales/
git commit -m "feat: add radiograph upload and anamnesis recording to photo step"
```

---

### Task 4: Wire anamnesis + radiograph through useWizardFlow

**Files:**
- Modify: `apps/web/src/hooks/domain/useWizardFlow.ts`
- Modify: `apps/web/src/hooks/domain/wizard/useWizardAutoSave.ts`
- Modify: `apps/web/src/hooks/domain/wizard/useWizardDraftRestore.ts`
- Modify: `apps/web/src/components/wizard/steps/FotoStepWrapper.tsx`

**Step 1: Add anamnesis state in useWizardFlow.ts**

Around line 87 (near additionalPhotos state):

```typescript
const [anamnesis, setAnamnesis] = useState('');
```

**Step 2: Pass anamnesis to usePhotoAnalysis**

Around line 172 where `additionalPhotos` is passed to `usePhotoAnalysis`:

```typescript
const photoAnalysis = usePhotoAnalysis({
  // ... existing params
  additionalPhotos,
  anamnesis,  // NEW
  patientPreferences,
});
```

**Step 3: Include anamnesis in auto-save**

In `useWizardAutoSave.ts` around line 67, add `anamnesis` to the draft object.

**Step 4: Restore anamnesis from draft**

In `useWizardDraftRestore.ts`, restore `anamnesis` from saved draft.

**Step 5: Pass props through FotoStepWrapper**

Pass `anamnesis` and `setAnamnesis` through the wrapper to `PhotoUploadStep`.

**Step 6: Update additionalPhotos default**

In `useWizardFlow.ts` line 87, update default:

```typescript
const [additionalPhotos, setAdditionalPhotos] = useState<AdditionalPhotos>({
  smile45: null,
  face: null,
  radiograph: null,  // NEW
});
```

**Step 7: Commit**

```bash
git add apps/web/src/hooks/domain/useWizardFlow.ts apps/web/src/hooks/domain/wizard/ apps/web/src/components/wizard/steps/FotoStepWrapper.tsx
git commit -m "feat: wire anamnesis and radiograph through wizard flow"
```

---

### Task 5: Send anamnesis + radiograph to analyze-dental-photo edge function

**Files:**
- Modify: `apps/web/src/hooks/domain/wizard/usePhotoAnalysis.ts`
- Modify: `supabase/functions/analyze-dental-photo/index.ts`

**Step 1: Update usePhotoAnalysis to send anamnesis + radiograph**

In the edge function call payload (around line 220), add:

```typescript
body: JSON.stringify({
  imageBase64: compressedBase64,
  imageType: 'intraoral',
  additionalPhotos,  // now includes radiograph
  anamnesis,          // NEW
  patientPreferences,
}),
```

**Step 2: Update edge function to receive anamnesis + radiograph**

In `analyze-dental-photo/index.ts`, around line 86:

```typescript
const { additionalPhotos, patientPreferences, anamnesis } = data;
```

Around line 115, add anamnesis context:

```typescript
if (anamnesis) {
  additionalContext += `\n\nTRANSCRICAO DA ANAMNESE DO PACIENTE:\n"""${sanitizeForPrompt(anamnesis)}"""\n\nCORRELACIONE os achados visuais com a queixa do paciente. Priorize problemas que o paciente reportou. Se o paciente mencionar sintomas nao visiveis na foto (sensibilidade, dor), registre em observations como informacao clinica relevante.`;
}
```

Around line 141, add radiograph to additionalImages array:

```typescript
if (additionalPhotos?.radiograph) {
  const rxBase64 = extractBase64(additionalPhotos.radiograph);
  const rxValidation = validateImageMagicBytes(rxBase64);
  if (rxValidation.valid) {
    additionalImages.push({ data: rxBase64, mimeType: rxValidation.mimeType });
    additionalContext += '\n\nRADIOGRAFIA fornecida: Analise em conjunto com a foto clinica. Extraia: nivel osseo alveolar, proporcao coroa/raiz, lesoes periapicais, caries interproximais, reabsorcoes. CRUZE achados radiograficos com achados clinicos da foto.';
  }
}
```

**Step 3: Update prompt Params interface**

In `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts` line 4:

```typescript
export interface Params {
  imageType: string
  additionalContext?: string
  preferencesContext?: string
  anamnesis?: string  // NEW — passed separately for structured prompt sections
}
```

**Step 4: Commit**

```bash
git add apps/web/src/hooks/domain/wizard/usePhotoAnalysis.ts supabase/functions/analyze-dental-photo/index.ts supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts
git commit -m "feat: send anamnesis and radiograph to analyze-dental-photo"
```

---

### Task 6: Upgrade AI models

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts` (line 14)
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts` (line 351)
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-cementation.ts` (line 21)
- Modify: `supabase/functions/_shared/prompts/metrics.ts`
- Modify: `supabase/functions/_shared/prompts/prompts.test.ts`
- Modify: `supabase/functions/_shared/claude.ts` (fallback map)
- Modify: `supabase/functions/analyze-dental-photo/index.ts` (timeout, thinkingLevel)

**Step 1: Change model IDs in prompt definitions**

```typescript
// analyze-dental-photo.ts line 14
model: 'gemini-2.5-pro',

// recommend-resin.ts line 351
model: 'claude-opus-4-6',

// recommend-cementation.ts line 21
model: 'claude-opus-4-6',
```

**Step 2: Add Opus pricing to metrics.ts**

```typescript
'claude-opus-4-6': { input: 0.015, output: 0.075 },
```

**Step 3: Update fallback map in claude.ts**

Around line 22:

```typescript
const FALLBACK_MODELS: Record<string, string> = {
  "claude-opus-4-6": "claude-sonnet-4-6",        // NEW: Opus falls back to Sonnet
  "claude-sonnet-4-6": "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5-20251001": "claude-sonnet-4-6",
};
```

**Step 4: Update analyze-dental-photo timeout and thinking**

In `analyze-dental-photo/index.ts`, around line 200:

```typescript
// Gemini 2.5 Pro supports native thinking — remove thinkingLevel hack
timeoutMs: 90_000,
// REMOVE: thinkingLevel: "low",  — Gemini 2.5 Pro handles thinking natively
```

**Step 5: Update recommend-resin and recommend-cementation timeouts**

In both edge function index.ts files, increase Claude timeout from 45s to 60s for Opus:

```typescript
timeoutMs: 60_000,  // was 45_000 — Opus needs more time
```

**Step 6: Update fallback for photo analysis**

In `analyze-dental-photo/index.ts`, the Claude fallback (around line 220) should use `claude-sonnet-4-6` instead of `claude-haiku-4-5-20251001`.

**Step 7: Update regression tests in prompts.test.ts**

```typescript
Deno.test("analyze-dental-photo uses Gemini 2.5 Pro", () => {
  const p = getPrompt("analyze-dental-photo");
  assertEquals(p.model, "gemini-2.5-pro");
  // ... keep other assertions
});

Deno.test("recommend-resin uses Claude Opus 4.6", () => {
  const p = getPrompt("recommend-resin");
  assertEquals(p.model, "claude-opus-4-6");
  // ... keep other assertions
});

Deno.test("recommend-cementation uses Claude Opus 4.6", () => {
  const p = getPrompt("recommend-cementation");
  assertEquals(p.model, "claude-opus-4-6");
  // ... keep other assertions
});
```

**Step 8: Run prompt tests**

Run: `cd supabase/functions && deno test _shared/prompts/prompts.test.ts`
Expected: All tests pass

**Step 9: Commit**

```bash
git add supabase/functions/_shared/
git commit -m "feat: upgrade models — Gemini 2.5 Pro (photo), Claude Opus 4.6 (protocols)"
```

---

### Task 7: Save anamnesis + radiograph to evaluation on submit

**Files:**
- Modify: `apps/web/src/hooks/domain/wizard/useWizardSubmit.ts`
- Modify: `apps/web/src/data/wizard.ts`

**Step 1: Pass anamnesis to createEvaluationBatch**

In `useWizardSubmit.ts`, include `anamnesis` in the evaluation data passed to the data layer.

**Step 2: Upload radiograph to Supabase Storage**

In the submit flow, before creating evaluations:
- Upload radiograph to `clinical-photos` bucket (same as other photos)
- Store the path as `radiograph_url`

**Step 3: Include anamnesis and radiograph_url in evaluation insert**

In `data/wizard.ts`, add `anamnesis` and `radiograph_url` to the evaluation insert object.

**Step 4: Commit**

```bash
git add apps/web/src/hooks/domain/wizard/useWizardSubmit.ts apps/web/src/data/wizard.ts
git commit -m "feat: persist anamnesis and radiograph on evaluation submit"
```

---

### Task 8: Pass anamnesis to protocol edge functions

**Files:**
- Modify: `apps/web/src/data/wizard.ts` (where recommend-resin and recommend-cementation are called)
- Modify: `supabase/functions/recommend-resin/index.ts`
- Modify: `supabase/functions/recommend-cementation/index.ts`

**Step 1: Include anamnesis in recommend-resin payload**

In `data/wizard.ts`, add `anamnesis` to the body sent to `recommend-resin` edge function.

**Step 2: Handle anamnesis in recommend-resin edge function**

In `recommend-resin/index.ts`, extract anamnesis from request data and include in prompt context:

```typescript
if (data.anamnesis) {
  promptContext += `\n\nANAMNESE DO PACIENTE: """${sanitizeForPrompt(data.anamnesis)}"""\nConsidere queixas do paciente ao selecionar materiais e tecnica (ex: sensibilidade → dessensibilizante, bruxismo → resina mais resistente).`;
}
```

**Step 3: Same for recommend-cementation**

Same pattern — include anamnesis context in cementation prompt.

**Step 4: Include radiograph summary in protocol calls**

The `analysisResult` from photo analysis already contains radiographic findings (when rx was provided). Pass relevant fields to protocol edge functions via the existing `dsdContext` or a new `clinicalContext` field.

**Step 5: Commit**

```bash
git add apps/web/src/data/wizard.ts supabase/functions/recommend-resin/ supabase/functions/recommend-cementation/
git commit -m "feat: pass anamnesis and radiograph context to protocol edge functions"
```

---

## Phase 2: Prompt Depth

### Task 9: Deepen analyze-dental-photo prompt

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts`

**Step 1: Add clinical depth requirements to system prompt**

Add to the clinical analysis section (after existing rules):

```
## PROFUNDIDADE CLINICA OBRIGATORIA

Para CADA dente com achado clinico, inclua:

1. DIAGNOSTICO DIFERENCIAL quando achado ambiguo:
   - Mancha escura → carie vs pigmentacao extrinseca vs restauracao antiga vs fluorose? JUSTIFIQUE
   - Fratura → trauma vs desgaste oclusal vs fadiga? EVIDENCIA na foto
   - Descoloracao → necrose pulpar vs restauracao metalica vs pigmentacao? PISTAS visuais

2. SEVERIDADE com criterios objetivos:
   - Extensao estimada (% da face do dente acometida)
   - Profundidade visual (superficial/media/profunda baseado em sombra/translucidez)
   - Urgencia (imediato/eletivo/monitorar)

3. PROGNOSTICO RESTAURADOR:
   - Favoravel: estrutura dental suficiente, acesso adequado, sem comprometimento pulpar aparente
   - Reservado: grande extensao, proximidade pulpar suspeitada, multiplas faces
   - Desfavoravel: destruicao extensa, suspeita de comprometimento endodontico
```

**Step 2: Add radiograph analysis section (conditional)**

```
## ANALISE RADIOGRAFICA (quando radiografia fornecida)

CRUZE achados radiograficos com achados clinicos:
- Nivel osseo alveolar: crista ossea em relacao a JAC (normal, perda horizontal, perda vertical)
- Proporcao coroa/raiz por dente anterior: essencial para indicacao de gengivoplastia
- Lesoes periapicais: radiolucidez periapical = CONTRAINDICACAO para procedimento estetico ate tratamento endodontico
- Caries interproximais: nao visiveis clinicamente — ADICIONE ao detected_teeth se identificadas
- Restauracoes existentes: extensao real vs aparencia clinica
- Reabsorcoes: interna ou externa = WARNING critico

REGRA: Se radiografia mostra patologia NAO visivel na foto, ADICIONE ao detected_teeth com nota "achado radiografico"
REGRA: Se foto sugere carie mas rx NAO confirma, REDUZA confianca e note "considerar pigmentacao"
```

**Step 3: Add anamnesis correlation section (conditional)**

```
## CORRELACAO COM ANAMNESE (quando transcricao fornecida)

- PRIORIZE achados que o paciente REPORTOU (queixa principal = foco)
- Se paciente reporta sintoma NAO visivel (sensibilidade, dor noturna), registre em observations
- Se paciente tem expectativa estetica especifica, considere na priorizacao
- NUNCA ignore queixa do paciente por nao ter achado visual — pode ser achado radiografico ou subclínico
```

**Step 4: Run prompt tests**

Run: `cd supabase/functions && deno test _shared/prompts/prompts.test.ts`
Expected: All tests pass

**Step 5: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts
git commit -m "feat: deepen photo analysis prompt — differential dx, severity, prognosis, rx correlation"
```

---

### Task 10: Deepen recommend-resin prompt

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`

**Step 1: Add clinical depth requirements**

Add to the system prompt:

```
## PROFUNDIDADE DO PROTOCOLO

Para CADA decisao no protocolo, inclua JUSTIFICATIVA CLINICA concisa (1 frase):
- Por que ESSA resina (propriedades mecanicas, opticas, ou esteticas que se aplicam ao caso)
- Por que ESSA tecnica de estratificacao (opacidade do substrato, espessura disponivel, resultado estetico)

SEQUENCIA OPERATORIA — inclua no campo "clinical_sequence":
1. Preparo (tipo, extensao, bisel)
2. Protecao do complexo dentino-pulpar (se proximidade pulpar detectada na analise)
3. Sistema adesivo (qual, por que, protocolo)
4. Incrementos (sequencia, espessura max, direcao de insercao)
5. Acabamento e polimento (instrumentos, sequencia)

ALERTAS CONTEXTUAIS — adicione ao campo "warnings" quando aplicavel:
- Proximidade pulpar → capeamento indireto ANTES da restauracao
- Sensibilidade reportada na anamnese → protocolo dessensibilizante
- Bruxismo → resina de alta resistencia ao desgaste, considerar placa oclusal
- Dente antagonista ceramica → resina com resistencia ao desgaste compativel
```

**Step 2: Run prompt tests**

Run: `cd supabase/functions && deno test _shared/prompts/prompts.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "feat: deepen resin protocol prompt — justification, sequence, contextual alerts"
```

---

### Task 11: Deepen recommend-cementation prompt

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-cementation.ts`

**Step 1: Add clinical depth**

Add to the system prompt:

```
## PROFUNDIDADE DO PROTOCOLO

DECISAO FUNDAMENTADA substrato → cimento:
- JUSTIFIQUE por que esse cimento (translucidez do substrato, cor do preparo, espessura da peca)
- Se dente escurecido: cimento OPACO (nao translucido) — explique por que
- Se peca fina (<0.5mm): cimento de alta translucidez — explique por que

SEQUENCIA COM TEMPOS PRATICOS:
- Acido fluoridrico: concentracao + tempo EXATO (ex: "5% HF por 20s")
- Silano: tempo de evaporacao ("aguardar 60s para evaporacao completa")
- Adesivo: "aplicar SEM fotopolimerizar" ou "fotopolimerizar 10s" — ser explicito
- Cimentacao: "pressao LEVE e constante por 3s, remover excessos com pincel"
- Fotopolimerizacao: tempo por face (ex: "40s vestibular + 40s palatina")

WARNINGS CONTEXTUAIS:
- Remanescente comprometido → reforco com pino de fibra ANTES da cimentacao
- Contaminacao salivar → protocolo de descontaminacao (alcool 70% + ressilano)
- Margem subgengival → controle de umidade com fio retrator
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-cementation.ts
git commit -m "feat: deepen cementation protocol prompt — decision rationale, timing, warnings"
```

---

## Phase 3: Gengivoplasty Fixes

### Task 12: Fix gengivoplasty detection in photo analysis prompt

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts`
- Modify: `supabase/functions/_shared/prompts/shared/clinical-rules.ts` (GINGIVAL_CRITERIA)

**Step 1: Rewrite gengivoplasty detection rules**

Replace the current 3-tier smile line rules with evidence-based detection:

```
## GENGIVOPLASTIA — INDICACAO BASEADA EM EVIDENCIA COMBINADA

NAO use smile line isoladamente. Combine TODAS as evidencias disponiveis:

EVIDENCIAS A FAVOR (cada uma soma peso):
1. Exposicao gengival excessiva (>3mm alem da margem gengival ao sorrir) — peso ALTO
2. Assimetria gengival visivel entre dentes homologos — peso ALTO
3. Coroa clinica visivelmente curta com excesso de tecido gengival — peso ALTO
4. Paciente REPORTA incomodo com sorriso gengival (anamnese) — peso ALTO
5. Rx mostra proporcao coroa/raiz favoravel (raiz longa, coroa curta = erupcao passiva) — peso CONFIRMATORIO
6. Contorno gengival irregular (zeniths desalinhados) — peso MEDIO

EVIDENCIAS CONTRA (cada uma reduz indicacao):
1. Rx mostra raiz CURTA (proporcao desfavoravel) — CONTRAINDICACAO RELATIVA
2. Paciente NAO menciona queixa gengival e exposicao <2mm — peso CONTRA
3. Simetria gengival adequada, contorno harmonico — nao intervir
4. Coroa clinica com comprimento adequado (>10mm anterior) — nao e erupcao passiva

REGRA DE DECISAO:
- 2+ evidencias a favor + nenhuma contra forte → INDICAR gengivoplastia
- Evidencia a favor + evidencia contra → REGISTRAR ambas, sugerir avaliacao clinica
- Rx confirma erupcao passiva → INDICAR com ALTA confianca
- Sem evidencia objetiva, apenas "media" smile line → NAO INDICAR

Para CADA dente com gengivoplastia indicada, especifique:
- gingival_reduction_pct: estimativa de % de reducao da margem gengival (ex: 15)
- gingival_reason: justificativa clinica (ex: "erupcao passiva alterada — coroa clinica 7mm, proporcao coroa/raiz 1:2 favoravel")
```

**Step 2: Update tool schema if needed**

If `gingival_reduction_pct` and `gingival_reason` are not in the tool schema, add them as optional fields in `analyze-dental-photo/tool-schema.ts` inside the `detected_teeth` items.

**Step 3: Run prompt tests**

Run: `cd supabase/functions && deno test _shared/prompts/prompts.test.ts`

**Step 4: Commit**

```bash
git add supabase/functions/_shared/prompts/ supabase/functions/analyze-dental-photo/
git commit -m "fix: evidence-based gengivoplasty detection replacing smile-line tiers"
```

---

### Task 13: Fix gengivoplasty DSD simulation — texture, color, magnitude

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-simulation-shared.ts`
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-simulation-builders.ts`

**Step 1: Improve gengivo texture/color rules in shared blocks**

In `dsd-simulation-shared.ts`, update the gengivoplasty simulation rules:

```
REGRAS DE TEXTURA E COR GENGIVAL:
1. A gengiva apos reducao DEVE ter a MESMA cor e textura da gengiva adjacente nao-modificada
2. COPIE o padrao de stippling (pontilhado) da gengiva original — NAO pinte area uniforme
3. Gradiente de cor: rosa-coral na gengiva aderida, rosa mais escuro na gengiva livre
4. Vascularizacao sutil: mantenha variacao natural de tom (NAO uniforme)
5. A transicao entre gengiva modificada e nao-modificada deve ser IMPERCEPTIVEL
6. PROIBIDO: cor uniforme, textura lisa artificial, linha de corte reta/digital
7. REFERENCIA: use a gengiva entre caninos (13-23) nao-modificada como source of truth para cor e textura
```

**Step 2: Add magnitude control in builders**

In `dsd-simulation-builders.ts`, update `buildWithGengivoplastyPrompt()` to use specific reduction values:

```
MAGNITUDE DO CORTE GENGIVAL:
- Use EXATAMENTE os valores de gingival_reduction_pct da analise para cada dente
- Se nao disponivel, calcule pela golden ratio: largura/comprimento alvo = 75-80%
- MAXIMO absoluto: 2mm de reducao (seguranca biologica)
- A reducao deve ser GRADUAL entre dentes adjacentes (nao abrupta)
- Zenith gengival: manter 1mm distal ao eixo longo do dente (anatomia natural)
```

**Step 3: Pass gingival_reduction_pct from analysis to DSD**

Ensure the DSD simulation receives per-tooth reduction percentages from the analysis result. This data flows through the `existingAnalysis` parameter that `generate-dsd` already receives.

**Step 4: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-simulation-shared.ts supabase/functions/_shared/prompts/definitions/dsd-simulation-builders.ts
git commit -m "fix: gengivoplasty DSD — realistic texture/color, precise magnitude control"
```

---

## Phase 4: Cross-Integration

### Task 14: Wire radiograph findings to gengivoplasty decision

**Files:**
- Modify: `supabase/functions/generate-dsd/simulation.ts`

**Step 1: Include radiograph-derived data in DSD prompts**

When building the DSD simulation prompt, if the analysis result contains radiographic findings (crown/root ratio, bone level), include them:

```typescript
if (existingAnalysis?.radiographic_findings) {
  prompt += `\n\nDADOS RADIOGRAFICOS RELEVANTES:\n${existingAnalysis.radiographic_findings}\nUse proporcao coroa/raiz para validar magnitude do corte gengival.`;
}
```

**Step 2: Commit**

```bash
git add supabase/functions/generate-dsd/simulation.ts
git commit -m "feat: wire radiograph findings to DSD gengivoplasty simulation"
```

---

### Task 15: Include anamnesis + rx summary in PDF report

**Files:**
- Modify: `apps/web/src/lib/pdf/pdfHelpers.ts` or wherever PDF is generated

**Step 1: Add anamnesis section to PDF**

If anamnesis is present, add a "Anamnese" section near the top of the PDF report.

**Step 2: Add radiograph image to PDF**

If radiograph_url is present, include the radiograph image in the PDF as a complementary image.

**Step 3: Commit**

```bash
git add apps/web/src/lib/pdf/
git commit -m "feat: include anamnesis and radiograph in PDF report"
```

---

### Task 16: Deploy edge functions

**Step 1: Deploy all modified edge functions sequentially**

```bash
open -a Docker  # Ensure Docker is running

npx supabase functions deploy analyze-dental-photo --no-verify-jwt --use-docker && \
npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker && \
npx supabase functions deploy recommend-cementation --no-verify-jwt --use-docker && \
npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker
```

IMPORTANT: Deploy sequentially (not parallel) to avoid ENOTEMPTY cache race conditions.
IMPORTANT: Delete `deno.lock` before deploy if Deno lockfile v5 incompatibility occurs.

**Step 2: Apply database migration to production**

```bash
npx supabase db push
```

**Step 3: Deploy frontend to Vercel**

Push to main branch triggers Vercel auto-deploy, or:

```bash
npx vercel --prod
```

**Step 4: Commit any deploy-related fixes**

---

### Task 17: End-to-end validation

**Step 1: Test anamnesis flow**
- Open wizard, record anamnesis via microphone
- Verify transcript appears in textarea
- Verify anamnesis is saved in evaluation after submit
- Verify anamnesis appears in PDF

**Step 2: Test radiograph flow**
- Upload panoramic radiograph in step 1
- Verify it's sent to analyze-dental-photo
- Verify analysis includes radiographic findings
- Verify radiograph appears in PDF

**Step 3: Test model upgrades**
- Submit a case and verify Gemini 2.5 Pro is used (check edge function logs)
- Verify protocol depth is improved (more justification, sequence, alerts)
- Verify Claude Opus 4.6 is used for protocols (check logs)

**Step 4: Test gengivoplasty**
- Test with high smile line photo — verify detection with evidence
- Test DSD simulation — verify realistic gengival texture
- Test with radiograph — verify crown/root ratio influences decision
- Test with photo where gengivo should NOT be indicated — verify no false positive

**Step 5: Test fallbacks**
- Temporarily break Gemini API key — verify Claude Sonnet fallback works for photo analysis
- Temporarily break Claude Opus — verify Sonnet fallback works for protocols
