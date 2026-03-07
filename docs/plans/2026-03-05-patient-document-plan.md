# Patient Document Generation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate patient-facing documents (treatment explanation, post-op instructions, dietary guide, TCLE) from existing clinical data, delivered via SharedEvaluation page + WhatsApp + PDF.

**Architecture:** New edge function `generate-patient-document` calls Haiku 4.5 for AI content + fixed TCLE template. Result stored in `evaluations.patient_document` (jsonb). Frontend button on EvaluationDetails triggers generation; SharedEvaluation page displays result; separate patient PDF available for download.

**Tech Stack:** Deno (edge function), Claude Haiku 4.5 (AI), jsPDF (patient PDF), React + PageShell primitives (UI), Supabase (storage).

**Design doc:** `docs/plans/2026-03-05-patient-document-design.md`

---

## Task 1: Database — Add `patient_document` column

**Files:**
- Create: `supabase/migrations/20260305000000_add_patient_document.sql`

**Step 1: Write the migration SQL**

```sql
-- Add patient_document jsonb column to evaluations table
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS patient_document jsonb DEFAULT NULL;

COMMENT ON COLUMN evaluations.patient_document IS 'AI-generated patient-facing document (explanation, post-op, diet, TCLE)';
```

**Step 2: Run migration locally**

Run: `npx supabase db push`
Expected: Migration applied successfully.

**Step 3: Commit**

```bash
git add supabase/migrations/20260305000000_add_patient_document.sql
git commit -m "feat(db): add patient_document jsonb column to evaluations"
```

---

## Task 2: TCLE Template — Fixed legal template with dynamic fields

**Files:**
- Create: `supabase/functions/_shared/templates/tcle.ts`

**Step 1: Create the TCLE template**

The template uses simple string interpolation — no AI involved. Fields come from evaluation data + profile data.

```typescript
export interface TCLEParams {
  procedimento: string
  dente: string
  material: string
  riscos: string[]
  alternativas: string
  clinica: string
  dentista: string
  cro: string
  data: string
  paciente: string
}

export function generateTCLE(params: TCLEParams): string {
  const riscosText = params.riscos.length > 0
    ? params.riscos.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : '- Riscos inerentes a qualquer procedimento odontologico (dor, sensibilidade, necessidade de retoque).'

  return `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO

Eu, ${params.paciente}, declaro que fui devidamente informado(a) pelo(a) Dr(a). ${params.dentista} (CRO: ${params.cro}), da clinica ${params.clinica}, sobre o tratamento odontologico ao qual serei submetido(a).

PROCEDIMENTO: ${params.procedimento}
ELEMENTO DENTAL: ${params.dente}
MATERIAL UTILIZADO: ${params.material}
DATA: ${params.data}

RISCOS E POSSÍVEIS COMPLICACOES:
${riscosText}

ALTERNATIVAS DE TRATAMENTO:
${params.alternativas}

Declaro que:
1. Recebi explicacoes claras e em linguagem acessivel sobre o procedimento proposto.
2. Fui informado(a) sobre os riscos, beneficios e alternativas ao tratamento.
3. Tive a oportunidade de fazer perguntas e todas foram respondidas satisfatoriamente.
4. Compreendo que o resultado do tratamento pode variar de acordo com fatores individuais.
5. Estou ciente de que posso revogar este consentimento a qualquer momento antes do inicio do procedimento.

Consinto de forma livre e esclarecida com a realizacao do procedimento descrito acima.


_____________________________________________
Paciente: ${params.paciente}
Data: ${params.data}


_____________________________________________
Profissional: Dr(a). ${params.dentista}
CRO: ${params.cro}`
}
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/templates/tcle.ts
git commit -m "feat: add fixed TCLE template with dynamic field interpolation"
```

---

## Task 3: Prompt Definition — `patient-document`

**Files:**
- Create: `supabase/functions/_shared/prompts/definitions/patient-document.ts`
- Modify: `supabase/functions/_shared/prompts/registry.ts:1-17` (add import + register)

