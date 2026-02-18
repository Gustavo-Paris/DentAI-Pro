# Clinical Feedback Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 11 clinical accuracy issues identified in dentist feedback — misdiagnosis, over-treatment, DSD viability, and stratification protocol errors.

**Architecture:** 3 targeted fixes: (1) prompt additions to `analyze-dental-photo.ts` for better diagnosis, (2) clinical viability rule in `dsd-analysis.ts`, (3) shade-validation enforcement in `shade-validation.ts`. All changes are additive — no existing logic removed.

**Tech Stack:** TypeScript (Deno edge functions), prompt engineering, Supabase Edge Functions

---

### Task 1: Add differential diagnosis and conservatism rules to analyze-dental-photo prompt

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts:139-196`

**Context:** The photo analysis prompt currently has restoration detection rules (lines 139-158) but lacks differential diagnosis between restorations vs fluorosis/MIH. It also has no rules about canine color being naturally more saturated, no confidence threshold for diastema detection, and no explicit whitening-first rule for color-only issues. These gaps cause the AI to: (a) misdiagnose restorations as fluorosis, escalating to porcelain treatment; (b) detect false diastemas; (c) over-treat canines; (d) skip whitening as first-line for color differences.

**Step 1: Add 4 new sections to the system prompt**

Insert after the "INCISIVOS LATERAIS (12/22)" section (after line 165), before "MAPEAMENTO DIAGNOSTICO -> TRATAMENTO" (line 167). The insertion point is between the `NUNCA diagnostique "micro-dente"...` line and the `## MAPEAMENTO DIAGNOSTICO` header.

Add this text block to the prompt string:

```typescript
## DIFERENCIACAO: RESTAURACAO INSATISFATORIA vs FLUOROSE/MIH

RESTAURACAO INSATISFATORIA (diagnóstico MAIS PROVAVEL em dentes anteriores):
- Interface dente/material visível (linha de transição entre esmalte natural e material restaurador)
- Diferença de textura/brilho LOCALIZADA (área restaurada vs dente natural adjacente)
- Manchamento MARGINAL (escurecimento/amarelamento ao redor das margens)
- Opacidade/cor diferente em AREA DEFINIDA (não difusa no esmalte todo)
- Contorno anatômico alterado em região específica

FLUOROSE (manchas DIFUSAS, BILATERAIS, SIMETRICAS):
- Manchas brancas/opacas DIFUSAS no esmalte (sem interface definida com material)
- Padrão BILATERAL e SIMÉTRICO (ambos homólogos afetados de forma similar)
- Sem linha de transição dente/material restaurador
- Textura do esmalte uniformemente alterada em toda a superfície
- Quando severa: linhas horizontais (Linhas de Retzius), porosidade

MIH — Hipomineralização Molar-Incisivo:
- Opacidades DEMARCADAS (brancas, amarelas ou marrons) com BORDAS BEM DEFINIDAS contra esmalte normal
- Pode ser ASSIMETRICA (afetar apenas um dente ou um lado)
- Esmalte poroso/friável dentro da opacidade
- Tipicamente afeta primeiros molares + incisivos permanentes

REGRA DE DECISAO:
1. Se há QUALQUER indício de interface dente/material → "Restauração insatisfatória", NUNCA fluorose/MIH
2. Fluorose exige padrão BILATERAL e SIMÉTRICO — mancha UNILATERAL ou ASSIMETRICA → provável restauração
3. MIH tem bordas DEMARCADAS contra esmalte normal — manchas DIFUSAS sem borda → provável fluorose
4. Na DUVIDA entre restauração e fluorose → "Restauração insatisfatória" (conservadorismo — restauração é MAIS COMUM)
TRATAMENTO: Restauração insatisfatória → resina (substituição). NUNCA porcelana para substituir restauração isolada em 1-2 dentes.

## CANINOS (13/23) — COR NATURALMENTE MAIS SATURADA
Caninos são fisiologicamente 1-2 tons mais ESCUROS/SATURADOS que incisivos — isso e NORMAL e nao e patologia.
- NAO sugerir tratamento estético para caninos APENAS por cor mais saturada que incisivos
- NAO incluir caninos hígidos no plano restaurador por "desarmonia cromática" com incisivos
- Caninos SO precisam tratamento se: restauração defeituosa, fratura, cárie, desgaste excessivo, ou problema estrutural
- Cor dos caninos que incomoda esteticamente → sugerir CLAREAMENTO (nível 1 da hierarquia terapêutica), NAO faceta/resina
- Cor levemente mais amarelada nos caninos em relação aos incisivos = VARIACAO ANATOMICA NORMAL

## DIASTEMA — ALTA CONFIANCA REQUERIDA
Diagnosticar diastema SOMENTE com EVIDENCIA INEQUIVOCA:
- Gap REAL e MENSURAVEL entre superfícies de esmalte NATURAL (sem material restaurador nas faces adjacentes)
- Espaço CLARAMENTE visível na foto (não sombra, não artefato de iluminação, não interface de restauração)
- Ambas as faces proximais do gap devem ser de esmalte natural (sem restauração)

FALSOS POSITIVOS COMUNS (NAO diagnosticar como diastema):
- Sombra interproximal entre dentes com contato proximal intacto
- Reflexo de luz na embrasura incisal criando aparência de espaço
- Interface de restauração proximal com gap marginal → é "Restauração insatisfatória com falha marginal", NAO diastema
- Triângulo negro (black triangle) por papila retraída → é deficiência papilar, NAO diastema

REGRAS:
- Na DUVIDA entre diastema real e artefato visual → NAO diagnosticar diastema (conservadorismo)
- Diastema <0.5mm com contato proximal aparentemente intacto → NAO reportar como diastema
- Antes de diagnosticar diastema, VERIFICAR: as faces proximais dos dentes adjacentes são de esmalte natural?

## CLAREAMENTO ANTES DE RESTAURACAO POR COR
Se a UNICA indicação para tratamento é diferença de cor entre dentes (sem patologia estrutural):
- Sugerir CLAREAMENTO como tratamento de PRIMEIRA LINHA (nível 1 da hierarquia terapêutica)
- NAO sugerir resina/faceta/porcelana apenas para uniformizar cor entre dentes
- Clareamento resolve a maioria das desarmonias cromáticas leves a moderadas
- Incluir como observação: "Considerar clareamento prévio para uniformização cromática antes de qualquer procedimento restaurador estético"
- Somente APOS clareamento (ou quando paciente recusa clareamento) considerar restauração estética por cor
```

