---
title: Specialist Feedback Corrections — Implementation Plan
created: 2026-02-16
updated: 2026-02-16
status: draft
tags:
  - type/plan
  - status/draft
---

# Specialist Feedback Corrections — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 15 issues identified by a dental specialist reviewing AI outputs — incorrect resin shades, missed restorations, missing consent, and UX gaps.

**Architecture:** Prompt text changes in edge function definitions (recommend-resin, dsd-analysis, dsd-simulation), programmatic shade validation hardening, and 3 frontend additions (consent modal, recalculate button, gengivoplasty UI check).

**Tech Stack:** TypeScript (Deno edge functions), React 18, Supabase, Tailwind CSS, shadcn/ui, i18n (react-i18next)

**Design doc:** `docs/plans/2026-02-16-specialist-feedback-corrections-design.md`

---

## Task 1: Resin Prompt — Shade Corrections & Glossary (A1, A2)

> Fixes: Z350 BL1 doesn't exist + WB = White Body not Warm Bleach

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:124-161` (buildAdvancedStratificationSection)
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:377-387` (shade table + alternativa simplificada)

**Step 1: Add shade glossary and Z350 BL prohibition after the RESINAS RECOMENDADAS table**

In `buildAdvancedStratificationSection()`, after line 134 (`| Dentes Clareados |...`), add:

```
GLOSSARIO DE SIGLAS — USAR EXATAMENTE (OBRIGATORIO na descricao de cada camada):
- WB = White Body (corpo branco/neutro) — NUNCA "Warm Bleach"
- CT = Clear Translucent — NUNCA "Cool Tone"
- WE = White Enamel
- MW = Milky White (esmalte natural sem clareamento)
- JE = Jewel Enamel (SOMENTE Estelite Omega)
- BL-L = Bleach Light (SOMENTE Empress Direct)
- XLE = Extra Light Enamel (SOMENTE Harmonize)
- DA1/DA2 = Dentin A1/A2 (SOMENTE Vittra APS)

⚠️ SHADES QUE NAO EXISTEM POR LINHA (PROIBIDO USAR):
- Filtek Z350 XT: NAO possui BL1, BL2, BL3, WB (usar WB somente de FORMA ou outra linha)
- Estelite Omega: NAO possui BL shades (para clareados usar Estelite Bianco W3/W4)
- Harmonize: NAO possui WE, BL (para clareados usar outra linha)
```

**Step 2: Update shade table to add explicit Z350 prohibition note**

At line 382, update the Z350 row to:
```
| Filtek Z350 XT      | CT, GT, BT, YT, A1E, A2E, A3E, B1E (⚠️ NÃO possui BL1/BL2/BL3!) |
```

**Step 3: Verify DB — check resin_catalog table**

Run SQL to verify Z350 doesn't have BL shades:
```bash
npx supabase db execute "SELECT shade, type, product_line FROM resin_catalog WHERE product_line ILIKE '%Z350%' AND shade ILIKE '%BL%';"
```
Expected: 0 rows. If rows exist, delete them.

**Step 4: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "fix(prompts): add shade glossary + Z350 BL1 prohibition

Specialist feedback: Z350 doesn't have BL shades, WB means White Body not Warm Bleach.
Adds explicit glossary and per-line shade prohibitions."
```

---

## Task 2: Resin Prompt — Layer Enforcement (A3, A4, A5, A6)

> Fixes: Cristas must use XLE/BL-L, Esmalte Final must prefer WE/MW, Alternativa Simplificada corrections

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:126-134` (RESINAS RECOMENDADAS table)
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:354-375` (layer 2 and 5 details)
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:387` (ALTERNATIVA SIMPLIFICADA)

**Step 1: Strengthen Cristas Proximais rule with explicit prohibition**