**Step 1: Create the prompt definition**

```typescript
import type { PromptDefinition } from '../types.ts'

export interface PatientDocumentParams {
  treatmentType: string       // e.g. "restauracao em resina composta"
  toothName: string           // e.g. "incisivo central superior direito (dente 11)"
  material: string            // e.g. "Z350 XT (3M)"
  region: string              // e.g. "anterior"
  aestheticLevel: string      // e.g. "estetico"
  patientAge: number
  bruxism: boolean
  alerts: string[]            // clinical alerts/warnings
  additionalContext?: string  // any extra clinical notes
}

export const patientDocument: PromptDefinition<PatientDocumentParams> = {
  id: 'patient-document',
  name: 'Patient Document Generator',
  description: 'Generates patient-facing treatment explanation, post-operative instructions, and dietary guide in accessible Portuguese.',
  model: 'claude-haiku-4-5-20251001',
  temperature: 0.3,
  maxTokens: 2000,
  tags: ['patient', 'document', 'post-op'],
  mode: 'text-tools',
  provider: 'claude',

  system: (_params: PatientDocumentParams) => `Voce e um assistente odontologico que gera documentos para PACIENTES (nao dentistas).

REGRAS OBRIGATORIAS:
- Linguagem LEIGA: nunca use jargao tecnico. Se precisar mencionar um termo tecnico, explique entre parenteses.
- Portugues brasileiro, tom acolhedor e profissional.
- Orientacoes PRATICAS e ESPECIFICAS ao procedimento (nao genericas).
- Seja conciso: 2-3 paragrafos para explicacao, 8-12 itens para orientacoes, 4-6 itens para dieta.
- NAO invente riscos ou complicacoes que nao se aplicam ao procedimento.
- NAO faca diagnosticos ou sugira medicamentos (apenas orientacoes gerais como "tome a medicacao prescrita pelo dentista").`,

  user: (params: PatientDocumentParams) => {
    const alertsText = params.alerts.length > 0
      ? `\nAlertas clinicos: ${params.alerts.join('; ')}`
      : ''

    return `Gere o documento do paciente para este caso:

Procedimento: ${params.treatmentType}
Dente: ${params.toothName}
Material: ${params.material}
Regiao: ${params.region}
Nivel estetico: ${params.aestheticLevel}
Idade do paciente: ${params.patientAge} anos
Bruxismo: ${params.bruxism ? 'sim' : 'nao'}${alertsText}${params.additionalContext ? `\nContexto adicional: ${params.additionalContext}` : ''}`
  },
}
```

**Step 2: Register in prompt registry**

In `supabase/functions/_shared/prompts/registry.ts`, add:
- Import: `import { patientDocument } from './definitions/patient-document.ts'`
- Register: `[patientDocument.id]: register(patientDocument),` in the registry object