**Step 2: Verify the edit**

Read back `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts` and confirm:
- 4 new sections are present between "INCISIVOS LATERAIS" and "MAPEAMENTO DIAGNOSTICO"
- No existing content was removed or altered
- Template literal backticks are properly balanced

**Step 3: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts
git commit -m "fix: add differential diagnosis, canine color, diastema conservatism, and whitening-first rules to photo analysis prompt

Addresses clinical feedback:
- Distinguish restorations from fluorosis/MIH (was misdiagnosing)
- Canines naturally 1-2 shades more saturated (stop over-treating)
- Require high confidence for diastema detection (reduce false positives)
- Suggest whitening first for color-only issues"
```

---

### Task 2: Add clinical viability rule to DSD analysis prompt

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:252-258`

**Context:** The DSD analysis prompt has an autovalidation section (lines 252-258) but lacks a rule prohibiting tooth width reduction. The DSD simulation prompt already has `NEVER make teeth appear thinner or narrower than original` (in `PROPORTION_RULES` at `dsd-simulation.ts:197`), but the analysis prompt can still recommend narrower proportions which the simulation then follows. The fix adds a viability constraint at the analysis level.

**Step 1: Add viability rule to DSD analysis prompt**

Insert after the autovalidation section (after line 258, which ends with `5. RAIZ EXPOSTA + cobrir -> "recobrimento_radicular"`), before `=== SUGESTOES DE ORTODONTIA ===` (line 260).

Add this text block:

```typescript
=== VIABILIDADE CLINICA — REGRA DE LARGURA DENTARIA ===
O DSD serve para planejar tratamentos CONSERVADORES (adicionar material). NAO para planejar remoção de estrutura dental sadia.

PROIBIDO na análise DSD:
- Sugerir REDUZIR largura de dentes (requer desgaste de esmalte sadio = invasivo e irreversível)
- Sugerir dentes mais ESTREITOS que a dimensão atual (mesmo que proporção ideal indique)
- Qualquer alteração que exija remoção de estrutura dental sadia para diminuir volume

SE proporção ideal (áurea ou estética) requer dente MAIS ESTREITO que o atual:
1. NAO incluir a redução de largura como sugestão de tratamento
2. Manter a largura ATUAL do dente como referência para a simulação
3. Adicionar observação: "Proporção L/A do dente [X] acima do ideal. Redução de largura requer preparo invasivo — manter dimensão atual e focar em harmonização pelo COMPRIMENTO (acréscimo incisal) ou tratamento dos dentes ADJACENTES."
4. PRIORIZAR alternativas conservadoras: aumento de comprimento para melhorar proporção, harmonização de adjacentes, fechamento de espaços laterais

PRINCIPIO: DSD conservador = SOMENTE adicionar. Se a mudança requer subtrair esmalte → sinalizar como "requer preparo invasivo" nas observações e oferecer alternativa conservadora.

VALIDACAO: Para CADA sugestão de mudança de proporção → verificar: "Esta mudança pode ser feita APENAS adicionando material?" Se NAO → reformular ou sinalizar.
```

**Step 2: Verify the edit**

Read back `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts` and confirm:
- New section is present between autovalidation and ortodontia sections
- No existing content was removed or altered

**Step 3: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
git commit -m "fix: add tooth width reduction prohibition to DSD analysis prompt

DSD should never recommend reducing tooth width (requires invasive
enamel removal). When ideal proportions require narrower teeth,
suggest conservative alternatives (length increase, adjacent
harmonization) instead."
```

---

### Task 3: Add Aumento Incisal validation and Esmalte Final preference to shade-validation

**Files:**
- Modify: `supabase/functions/recommend-resin/shade-validation.ts:75-278`

**Context:** The shade-validation currently validates: Cristas Proximais (must be Harmonize XLE / Empress BL-L / Z350 WE), Dentina/Corpo (no enamel shades), Z350 BL shades (don't exist), and Esmalte Final (no translucent shades). But it does NOT validate Aumento Incisal (must be Trans/CT) and does NOT enforce Estelite/Palfique preference over Z350 for Esmalte Final. This causes wrong shades to pass through to the final protocol.

**Step 1: Add Aumento Incisal validation**

Insert after the Cristas validation block (after line 121, which closes the `if (isCristasLayer ...)` block), before the Dentina/Corpo validation (line 123).

Add this code:

```typescript
      // Enforce: aumento incisal MUST use translucent shades (Trans/CT family)
      const isAumentoIncisal = (layerType.includes('aumento') && layerType.includes('incisal')) ||
                               layerType.includes('incisal build');
      if (isAumentoIncisal && !layerType.includes('efeito') && layer.shade) {
        const translucentShades = ['CT', 'GT', 'Trans', 'Trans20', 'Trans30'];
        const isTranslucent = translucentShades.some(ts =>
          layer.shade.toUpperCase().includes(ts.toUpperCase())
        );
        if (!isTranslucent) {
          const originalShade = layer.shade;
          const originalBrand = layer.resin_brand;
          // Prefer CT from Z350 or Trans from FORMA in catalog
          const z350CT = catalogRows.find(r => r.shade === 'CT' && matchesLine(r.product_line, 'Z350'));
          const formaTrans = catalogRows.find(r => /^Trans$/i.test(r.shade) && matchesLine(r.product_line, 'FORMA'));
          const empressTrans = catalogRows.find(r => /Trans20/i.test(r.shade) && matchesLine(r.product_line, 'Empress'));
          const vittraTrans = catalogRows.find(r => /^Trans$/i.test(r.shade) && matchesLine(r.product_line, 'Vittra'));
          const replacement = z350CT || formaTrans || empressTrans || vittraTrans;
          if (replacement) {
            layer.shade = replacement.shade;
            if (z350CT && !/z350/i.test(originalBrand || '')) {
              layer.resin_brand = '3M ESPE - Filtek Z350 XT';
            } else if (formaTrans && !/forma/i.test(originalBrand || '')) {
              layer.resin_brand = 'Ultradent - FORMA';
            }
            shadeReplacements[originalShade] = replacement.shade;
          } else {
            // Fallback: force CT if no catalog match
            layer.shade = 'CT';
            shadeReplacements[originalShade] = 'CT';
          }
          validationAlerts.push(
            `Aumento Incisal: shade ${originalShade} inválido — requer resina translúcida (Trans/CT). Substituído por ${layer.shade}.`
          );
          logger.warn(`Aumento incisal enforcement: ${originalBrand} ${originalShade} → ${layer.resin_brand} ${layer.shade}`);
        }
      }