At line 130, replace:
```
| Cristas Proximais  | SOMENTE XLE(Harmonize) ou BL-L/BL-XL(Empress) — esmalte 1 tom > claro que corpo |
```
With:
```
| Cristas Proximais  | SOMENTE XLE(Harmonize) ou BL-L/BL-XL(Empress) ou WE(Z350) — PROIBIDO: Z350 BL1, JE, CT, FORMA, Vittra, Palfique para cristas! |
```

**Step 2: Strengthen Esmalte Final rule with explicit Z350 demotion**

At line 133, replace:
```
| Esmalte Final      | WE(Palfique LX5), Empress esmalte cores claras, W3(Estelite Bianco) p/ clareados — PROIBIDO translúcidas (CT/GT/Trans)! |
```
With:
```
| Esmalte Final      | WE(Palfique LX5) ou WE/MW(Estelite Omega) OBRIGATORIO — Z350 SOMENTE se Palfique/Estelite indisponíveis! Dentes clareados: W3/W4(Estelite Bianco). PROIBIDO: CT/GT/Trans/BL1! |
```

**Step 3: Update layer 2 (Cristas) detail section**

At line 354, after "INCLUIR SEMPRE que houver:", add:
```
   - ⚠️ PROIBIDO para Cristas: Z350 (qualquer shade), FORMA, Vittra, Palfique. SOMENTE Harmonize XLE ou Empress BL-L/BL-XL ou Z350 WE.
```

**Step 4: Update layer 5 (Esmalte Final) detail section**

At line 372, replace P1 line with:
```
   - P1 (OBRIGATORIO quando disponível): Palfique LX5 (WE), Estelite Omega (WE/MW). MW para resultado natural. Para dentes clareados: W3/W4(Estelite Bianco)
   - ⚠️ Z350 para Esmalte Final SOMENTE se P1 indisponível no inventário. Shade: A1E/A2E (NUNCA BL1 — NÃO EXISTE em Z350!)
```

**Step 5: Expand ALTERNATIVA SIMPLIFICADA section**

At line 387, replace the single line with:
```
ALTERNATIVA SIMPLIFICADA (2 camadas):
- Corpo: WB(FORMA), WB(Z350), DA1(Empress) ou DA1(Vittra) — cor SATURADA de dentina. PROIBIDO para corpo: WE, MW, CE, TN, Incisal, Trans, CT — são cores de ESMALTE!
- Esmalte: WE(Palfique LX5) — preferencial. MW(Estelite Omega) para natural.
- Dentes clareados: W3/W4(Estelite Bianco) ou BL(Forma)/BL-L(Empress)
- Cristas (se 3+ camadas): XLE(Harmonize) ou BL-L(Empress). PROIBIDO JE para cristas.
- TN = Translucent Natural = cor de ESMALTE, NUNCA corpo.
```

**Step 6: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "fix(prompts): enforce cristas XLE/BL-L + esmalte final WE/MW + fix alternativa

Specialist feedback: cristas must use Harmonize XLE or Empress BL-L,
esmalte final must prefer Palfique/Estelite WE/MW over Z350,
alternativa simplificada must suggest correct materials."
```

---

## Task 3: Shade Validation — Programmatic Layer Enforcement (A1, A3, A4)

> Adds post-AI validation: catch Z350 BL shades, wrong resins for cristas/esmalte

**Files:**
- Modify: `supabase/functions/recommend-resin/shade-validation.ts:75-165` (main validation loop)

**Step 1: Add layer-specific validation rules after line 87 (isEnamelLayer check)**

After the existing `isEnamelLayer` detection, add detection for cristas proximais layer and enforce rules:

```typescript
const isCristasLayer = layerType.includes('crista') || layerType.includes('proxima');

// Enforce: cristas must use Harmonize XLE or Empress BL-L — not Z350/FORMA/Vittra
if (isCristasLayer && productLine) {
  const plLower = productLine.toLowerCase();
  const isAllowedForCristas = plLower.includes('harmonize') || plLower.includes('empress');
  if (!isAllowedForCristas) {
    validationAlerts.push(
      `Cristas Proximais: ${productLine} substituída. Especialista recomenda XLE(Harmonize) ou BL-L(Empress) para cristas.`
    );
    logger.warn(`Cristas enforcement: ${productLine} not allowed, flagged for review`);
  }
}