**Step 3: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/patient-document.ts supabase/functions/_shared/prompts/registry.ts
git commit -m "feat: add patient-document prompt definition to registry"
```

---

## Task 4: Edge Function — `generate-patient-document`

**Files:**
- Create: `supabase/functions/generate-patient-document/index.ts`
- Modify: `supabase/config.toml` (add `[functions.generate-patient-document]` with `verify_jwt = false`)

**Step 1: Create the edge function**

The function:
1. Authenticates user via middleware
2. Fetches evaluation data + profile data from DB
3. Calls Haiku 4.5 with `patient-document` prompt (tool calling for structured JSON)
4. Optionally generates TCLE from fixed template
5. Saves result to `evaluations.patient_document`
6. Returns the generated document

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders, handleCorsOptions, errorResponse } from "../_shared/cors.ts"
import { authenticateRequest } from "../_shared/middleware.ts"
import { callClaudeWithTools } from "../_shared/claude.ts"
import { getPrompt } from "../_shared/prompts/registry.ts"
import { withMetrics } from "../_shared/prompts/metrics.ts"
import { generateTCLE } from "../_shared/templates/tcle.ts"
import { logger } from "../_shared/logger.ts"
import { sanitizeForPrompt } from "../_shared/validation.ts"
import type { PatientDocumentParams } from "../_shared/prompts/definitions/patient-document.ts"

// Tool schema for structured output
const DOCUMENT_TOOL = {
  name: "generate_patient_document",
  description: "Generate patient-facing document with treatment explanation, post-operative instructions, and dietary guide",
  input_schema: {
    type: "object" as const,
    required: ["treatment_explanation", "post_operative", "dietary_guide"],
    properties: {
      treatment_explanation: {
        type: "string",
        description: "2-3 paragraphs explaining the treatment in accessible language for the patient",
      },
      post_operative: {
        type: "array",
        items: { type: "string" },
        description: "8-12 specific post-operative care instructions",
      },
      dietary_guide: {
        type: "object",
        required: ["avoid", "prefer", "duration_hours"],
        properties: {
          avoid: {
            type: "array",
            items: { type: "string" },
            description: "Foods/drinks to avoid after the procedure",
          },
          prefer: {
            type: "array",
            items: { type: "string" },
            description: "Recommended foods/drinks during recovery",
          },
          duration_hours: {
            type: "number",
            description: "Duration in hours for dietary restrictions (24, 48, or 72)",
          },
        },
      },
    },
  },
}

// Map FDI tooth number to patient-friendly name
function toothToName(tooth: string): string {
  const names: Record<string, string> = {
    '11': 'incisivo central superior direito', '21': 'incisivo central superior esquerdo',
    '12': 'incisivo lateral superior direito', '22': 'incisivo lateral superior esquerdo',
    '13': 'canino superior direito', '23': 'canino superior esquerdo',
    '14': 'primeiro pre-molar superior direito', '24': 'primeiro pre-molar superior esquerdo',
    '15': 'segundo pre-molar superior direito', '25': 'segundo pre-molar superior esquerdo',
    '16': 'primeiro molar superior direito', '26': 'primeiro molar superior esquerdo',
    '17': 'segundo molar superior direito', '27': 'segundo molar superior esquerdo',
    '18': 'terceiro molar superior direito', '28': 'terceiro molar superior esquerdo',
    '31': 'incisivo central inferior esquerdo', '41': 'incisivo central inferior direito',
    '32': 'incisivo lateral inferior esquerdo', '42': 'incisivo lateral inferior direito',
    '33': 'canino inferior esquerdo', '43': 'canino inferior direito',
    '34': 'primeiro pre-molar inferior esquerdo', '44': 'primeiro pre-molar inferior direito',
    '35': 'segundo pre-molar inferior esquerdo', '45': 'segundo pre-molar inferior direito',
    '36': 'primeiro molar inferior esquerdo', '46': 'primeiro molar inferior direito',
    '37': 'segundo molar inferior esquerdo', '47': 'segundo molar inferior direito',
    '38': 'terceiro molar inferior esquerdo', '48': 'terceiro molar inferior direito',
  }
  return names[tooth] || `dente ${tooth}`
}

// Map treatment_type to patient-friendly description
function treatmentToDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'resina': 'restauracao em resina composta',
    'porcelana': 'restauracao em porcelana (ceramica)',
    'coroa': 'coroa protética',
    'implante': 'implante dentario',
    'endodontia': 'tratamento de canal',
    'gengivoplastia': 'cirurgia gengival (gengivoplastia)',
    'recobrimento_radicular': 'recobrimento da raiz exposta',
    'encaminhamento': 'encaminhamento para especialista',
  }
  return descriptions[type] || type
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCorsOptions()

  try {
    const { user, supabase: userClient } = await authenticateRequest(req)

    const body = await req.json()
    const { sessionId, includeTCLE = true } = body

    if (!sessionId) {
      return errorResponse("sessionId is required", 400, corsHeaders)
    }

    // Fetch evaluations for this session
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: evals, error: evalsError } = await adminClient
      .from("evaluations")
      .select("id, tooth, treatment_type, resins, region, alerts, warnings, patient_age, aesthetic_level, bruxism, patient_name, ai_treatment_indication, ai_indication_reason")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)

    if (evalsError || !evals?.length) {
      return errorResponse("No evaluations found for session", 404, corsHeaders)
    }

    // Fetch profile for TCLE
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, cro, clinic_name")
      .eq("id", user.id)
      .single()

    const prompt = getPrompt<PatientDocumentParams>("patient-document")

    // Generate document for each evaluation
    const documents: Record<string, unknown>[] = []

    for (const evaluation of evals) {
      const toothName = toothToName(evaluation.tooth)
      const treatmentDesc = treatmentToDescription(evaluation.treatment_type || "resina")
      const materialName = evaluation.resins?.name
        ? `${evaluation.resins.name} (${evaluation.resins.manufacturer || ''})`
        : treatmentDesc

      const params: PatientDocumentParams = {
        treatmentType: treatmentDesc,
        toothName: `${toothName} (dente ${evaluation.tooth})`,
        material: sanitizeForPrompt(materialName),
        region: evaluation.region || "nao especificada",
        aestheticLevel: evaluation.aesthetic_level || "funcional",
        patientAge: evaluation.patient_age || 30,
        bruxism: evaluation.bruxism || false,
        alerts: [
          ...(evaluation.alerts || []),
          ...(evaluation.warnings || []),
        ],
      }

      const systemPrompt = prompt.system(params)
      const userPrompt = prompt.user(params)

      const result = await withMetrics(
        prompt,
        async () => {
          const response = await callClaudeWithTools({
            messages: [{ role: "user", content: userPrompt }],
            system: systemPrompt,
            tools: [DOCUMENT_TOOL],
            model: prompt.model,
            temperature: prompt.temperature,
            maxTokens: prompt.maxTokens,
            forceFunctionName: "generate_patient_document",
          })
          return response
        },
      )

      // Parse tool call result
      const toolResult = result.toolCalls?.[0]?.input || result.toolCalls?.[0]?.arguments
      if (!toolResult) {
        logger.error(`No tool result for evaluation ${evaluation.id}`)
        continue
      }

      const doc: Record<string, unknown> = {
        tooth: evaluation.tooth,
        treatment_type: evaluation.treatment_type,
        ...toolResult,
        generated_at: new Date().toISOString(),
      }

      // Generate TCLE if requested
      if (includeTCLE) {
        const allAlerts = [...(evaluation.alerts || []), ...(evaluation.warnings || [])]
        doc.tcle = generateTCLE({
          procedimento: treatmentDesc,
          dente: `${toothName} (${evaluation.tooth})`,
          material: materialName,
          riscos: allAlerts,
          alternativas: evaluation.ai_indication_reason || "Discutir alternativas com o profissional.",
          clinica: profile?.clinic_name || "Clinica",
          dentista: profile?.full_name || "Dentista",
          cro: profile?.cro || "",
          data: new Date().toLocaleDateString("pt-BR"),
          paciente: evaluation.patient_name || "Paciente",
        })
      }

      documents.push(doc)

      // Save to evaluation record
      await adminClient
        .from("evaluations")
        .update({ patient_document: doc })
        .eq("id", evaluation.id)
    }

    return new Response(
      JSON.stringify({ success: true, documents }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    logger.error("generate-patient-document error:", error)
    return errorResponse(
      error instanceof Error ? error.message : "Internal error",
      500,
      corsHeaders,
    )
  }
})
```