```

**Step 2: Add Esmalte Final Estelite/Palfique preference**

Insert after the translucent shade enforcement block for esmalte vestibular final (after line 233, which closes the `if (isTranslucent && isVestibularFinal)` block), still within the `if (isEnamelLayer && layer.shade)` block.

Add this code:

```typescript
        // Prefer Estelite Omega or Palfique LX5 over Z350 for esmalte vestibular final
        if (isVestibularFinal && productLine && /z350/i.test(productLine)) {
          const palfiqueWE = catalogRows.find(r =>
            matchesLine(r.product_line, 'Palfique') && r.shade === 'WE'
          );
          const esteliteWE = catalogRows.find(r =>
            matchesLine(r.product_line, 'Estelite Omega') && (r.shade === 'WE' || r.shade === 'MW')
          );
          const preferred = palfiqueWE || esteliteWE;
          if (preferred) {
            const originalBrand = layer.resin_brand;
            const originalShade = layer.shade;
            layer.resin_brand = palfiqueWE
              ? 'Tokuyama - Palfique LX5'
              : 'Tokuyama - Estelite Omega';
            layer.shade = preferred.shade;
            shadeReplacements[originalShade] = preferred.shade;
            validationAlerts.push(
              `Esmalte Vestibular Final: ${originalBrand} (${originalShade}) → ${layer.resin_brand} (${preferred.shade}) — polimento superior para camada de esmalte anterior.`
            );
            logger.warn(`Enamel final preference: ${originalBrand} ${originalShade} → ${layer.resin_brand} ${preferred.shade}`);
          }
        }
```

**Step 3: Verify the edit**

Read back `supabase/functions/recommend-resin/shade-validation.ts` and confirm:
- Aumento Incisal validation is present after Cristas block
- Esmalte Final preference is present after translucent enforcement
- No existing validations were removed or altered
- Code compiles (TypeScript syntax correct)

**Step 4: Commit**

```bash
git add supabase/functions/recommend-resin/shade-validation.ts
git commit -m "fix: add Aumento Incisal shade validation and Esmalte Final preference enforcement

- Aumento Incisal now auto-corrected to Trans/CT if non-translucent shade
- Esmalte Vestibular Final now prefers Estelite Omega/Palfique LX5 over Z350
  when available in catalog (superior polishing for anterior enamel layer)"
```

---

### Task 4: Deploy all 3 affected edge functions

**Files:**
- Config: `supabase/config.toml` (verify `verify_jwt = false` for all 3 functions)

**Context:** Per project conventions, edge functions must be deployed sequentially (parallel deploys cause ENOTEMPTY cache races). Docker Desktop must be running. All functions deploy with `--no-verify-jwt`.

**Step 1: Verify Docker is running**

```bash
open -a Docker
# Wait ~10s for Docker to be ready
docker info > /dev/null 2>&1 && echo "Docker ready" || echo "Docker not ready"
```

**Step 2: Deploy analyze-dental-photo**

```bash
npx supabase functions deploy analyze-dental-photo --no-verify-jwt --use-docker
```

Expected: "Deployed successfully" message.

**Step 3: Deploy generate-dsd**

```bash
npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker
```

Expected: "Deployed successfully" message.

**Step 4: Deploy recommend-resin**

```bash
npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker
```

Expected: "Deployed successfully" message.

**Step 5: Commit deployment confirmation**

No code change — deployment is runtime. Optionally update design doc status to `published`.