// Enforce: Z350 cannot have BL1/BL2/BL3 shades (they don't exist)
if (productLine && /z350/i.test(productLine) && layer.shade && /^BL\d?$/i.test(layer.shade)) {
  const originalShade = layer.shade;
  // Find best Z350 alternative based on layer type
  const z350Alternatives = lineRows.filter(r => !(/^BL/i.test(r.shade)));
  if (isEnamelLayer) {
    const enamelAlt = z350Alternatives.find(r => r.shade === 'A1E') || z350Alternatives.find(r => r.type?.toLowerCase().includes('esmalte'));
    if (enamelAlt) {
      layer.shade = enamelAlt.shade;
      shadeReplacements[originalShade] = enamelAlt.shade;
    }
  } else {
    const bodyAlt = z350Alternatives.find(r => r.shade === 'A1') || z350Alternatives[0];
    if (bodyAlt) {
      layer.shade = bodyAlt.shade;
      shadeReplacements[originalShade] = bodyAlt.shade;
    }
  }
  validationAlerts.push(
    `Cor ${originalShade} NÃO EXISTE na linha Z350 XT. Substituída por ${layer.shade}.`
  );
  logger.warn(`Z350 BL enforcement: ${originalShade} → ${layer.shade}`);
}
```

**Step 2: Commit**

```bash
git add supabase/functions/recommend-resin/shade-validation.ts
git commit -m "fix(validation): enforce Z350 BL prohibition + cristas layer rules