**Step 2: Add to `supabase/config.toml`**

After the last `[functions.*]` entry, add:

```toml
[functions.generate-patient-document]
verify_jwt = false
```

**Step 3: Commit**

```bash
git add supabase/functions/generate-patient-document/index.ts supabase/config.toml
git commit -m "feat: add generate-patient-document edge function"
```

---

## Task 5: Frontend Data Layer — call edge function + expose patient_document

**Files:**
- Modify: `apps/web/src/data/evaluations.ts` — add `patient_document` to `SessionEvaluationRow`, add `generatePatientDocument()` function, add `patient_document` to `SharedEvaluationRow`, expose in shared RPCs

**Step 1: Add `patient_document` to types and data functions**

In `apps/web/src/data/evaluations.ts`:

1. Add to `SessionEvaluationRow` (after line 67 `ideal_resin` field):
```typescript
  patient_document: PatientDocument | null;
```

2. Add the `PatientDocument` type before the interface:
```typescript
export interface PatientDocumentDiet {
  avoid: string[];
  prefer: string[];
  duration_hours: number;
}

export interface PatientDocument {
  tooth: string;
  treatment_type: string;
  treatment_explanation: string;
  post_operative: string[];
  dietary_guide: PatientDocumentDiet;
  tcle?: string;
  generated_at: string;
}
```

3. Add the edge function call:
```typescript
export async function generatePatientDocument(
  sessionId: string,
  includeTCLE: boolean = true,
): Promise<PatientDocument[]> {
  const { data, error } = await supabase.functions.invoke('generate-patient-document', {
    body: { sessionId, includeTCLE },
  });
  if (error) throw error;
  return data.documents as PatientDocument[];
}
```

4. Add `patient_document` to `SharedEvaluationRow` (line ~327):
```typescript
  patient_document: PatientDocument | null;
```

**Step 2: Commit**

```bash
git add apps/web/src/data/evaluations.ts
git commit -m "feat: add patient document types and edge function call"
```

---

## Task 6: Frontend Hook — `usePatientDocument`

**Files:**
- Create: `apps/web/src/hooks/domain/evaluation/usePatientDocument.ts`
- Modify: `apps/web/src/hooks/domain/evaluation/index.ts` (add export)

**Step 1: Create the hook**

```typescript
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generatePatientDocument, type PatientDocument } from '@/data/evaluations';
import { evaluationKeys } from './useEvaluationData';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';

export interface UsePatientDocumentReturn {
  isGenerating: boolean;
  documents: PatientDocument[] | null;
  handleGenerateDocument: (includeTCLE: boolean) => Promise<void>;
  clearDocuments: () => void;
}

export function usePatientDocument(sessionId: string): UsePatientDocumentReturn {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [documents, setDocuments] = useState<PatientDocument[] | null>(null);

  const mutation = useMutation({
    mutationFn: ({ includeTCLE }: { includeTCLE: boolean }) =>
      generatePatientDocument(sessionId, includeTCLE),
    onSuccess: (data) => {
      setDocuments(data);
      queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
      trackEvent('patient_document_generated', {
        session_id: sessionId,
        document_count: data.length,
        has_tcle: data.some(d => !!d.tcle),
      });
      toast.success(t('toasts.patientDocument.generated'));
    },
    onError: (error) => {
      logger.error('Error generating patient document:', error);
      toast.error(t('toasts.patientDocument.error'));
    },
  });

  const handleGenerateDocument = useCallback(async (includeTCLE: boolean) => {
    await mutation.mutateAsync({ includeTCLE });
  }, [mutation]);

  const clearDocuments = useCallback(() => {
    setDocuments(null);
  }, []);

  return {
    isGenerating: mutation.isPending,
    documents,
    handleGenerateDocument,
    clearDocuments,
  };
}
```

**Step 2: Add export to `index.ts`**

In `apps/web/src/hooks/domain/evaluation/index.ts`, add:
```typescript
export { usePatientDocument } from './usePatientDocument';
```

**Step 3: Commit**

```bash
git add apps/web/src/hooks/domain/evaluation/usePatientDocument.ts apps/web/src/hooks/domain/evaluation/index.ts
git commit -m "feat: add usePatientDocument hook"
```

---

## Task 7: i18n — Add translation keys

**Files:**
- Modify: `apps/web/src/i18n/locales/pt-BR.json`
- Modify: `apps/web/src/i18n/locales/en-US.json`

**Step 1: Add pt-BR keys**