Post-AI validation: Z350 BL1/BL2/BL3 auto-replaced (don't exist),
cristas layer flagged if not using Harmonize/Empress."
```

---

## Task 4: DSD Analysis — Restoration Detection (B7, B8)

> Fixes: Diastema vs unsatisfactory restorations + Classe III detection

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:92-101` (DETECCAO ULTRA-CONSERVADORA section)

**Step 1: Add diastema vs restoration differentiation after line 101**

After "RESPEITE A ANALISE CLINICA..." line, add:

```
=== DIFERENCIACAO CRITICA: DIASTEMA vs. RESTAURACAO INSATISFATORIA ===
ANTES de diagnosticar "diastema", verificar:
- DIASTEMA VERDADEIRO: Espaço entre dentes NATURAIS sem evidência de material restaurador nas faces proximais. Superfícies proximais com esmalte íntegro e brilho natural.
- RESTAURACAO INSATISFATORIA COM GAP: Espaço entre dentes COM evidência de:
  * Diferença de cor/textura nas faces proximais (material opaco, manchado, amarelado)
  * Interface restauração/dente visível (linha de transição)
  * Contorno anatômico alterado (perda de convexidade proximal)
  * Material degradado/com infiltração na região do espaço
- REGRA: Se há QUALQUER indício de restauração prévia na região do gap → classificar como "Restauração insatisfatória", NÃO como "diastema"
- Tratamento correto para restauração insatisfatória: "Substituição de restauração Classe III/IV" (NÃO "fechamento de diastema")
- Fechamento de diastema = acréscimo em dentes NATURAIS. Substituição = remoção de restauração antiga + nova.

=== DETECCAO ATIVA DE RESTAURACOES CLASSE III (PROXIMAIS) ===
Restaurações Classe III (proximais) são FREQUENTEMENTE SUTIS na vista frontal.
BUSCAR ATIVAMENTE em TODOS os dentes anteriores (13-23):
- Sombra escura/cinza/amarelada na região interproximal
- Diferença de translucidez entre face vestibular e proximal do MESMO dente
- Linha de interface na transição dente/restauração (mesmo que sutil)
- Mudança abrupta de textura ou brilho na superfície proximal
- Descoloração ou escurecimento visível ENTRE dentes adjacentes (na embrasura)
- Contorno proximal irregular ou "degrau" na transição

Se detectadas: classificar como "Restauração Classe III insatisfatória" com:
- treatment_indication: "resina"
- procedure_type: "restauração"
- priority: "alta"
- description: incluir faces afetadas (mesial/distal) e achados visuais
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
git commit -m "fix(prompts): add diastema vs restoration differentiation + Classe III detection

Specialist feedback: AI confused unsatisfactory restorations with diastema,
and missed Class III restorations on teeth 12/21."
```

---

## Task 5: DSD Analysis — Homolog Comparison & Recontour (B9, B10)

> Fixes: Missed vestibular inclination + missing recontour suggestion

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:192-198` (RECONTORNO INCISAL section)

**Step 1: Expand the RECONTORNO INCISAL section at line 192**

Replace lines 192-198 with:

```
=== COMPARACAO OBRIGATORIA DE HOMOLOGOS (11/21, 12/22, 13/23) ===
Para CADA par de homólogos visíveis, comparar OBRIGATORIAMENTE:
1. INCLINACAO: vestibular/lingual/vertical — se um dente tem inclinação vestibular diferente do contralateral → desarmonia
2. FORMATO: se formato (contorno) difere do contralateral (um mais quadrado, outro mais oval) → desarmonia
3. TAMANHO: largura e comprimento comparados — diferença >0.5mm = sugestão
4. POSICAO: rotação, extrusão, intrusão em relação ao contralateral

Se QUALQUER desarmonia entre homólogos detectada:
- Sugerir "Reanatomização em Resina Composta" ou "Faceta" para harmonizar com contralateral
- Especificar QUAL dente precisa de ajuste e POR QUE (ex: "Dente 12 com inclinação vestibular em desarmonia com 22")
- Incluir medida em mm quando possível

=== RECONTORNO INCISAL ENTRE HOMOLOGOS ===
Desnível >0.5mm entre homólogos (11/21, 12/22, 13/23) -> "Recontorno Incisal em Resina Composta" OBRIGATÓRIO.

=== RECONTORNO PARA HARMONIA DO SORRISO ===
Além de desnível entre homólogos, avaliar SEMPRE:
- Centrais (11/21) com formato ou proporção diferentes entre si → recontorno
- Centrais com proporção L/A inadequada para harmonia com arco do sorriso → recontorno
- Centrais que beneficiariam de recontorno para melhorar simetria → sugerir MESMO que dentes estejam íntegros
- Laterais com formato muito diferente dos centrais (desarmonia de série) → reanatomização
REGRA: Se recontorno nos centrais melhora harmonia geral do sorriso, sugerir como prioridade "média" mesmo sem patologia.

=== COMPLETUDE DE SUGESTOES INCISAIS ===
Se 2+ anteriores precisam de ajuste incisal -> AVALIE TODO ARCO 13-23. Liste TODOS os afetados. Cada dente = sugestão separada.
Inferiores: incluir APENAS quando CLARAMENTE VISIVEIS com desgaste EVIDENTE.
MEDIDAS em mm no proposed_change (OBRIGATORIO): "Aumentar ~1.5mm", "Gengivoplastia ~2mm", "Recontorno ~0.5mm".
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
git commit -m "fix(prompts): add homolog comparison + recontour for smile harmony

Specialist feedback: AI missed vestibular inclination of tooth 12 vs 22,
and didn't suggest recontour on centrals for smile harmony."
```

---

## Task 6: DSD Simulation — Premolars + Full Face Output (C11, C12)

> Fixes: DSD should include premolars + show full face when face photo uploaded

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts:157-171` (buildBaseCorrections function)
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts:47-108` (buildAbsolutePreservation function)

**Step 1: Add premolar inclusion rule in buildBaseCorrections()**

After line 171 (end of SHAPE CORRECTIONS), add:

```
=== EXTENSAO ATE PRE-MOLARES ===
Se pré-molares (14/15/24/25) são VISIVEIS na foto:
- INCLUIR na simulação: aplicar whitening, harmonização de cor, correção de restaurações
- Manter proporções naturais: pré-molares são naturalmente menores que caninos
- Se pré-molares têm restaurações antigas, escurecimento ou desarmonia visível → corrigir na simulação
- ZONA DE SIMULACAO: Toda a arcada visível no sorriso (NÃO limitar a canino-a-canino)
- Pré-molares devem receber o MESMO nível de whitening aplicado aos anteriores
```

**Step 2: Add full-face output rule in buildAbsolutePreservation()**

After line 87 ("Dimensões de saída DEVEM ser iguais..."), add:

```
=== OUTPUT DE ROSTO COMPLETO ===
Se a imagem de entrada mostra o ROSTO COMPLETO do paciente (olhos, testa, queixo):
- O output DEVE mostrar o rosto completo com a simulação aplicada no sorriso
- NÃO cropar a imagem para mostrar apenas a boca
- Manter TODAS as características faciais idênticas (olhos, nariz, cabelo, pele)
- A simulação se limita APENAS à área dos dentes — todo o resto do rosto é cópia exata
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-simulation.ts
git commit -m "fix(prompts): extend DSD to premolars + preserve full face in output

Specialist feedback: DSD should include premolars when visible,
and show full face when face photo is uploaded."
```

---

## Task 7: Frontend — Consent Modal (D13)

> New consent modal on first access before creating a case

**Files:**
- Create: `apps/web/src/components/AiDisclaimerModal.tsx`
- Modify: `apps/web/src/pages/NewCase.tsx:48-56` (guard wizard)
- Modify: `apps/web/src/locales/pt-BR.json` (add i18n keys)
- Modify: `apps/web/src/data/profiles.ts` (add consent field)

**Step 1: Add i18n keys to pt-BR.json**

Add under a new `"consent"` section:
```json
"consent": {
  "title": "Termos de Uso — Inteligência Artificial",
  "intro": "Antes de iniciar, leia e aceite os termos abaixo:",
  "bullet1": "Este sistema utiliza Inteligência Artificial para gerar sugestões de tratamento odontológico.",
  "bullet2": "As sugestões são ferramentas de apoio ao diagnóstico e NÃO substituem a avaliação clínica do cirurgião-dentista.",
  "bullet3": "A decisão final de tratamento é sempre do profissional responsável.",
  "bullet4": "As imagens e dados dos pacientes são protegidos conforme a LGPD (Lei Geral de Proteção de Dados).",
  "bullet5": "Os resultados dependem de múltiplos fatores clínicos e podem variar.",
  "checkbox": "Li e aceito os termos acima",
  "accept": "Continuar",
  "footer": "Ao aceitar, você concorda com nossa"
}
```

**Step 2: Create AiDisclaimerModal component**

Create `apps/web/src/components/AiDisclaimerModal.tsx`:
- Modal using shadcn Dialog
- 5 bullet points from i18n
- Checkbox "Li e aceito os termos"
- Button "Continuar" disabled until checkbox is checked
- On accept: save `ai_disclaimer_accepted_at` to localStorage (immediate) + optionally to Supabase profile
- Pattern: follow `CookieConsent.tsx` localStorage approach for simplicity (no DB migration needed)

```tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield } from 'lucide-react';