Add under appropriate sections:
```json
{
  "patientDocument": {
    "title": "Documento do Paciente",
    "generate": "Gerar Documento",
    "generating": "Gerando...",
    "includeTCLE": "Incluir Termo de Consentimento (TCLE)",
    "treatmentExplanation": "Sobre o seu tratamento",
    "postOperative": "Cuidados apos o procedimento",
    "dietaryGuide": "Alimentacao",
    "dietaryAvoid": "Evitar",
    "dietaryPrefer": "Preferir",
    "dietaryDuration": "Nas proximas {{hours}} horas",
    "tcle": "Termo de Consentimento",
    "downloadPDF": "Baixar PDF",
    "sendWhatsApp": "Enviar por WhatsApp",
    "copy": "Copiar texto",
    "copied": "Texto copiado!",
    "orientationsTitle": "Orientacoes do seu Dentista"
  },
  "toasts": {
    "patientDocument": {
      "generated": "Documento do paciente gerado com sucesso!",
      "error": "Erro ao gerar documento. Tente novamente."
    }
  }
}
```

**Step 2: Add en-US keys (same structure, English text)**

**Step 3: Commit**

```bash
git add apps/web/src/i18n/locales/pt-BR.json apps/web/src/i18n/locales/en-US.json
git commit -m "feat(i18n): add patient document translation keys"
```

---

## Task 8: Patient Document Modal — UI component

**Files:**
- Create: `apps/web/src/components/evaluation/PatientDocumentModal.tsx`

**Step 1: Create the modal component**

This component shows:
- Toggle for TCLE inclusion
- Generate button
- Preview of generated content (explanation, post-op checklist, dietary guide)
- Action buttons (Copy, Download PDF, WhatsApp)

Uses PageShell primitives: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Button`, `Switch`, `Card`, `CardContent`, `CardHeader`, `CardTitle`.

Key behaviors:
- On open: if documents already exist in evaluation data, show them immediately (no re-generation needed)
- "Generate" button triggers `handleGenerateDocument` from `usePatientDocument`
- "Download PDF" triggers patient PDF generation (Task 10)
- "WhatsApp" reuses existing `handleShareWhatsApp` flow (documents will appear on SharedEvaluation)

**Step 2: Commit**

```bash
git add apps/web/src/components/evaluation/PatientDocumentModal.tsx
git commit -m "feat: add PatientDocumentModal component"
```

---

## Task 9: EvaluationDetails Integration — Add button + wire modal

**Files:**
- Modify: `apps/web/src/pages/EvaluationDetails.tsx` — add button in action bar (line ~169-193 area), import modal + hook

**Step 1: Add PatientDocument button**

In the flex action bar (around line 169), add a new button after the WhatsApp button:

```tsx
<Button
  variant="outline"
  size="sm"
  className="min-h-11"
  onClick={() => setShowPatientDoc(true)}
>
  <FileText className="w-4 h-4 mr-1.5" />
  {t('patientDocument.title')}
</Button>
```

Add state: `const [showPatientDoc, setShowPatientDoc] = useState(false);`
Add import: `FileText` from lucide-react, `PatientDocumentModal`, `usePatientDocument`

Wire the modal at the bottom of the JSX:
```tsx
<PatientDocumentModal
  open={showPatientDoc}
  onOpenChange={setShowPatientDoc}
  sessionId={sessionId}
  evaluations={detail.evaluations}
/>
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/EvaluationDetails.tsx
git commit -m "feat: add patient document button to EvaluationDetails"
```

---

## Task 10: Patient PDF Generator

**Files:**
- Create: `apps/web/src/lib/pdf/patientPDF.ts`

**Step 1: Create patient-facing PDF generator**

Uses existing `jspdf` dependency. Layout:
- Clinic logo + name (header)
- Patient name + date
- Section: "Sobre o seu tratamento" (explanation text)
- Section: "Cuidados apos o procedimento" (numbered list)
- Section: "Alimentacao" (avoid/prefer lists with duration)
- Section: "Termo de Consentimento" (TCLE text, if present)
- Signature areas
- Footer

Key differences from clinical PDF:
- Font size 12-14pt (not 8-10pt)
- No technical protocol data
- Warm, accessible section headers
- File name: `orientacoes-{patient}-{date}.pdf`

**Step 2: Commit**

```bash
git add apps/web/src/lib/pdf/patientPDF.ts
git commit -m "feat: add patient-facing PDF generator"
```

---

## Task 11: SharedEvaluation — Display patient document

**Files:**
- Modify: `apps/web/src/pages/SharedEvaluation.tsx` (line ~195 area, after DSD section, before tooth cards)
- Modify: `apps/web/src/hooks/domain/useSharedEvaluation.ts` (expose patient_document data)
- Modify: `apps/web/src/data/evaluations.ts` — update `SharedEvaluationRow` in `get_shared_evaluation` RPC
- Create: `apps/web/src/components/evaluation/PatientDocumentSection.tsx`

**Step 1: Create PatientDocumentSection component**

A read-only display component that renders:
- Treatment explanation (paragraphs)
- Post-operative instructions (checklist with checkboxes the patient can tick)
- Dietary guide (avoid/prefer lists with colored badges)
- TCLE (if present, in a formal card with print-friendly formatting)

Uses PageShell primitives only. No actions (read-only for patient).

**Step 2: Wire into SharedEvaluation**

Between the DSD section and tooth cards (line ~195), add:
```tsx
{patientDocuments.length > 0 && (
  <PatientDocumentSection
    documents={patientDocuments}
    title={t('patientDocument.orientationsTitle')}
  />
)}
```

**Step 3: Update useSharedEvaluation hook**

Expose `patientDocuments` from the shared evaluation data. The `get_shared_evaluation` RPC needs to include `patient_document` in its SELECT.

**Step 4: Update Supabase RPC**

The `get_shared_evaluation` function needs to return `patient_document`. Create a migration to update the RPC:

```sql
CREATE OR REPLACE FUNCTION get_shared_evaluation(p_token text)
-- Add patient_document to the returned columns
```

**Step 5: Commit**

```bash
git add apps/web/src/components/evaluation/PatientDocumentSection.tsx apps/web/src/pages/SharedEvaluation.tsx apps/web/src/hooks/domain/useSharedEvaluation.ts supabase/migrations/20260305000001_shared_eval_patient_doc.sql
git commit -m "feat: display patient document on SharedEvaluation page"
```

---

## Task 12: Deploy + Test

**Files:** No new files.

**Step 1: Deploy edge function**

```bash
open -a Docker && sleep 5
npx supabase functions deploy generate-patient-document --no-verify-jwt --use-docker
```

**Step 2: Run Supabase migrations**

```bash
npx supabase db push
```

**Step 3: Manual E2E test**

1. Open an existing evaluation session
2. Click "Documento do Paciente"
3. Toggle TCLE on/off
4. Click "Gerar"
5. Verify preview shows explanation, post-op, dietary guide
6. Click "Baixar PDF" — verify PDF downloads with correct content
7. Click WhatsApp share — open shared link — verify "Orientacoes" section appears
8. Test with different treatment types: resina, porcelana, gengivoplastia

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: patient document generation — complete feature"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | DB migration | 1 SQL |
| 2 | TCLE template | 1 TS |
| 3 | Prompt definition | 1 TS + 1 modify |
| 4 | Edge function | 1 TS + 1 TOML |
| 5 | Data layer | 1 modify |
| 6 | React hook | 1 TS + 1 modify |
| 7 | i18n keys | 2 JSON modify |
| 8 | Modal component | 1 TSX |
| 9 | EvaluationDetails wire | 1 modify |
| 10 | Patient PDF | 1 TS |
| 11 | SharedEvaluation | 2 TSX + 1 hook + 1 SQL |
| 12 | Deploy + test | 0 |

**Total: ~12 new files, ~6 modified files, 12 tasks**