const STORAGE_KEY = 'ai-disclaimer-accepted';

export function useAiDisclaimer() {
  const [accepted, setAccepted] = useState(() =>
    localStorage.getItem(STORAGE_KEY) === 'true'
  );
  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setAccepted(true);
  };
  return { accepted, accept };
}

export function AiDisclaimerModal({ open, onAccept }: { open: boolean; onAccept: () => void }) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t('consent.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <p className="text-sm text-muted-foreground">{t('consent.intro')}</p>
          <ul className="text-sm space-y-2 list-disc pl-5 text-muted-foreground">
            <li>{t('consent.bullet1')}</li>
            <li>{t('consent.bullet2')}</li>
            <li>{t('consent.bullet3')}</li>
            <li>{t('consent.bullet4')}</li>
            <li>{t('consent.bullet5')}</li>
          </ul>
        </div>
        <div className="flex items-center gap-2 py-2">
          <Checkbox
            id="consent-check"
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
          />
          <label htmlFor="consent-check" className="text-sm font-medium cursor-pointer">
            {t('consent.checkbox')}
          </label>
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground mr-auto">
            {t('consent.footer')}{' '}
            <a href="/privacy" className="underline text-primary">{t('footer.privacy')}</a>.
          </p>
          <Button onClick={onAccept} disabled={!checked}>
            {t('consent.accept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Integrate into NewCase.tsx**

In `NewCase.tsx`, after line 50 (`const wizard = useWizardFlow()`), add:

```tsx
import { useAiDisclaimer, AiDisclaimerModal } from '@/components/AiDisclaimerModal';
// ...
const disclaimer = useAiDisclaimer();
```

Then wrap the return JSX to show modal when not accepted:

```tsx
return (
  <>
    <AiDisclaimerModal
      open={!disclaimer.accepted}
      onAccept={disclaimer.accept}
    />
    {/* existing wizard JSX */}
  </>
);
```

**Step 4: Commit**

```bash
git add apps/web/src/components/AiDisclaimerModal.tsx apps/web/src/pages/NewCase.tsx apps/web/src/locales/pt-BR.json
git commit -m "feat(ux): add AI disclaimer modal before starting case

Specialist feedback: require consent about AI nature, LGPD, and
dentist responsibility before using the system."
```

---

## Task 8: Frontend — Recalculate Button (D14)

> Add button on Result page to go back to Review and change budget

**Files:**
- Modify: `apps/web/src/pages/Result.tsx:75-89` (footerActions)
- Modify: `apps/web/src/hooks/domain/wizard/useWizardNavigation.ts:58-69` (goToStep)
- Modify: `apps/web/src/locales/pt-BR.json` (add i18n key)

**Step 1: Add i18n key**

In pt-BR.json under `"result"`:
```json
"recalculate": "Recalcular Caso"
```

**Step 2: Modify goToStep to allow step 6 → step 5**

In `useWizardNavigation.ts`, at line 60, change:
```typescript
if (targetStep >= step || targetStep < 1 || step === 6) return;
```
To:
```typescript
if (targetStep >= step || targetStep < 1) return;
// Allow going back from result (step 6) to review (step 5) only
if (step === 6 && targetStep !== 5) return;
```

**Step 3: Add handleBack case for step 6**

In `handleBack` callback (line 103-128), add before the closing `}`:
```typescript
} else if (step === 6) {
  setStep(5);
}
```

**Step 4: Expose goBackToReview from useWizardFlow**

The Result page is a separate route (`/evaluation/:id`), not part of the wizard. So instead of modifying wizard navigation, we need to add a "Recalculate" link that navigates to `/new-case` with state indicating "go to review".

Actually, looking at the code more carefully: Result.tsx is at route `/evaluation/:sessionId/:tooth` and is NOT inside the wizard flow. The wizard ends at step 6 which renders inline in NewCase.tsx. Let me re-check...

Looking at NewCase.tsx line 35: step 6 IS "result" but renders INSIDE NewCase.tsx. And Result.tsx is a SEPARATE page for viewing past evaluations.

So the recalculate button should go in the step 6 rendering inside NewCase.tsx, NOT in Result.tsx.

**Revised Step 3: Add recalculate button in NewCase.tsx step 6 section**

Find where step 6 content is rendered in NewCase.tsx and add a button that calls `wizard.nav.goToStep(5)` or `wizard.nav.handleBack()`.

In NewCase.tsx, find the Result section rendering (step === 6) and add a footer action button:

```tsx
{nav.step === 6 && (
  <Button
    variant="outline"
    onClick={() => nav.handleBack()}
    className="print:hidden"
  >
    <ArrowLeft className="w-4 h-4 mr-2" />
    {t('result.recalculate')}
  </Button>
)}
```

**Step 4: Commit**

```bash
git add apps/web/src/pages/NewCase.tsx apps/web/src/hooks/domain/wizard/useWizardNavigation.ts apps/web/src/locales/pt-BR.json
git commit -m "feat(ux): add recalculate button to go back from result to review

Specialist feedback: allow changing budget (padrão/premium) after
seeing result by navigating back to review step."
```

---

## Task 9: Frontend — Verify Gengivoplasty in Treatment UI (D15)

> Verify gengivoplasty suggestions appear in treatment options with tooth specificity

**Files:**
- Read: `apps/web/src/components/wizard/TreatmentBanners.tsx`
- Read: `apps/web/src/components/wizard/ReviewAnalysisStep.tsx`
- Read: `apps/web/src/hooks/domain/wizard/useWizardSubmit.ts` (how suggestions map to treatments)

**Step 1: Trace the gengivoplasty data flow**

Read the files above and trace:
1. How DSD analysis suggestions with `treatment_indication: "gengivoplastia"` flow to the UI
2. Whether TreatmentBanners shows gengivoplasty as a banner
3. Whether tooth numbers are displayed
4. Whether gengivoplasty appears in the treatment selection for individual teeth

**Step 2: Fix any gaps found**

If gengivoplasty suggestions are not being rendered:
- Check if the treatment type enum includes "gengivoplastia"
- Check if suggestions are filtered out before reaching the UI
- Ensure tooth-specific gengivoplasty appears as individual treatment option per tooth

If gengivoplasty IS rendering correctly: document as verified and skip fixes.

**Step 3: Commit (if changes needed)**

```bash
git add <changed files>
git commit -m "fix(ux): ensure gengivoplasty appears in treatment options per tooth

Specialist feedback: when DSD suggests gengivoplasty, it must appear
in treatment options with specific teeth listed."
```

---

## Task 10: Deploy Edge Functions

> Deploy all modified edge functions to production

**Step 1: Start Docker Desktop**

```bash
open -a Docker
```

Wait for Docker to start.

**Step 2: Deploy generate-dsd (DSD analysis + simulation changes)**

```bash
npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker
```

**Step 3: Deploy recommend-resin (prompt + validation changes)**

```bash
npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker
```

**Step 4: Verify deployments**

```bash
npx supabase functions list
```

**Step 5: Final commit with all changes**

```bash
git add -A
git commit -m "chore: deploy edge functions with specialist feedback corrections"
```

---

## Summary — Commit Sequence

| # | Commit | Files | Issues |
|---|--------|-------|--------|
| 1 | Shade glossary + Z350 BL prohibition | recommend-resin.ts | A1, A2 |
| 2 | Layer enforcement (cristas, esmalte, alternativa) | recommend-resin.ts | A3, A4, A5, A6 |
| 3 | Shade validation hardening | shade-validation.ts | A1, A3, A4 |
| 4 | Diastema vs restoration + Classe III | dsd-analysis.ts | B7, B8 |
| 5 | Homolog comparison + recontour | dsd-analysis.ts | B9, B10 |
| 6 | Premolars + full face DSD | dsd-simulation.ts | C11, C12 |
| 7 | AI disclaimer modal | AiDisclaimerModal.tsx, NewCase.tsx, pt-BR.json | D13 |
| 8 | Recalculate button | NewCase.tsx, useWizardNavigation.ts, pt-BR.json | D14 |
| 9 | Gengivoplasty UI verification | TreatmentBanners.tsx (if needed) | D15 |
| 10 | Deploy edge functions | — | All backend |
