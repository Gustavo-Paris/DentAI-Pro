---
title: Design Critique — Fluxo DSD Completo
created: 2026-02-23
status: actionable
tags: [type/audit, design-critic]
---

# Design Critique — Fluxo DSD Completo

**Data**: 2026-02-23
**Modo**: Targeted Review (Fluxo DSD completo + Protocolo de Resultado)
**Paginas analisadas**: 8 telas (6 wizard steps + Evaluation Details + Group Protocol)
**Viewports**: Desktop 1440x900 + Mobile 390x844

## Score Geral

| Pilar | Score | Peso | Contribuicao |
|-------|-------|------|--------------|
| Visual Consistency | 7.0/10 | 25% | 1.75 |
| Information Hierarchy | 7.5/10 | 25% | 1.88 |
| Interaction Quality | 6.5/10 | 20% | 1.30 |
| Spatial Design | 7.5/10 | 15% | 1.13 |
| Polish & Craft | 7.0/10 | 15% | 1.05 |
| **TOTAL** | | | **7.10/10** |

## Score por Pagina

| Pagina | VC | IH | IQ | SD | PC | Total |
|--------|----|----|----|----|-----|-------|
| Step 1 — Photo Upload | 7.5 | 8.0 | 7.0 | 8.0 | 7.5 | 7.6 |
| Step 2 — Preferences | 7.5 | 7.5 | 6.5 | 8.0 | 7.5 | 7.4 |
| Step 3 — Analyzing | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 |
| Step 4 — DSD Analysis | 6.5 | 8.0 | 6.5 | 7.5 | 7.0 | 7.1 |
| Step 5 — Review | 7.0 | 7.5 | 6.0 | 7.5 | 7.0 | 7.0 |
| Step 6 — Success | 7.5 | 6.0 | 5.5 | 6.0 | 6.5 | 6.3 |
| Evaluation Details | 7.0 | 6.5 | 6.0 | 6.0 | 6.5 | 6.4 |
| Group Protocol | 7.0 | 8.0 | 6.5 | 7.5 | 7.0 | 7.2 |

---

## Findings

### P0 — Blockers (5 encontrados)

#### [P0-001] Texto nao traduzido "wizard.recalculate" no Protocol Page
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/pages/GroupResult.tsx` (bottom button)
**Problema**: Botao exibe chave i18n crua `wizard.recalculate` em vez do texto traduzido. Visivel no screenshot do protocolo.
**Impacto**: Quebra total de profissionalismo — usuario ve chave tecnica.
**Fix**: Adicionar chave de traducao no arquivo de i18n:
```json
"wizard.recalculate": "Recalcular Protocolo"
```
**Status**: Falso positivo — chave `wizard.recalculate` ja existia (pt-BR: "Recalcular Caso", en-US: "Recalculate Case")

#### [P0-002] Cores hardcoded amber/emerald em alertas do DSD
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx:140-171`
**Problema**: Alertas de gengivoplastia usam `amber-50`, `amber-950/20`, `amber-400`, `emerald-700` hardcoded ao inves de tokens semanticos `warning`/`success`.
**Fix**:
```tsx
// Antes
className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"

// Depois
className="border-l-4 border-warning bg-warning/5 dark:bg-warning/10"
```
**Status**: Corrigido

#### [P0-003] Cores hardcoded em badges do CollapsibleDSD
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/dsd/CollapsibleDSD.tsx:150-161`
**Problema**: Badges de status usam `border-emerald-300 text-emerald-700`, `border-rose-300 text-rose-700`, `border-blue-300 text-blue-700` hardcoded.
**Fix**: Usar variantes semanticas do Badge component ou tokens `text-success`, `text-destructive`, `text-primary`.
**Status**: Corrigido

#### [P0-004] Botao hover hardcoded rose no CollapsibleDSD
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/dsd/CollapsibleDSD.tsx:187`
**Problema**: `hover:bg-rose-100 dark:hover:bg-rose-900` hardcoded.
**Fix**: Usar `hover:bg-destructive/10 dark:hover:bg-destructive/20`.
**Status**: Corrigido

#### [P0-005] Cores hardcoded amber em DSDErrorState
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/wizard/dsd/DSDErrorState.tsx:35-42`
**Problema**: `border-amber-500 bg-amber-50/50 dark:bg-amber-950/20` hardcoded.
**Fix**: `border-warning bg-warning/5 dark:bg-warning/10 rounded-r-lg`
**Status**: Corrigido

---

### P1 — Must-Fix (12 encontrados)

#### [P1-001] Opcoes de preferencia sem hover transition
**Pilar**: Interaction Quality
**Arquivo**: `apps/web/src/components/wizard/PatientPreferencesStep.tsx:92-98`
**Problema**: Cards de opcao nao-selecionada sem hover state. Clique parece "morto".
**Fix**: Adicionar `hover:shadow-sm hover:border-primary/30 transition-all duration-200` na classe CN do card nao-selecionado.
**Status**: Corrigido — adicionado `hover:shadow-sm` + `cursor-pointer`

#### [P1-002] Error state do AnalyzingStep com cores hardcoded e sem rounded
**Pilar**: Polish & Craft + Visual Consistency
**Arquivo**: `apps/web/src/components/wizard/AnalyzingStep.tsx:107-136`
**Problema**: Alert de erro usa `border-l-4` sem `rounded-lg`, e cores amber hardcoded.
**Fix**: Substituido amber por tokens `warning`, hint card ja tinha `rounded-r-lg`.
**Status**: Corrigido

#### [P1-003] Approval state do DSD com cores hardcoded
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx:250-266`
**Problema**: Estado de aprovacao gengivoplastia usa `amber-600`, `emerald-700` inline.
**Fix**: Extrair para tokens semanticos `warning`/`success`.
**Status**: Corrigido

#### [P1-004] Resultado cards sem hover/transition
**Pilar**: Interaction Quality
**Arquivo**: `apps/web/src/pages/Result.tsx:297-303`
**Problema**: Cards de alternativas de produto nao tem hover state.
**Fix**: `hover:shadow-md transition-shadow duration-200`
**Status**: Corrigido

#### [P1-005] GroupResult card sem hover
**Pilar**: Interaction Quality
**Arquivo**: `apps/web/src/pages/GroupResult.tsx:111`
**Problema**: Card header de resina sem hover effect.
**Status**: Ja existia — `hover:shadow-md transition-shadow duration-300` na linha 111

#### [P1-006] PDF download sem loading animation visual
**Pilar**: Interaction Quality
**Arquivo**: `apps/web/src/pages/Result.tsx:74-77`
**Problema**: Botao de PDF mostra Loader2 icon mas sem feedback visual no container.
**Status**: Gerenciado pelo PageShell `DetailPage.footerActions` — icon ja muda para Loader2 com animate-spin

#### [P1-007] CollapsibleDSD hover sem transition
**Pilar**: Interaction Quality
**Arquivo**: `apps/web/src/components/dsd/CollapsibleDSD.tsx:65`
**Problema**: `hover:bg-secondary/30` presente mas sem `transition-colors`.
**Fix**: Adicionado `transition-colors duration-200`.
**Status**: Corrigido

#### [P1-008] Observations section border sem rounded-r
**Pilar**: Spatial Design
**Arquivo**: `apps/web/src/components/wizard/ReviewAnalysisStep.tsx:207-219`
**Problema**: `border-l-2 border-primary/30` sem `rounded-r-lg`, padding desbalanceado.
**Fix**: Adicionado `rounded-r-lg bg-muted/30`.
**Status**: Corrigido

#### [P1-009] DSD Loading state sem hierarquia de titulo
**Pilar**: Information Hierarchy
**Arquivo**: `apps/web/src/components/wizard/dsd/DSDLoadingState.tsx:25-59`
**Problema**: H2 e paragrafo com mesmo peso visual. Sem icone distintivo.
**Fix**: Adicionado hero icon `Smile` em container circular `bg-primary/10`, subtitle com `text-sm`.
**Status**: Corrigido

#### [P1-010] SimulationViewer tabs sem hover foreground
**Pilar**: Interaction Quality
**Arquivo**: `apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx:113-117`
**Problema**: Tabs nao-selecionadas sem `hover:text-foreground`.
**Fix**: Adicionado `hover:text-foreground` (tambem em CollapsibleDSD tabs).
**Status**: Corrigido

#### [P1-011] Step 6 Success — excesso de espaco vazio
**Pilar**: Spatial Design / Information Hierarchy
**Arquivo**: Step 6 wizard (success state)
**Problema**: Tela de sucesso extremamente esparsa — apenas checkmark + 2 botoes em 80% de espaco vazio. Nao transmite valor do que foi gerado.
**Fix**: Adicionar resumo do caso (N dentes, tipo de tratamento, badge DSD incluido) entre o checkmark e os botoes.
**Status**: Pendente — requer redesign estrutural do componente

#### [P1-012] Evaluation Details — tabela muito esparsa
**Pilar**: Spatial Design / Information Hierarchy
**Arquivo**: `apps/web/src/pages/EvaluationDetails.tsx`
**Problema**: Pagina com 2 linhas na tabela e imenso espaco vazio abaixo. Sem preview do DSD, sem resumo do caso, sem foto do paciente.
**Fix**: Adicionar card de resumo com foto + DSD preview acima da tabela.
**Status**: Pendente — ja possui SessionHeaderCard com foto; requer redesign do layout da tabela

---

### P2 — Advisory (10 encontrados)

#### [P2-001] PhotoUpload badge overlay inconsistente
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/wizard/PhotoUploadStep.tsx:407-410`
**Problema**: Badge overlay usa `bg-background/80 border-border/50` quando poderia usar `bg-muted/90 backdrop-blur-md`.

#### [P2-002] PatientPreferences gradient inconsistente
**Pilar**: Visual Consistency
**Arquivo**: `apps/web/src/components/wizard/PatientPreferencesStep.tsx:65`
**Problema**: Card usa `card-elevated border-primary/20` enquanto credit info box usa `bg-gradient-to-r from-primary/5 to-accent/5`.

#### [P2-003] DSD progress bar radius inconsistente
**Pilar**: Polish & Craft
**Arquivo**: `apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx:307-313`
**Problema**: Progress bar outer e inner ambos `rounded-full`. Outer deveria ser `rounded-xl` para melhor peso visual.

#### [P2-004] DSD error types sem distincao visual
**Pilar**: Information Hierarchy
**Arquivo**: `apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx:337-347`
**Problema**: Hard errors e soft warnings usam mesma cor amber. Deveria distinguir: `destructive` para erros, `warning` para avisos.

#### [P2-005] Result resin property cards com rounded-xl
**Pilar**: Polish & Craft
**Arquivo**: `apps/web/src/pages/Result.tsx:196-211`
**Problema**: Cards pequenos de propriedades usam `rounded-xl` quando deveriam usar `rounded-lg` (padrao para sub-cards).

#### [P2-006] GroupResult badges com gap insuficiente
**Pilar**: Spatial Design
**Arquivo**: `apps/web/src/pages/GroupResult.tsx:80-85`
**Problema**: `gap-1.5 mt-2` muito apertado. Deveria ser `gap-2`.

#### [P2-007] Observacoes duplicadas no DSD
**Pilar**: Information Hierarchy
**Arquivo**: `apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx` (observacoes)
**Problema**: "Visagismo nao realizado" aparece duplicado (2 bullets com texto quase identico). Screenshot confirma: "Visagismo nao realizado - foto da face completa indisponivel" E "Analise de visagismo nao realizada — foto da face completa nao fornecida".
**Fix**: Backend/prompt deduplication necessaria.

#### [P2-008] Passo a Passo sem agrupamento visual
**Pilar**: Information Hierarchy
**Arquivo**: Group Protocol page (Passo a Passo section)
**Problema**: 19 checkboxes em lista corrida sem agrupamento logico. Deveria ter sub-headers: "Preparacao", "Aplicacao", "Acabamento", "Pos-operatorio".

#### [P2-009] Mobile — botao "Descartar gengivoplastia" cortado
**Pilar**: Spatial Design
**Arquivo**: `apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx` (gengivoplasty buttons)
**Problema**: No mobile (390px), botoes "Prosseguir com gengivoplastia" e "Descartar" nao cabem na mesma linha — "Descartar" fica cortado. Screenshot mobile confirma.
**Fix**: Stack vertical com `flex-col sm:flex-row` nos botoes.

#### [P2-010] Credit confirm dialog sem aria-describedby
**Pilar**: Interaction Quality
**Arquivo**: `apps/web/src/components/__tests__/CreditConfirmDialog.test.tsx` (console warning)
**Problema**: Console warning visivel: `AlertDialogContent requires a description or aria-describedby`. Acessibilidade incompleta.
**Fix**: Adicionar `<AlertDialogDescription>` ou `aria-describedby` ao dialogo.

---

## Resumo de Correcoes

| Severidade | Total | Corrigidos | Pendentes |
|------------|-------|------------|-----------|
| P0 | 5 | 4 | 1 (P0-001 falso positivo — chave ja existia) |
| P1 | 12 | 9 | 3 (P1-005 ja tinha hover, P1-006 PageShell gerencia, P1-011/P1-012 requerem redesign) |
| P2 | 10 | 0 | 10 |
| **Total** | **27** | **13** | **14** |

---

## Analise Visual por Tela

### Step 1 — Photo Upload (Score: 7.6)
**Pontos fortes**: Drop zone limpa, dicas uteis, badges de formato (JPG/PNG/HEIC/10MB) elegantes, opcoes "Completa" vs "Rapida" bem diferenciadas.
**Problemas**: Dialog de rascunho anterior poderia ter backdrop blur mais consistente. Foto uploaded sem zoom/crop.

### Step 2 — Preferences (Score: 7.4)
**Pontos fortes**: Selecao binaria clara (Natural vs Diamond), checkmark no selecionado, info de creditos transparente.
**Problemas**: Cards poderiam ter exemplos visuais (preview de tons), hover ausente no nao-selecionado.

### Step 3 — Analyzing (Score: 7.0)
**Pontos fortes**: Barra de progresso com percentual, steps de progresso com checkmarks, foto com scanning line animation.
**Problemas**: Foto com padding lateral excessivo (areas cinza vazias nos lados), titulo com gradiente cyan bonito mas sem subtitle descritivo.

### Step 4 — DSD Analysis (Score: 7.1)
**Pontos fortes**: Conteudo extremamente rico, slider antes/depois funcional, analise de proporcoes com barras e checks, sugestoes por dente bem organizadas.
**Problemas**: Alerta de gengivoplastia com amber hardcoded, observacoes duplicadas, simulacao loading card sem consistencia visual com outros cards.

### Step 5 — Review (Score: 7.0)
**Pontos fortes**: Status de IA visivel (90% alta confianca), gengivoplastia highlighted, tooth cards com selecao e tipo de tratamento, resumo do caso.
**Problemas**: Warning cards com amber hardcoded, badges "baixa" confianca sem cor semantica clara, muita informacao na tela pode sobrecarregar.

### Step 6 — Success (Score: 6.3)
**Pontos fortes**: Check icon limpo, "Caso criado com sucesso!" claro.
**Problemas**: **Tela mais fraca do fluxo** — imenso espaco vazio (80%), sem resumo do que foi gerado, sem stats de quantos dentes/protocolos, sem preview. Nao transmite valor.

### Evaluation Details (Score: 6.4)
**Pontos fortes**: Breadcrumbs corretos, acoes no header (Nova Avaliacao, Compartilhar, etc.), tabela clara.
**Problemas**: **Segunda tela mais fraca** — apenas 2 linhas na tabela com espaco vazio enorme abaixo. Gengivoplastia sem "Ver Protocolo" (so "Mais opcoes"). Sem preview DSD, sem foto, sem resumo clinico.

### Group Protocol (Score: 7.2)
**Pontos fortes**: Conteudo clinico excelente (tabela de estratificacao, passo a passo com 19 steps, alertas, "O que NAO fazer"), slider antes/depois, analise de proporcoes, resinas utilizadas como badges.
**Problemas**: "wizard.recalculate" nao traduzido (P0), passo a passo sem agrupamento (19 items corridos), alternativa simplificada poderia ser visualmente mais destacada.

---

## Observacoes de Coerencia Visual

### Consistencias positivas (bem feito)
- Wizard stepper consistente em todas as telas (checkmarks, icones, labels)
- Sidebar navigation identica em todas as paginas
- Botao primario cyan consistente (CTA principal sempre em bg-primary)
- Breadcrumbs consistentes nas paginas de resultado
- Cards com `card-elevated` usado consistentemente
- Badge "Confianca alta" com estilo consistente

### Inconsistencias detectadas
1. **Cores de alerta**: amber/rose/emerald hardcoded vs tokens semanticos — inconsistente entre componentes
2. **Border-left accent**: Usado em alerts (DSD, Review) mas estilo varia (l-4 amber vs l-2 primary)
3. **Card backgrounds**: Alguns usam `bg-primary/5`, outros `bg-secondary/30`, outros `bg-muted` — sem padrao claro para "card destacado"
4. **Botoes secundarios**: Mistura de `variant="outline"`, `variant="ghost"`, `btn-press` sem hierarquia clara
5. **Rounded**: Maioria dos cards usa `rounded-xl` corretamente, mas sub-cards e property cards tambem usam `rounded-xl` quando deveriam ser `rounded-lg`

---

## Screenshots Capturados

| # | Arquivo | Descricao |
|---|---------|-----------|
| 01 | `dsd-audit/01-landing-desktop.png` | Landing page full |
| 02 | `dsd-audit/02-dashboard-desktop.jpeg` | Dashboard logado |
| 03 | `dsd-audit/03-step1-photo-desktop.jpeg` | Step 1 com dialog rascunho |
| 04 | `dsd-audit/04-step1-photo-uploaded-desktop.jpeg` | Step 1 foto carregada |
| 05 | `dsd-audit/05-step1-photo-uploaded-mobile.jpeg` | Step 1 mobile |
| 06 | `dsd-audit/06-credit-confirm-dialog.jpeg` | Dialog confirmacao creditos |
| 07 | `dsd-audit/07-step2-preferences-desktop.jpeg` | Step 2 preferencias |
| 08 | `dsd-audit/08-step2-preferences-mobile.jpeg` | Step 2 mobile |
| 09 | `dsd-audit/09-step3-analyzing-desktop.jpeg` | Step 3 analise DSD |
| 10 | `dsd-audit/10-step4-dsd-analyzing-desktop.jpeg` | Step 4 DSD 75% |
| 11 | `dsd-audit/11-step4-dsd-complete-desktop-top.jpeg` | Step 4 DSD completo (topo) |
| 12 | `dsd-audit/12-step4-dsd-proportions-desktop.jpeg` | Step 4 proporcoes + slider |
| 13 | `dsd-audit/13-step4-dsd-suggestions-desktop.jpeg` | Step 4 sugestoes + observacoes |
| 14 | `dsd-audit/14-step4-dsd-mobile-top.jpeg` | Step 4 DSD mobile |
| 15 | `dsd-audit/15-step5-review-desktop.jpeg` | Step 5 revisao (topo) |
| 16 | `dsd-audit/16-step5-review-teeth-desktop.jpeg` | Step 5 selecao dentes |
| 17 | `dsd-audit/17-step5-review-patient-desktop.jpeg` | Step 5 dados paciente + resumo |
| 18 | `dsd-audit/18-step5-review-mobile.jpeg` | Step 5 mobile |
| 19 | `dsd-audit/19-step6-generating-desktop.jpeg` | Step 6 gerando caso |
| 20 | `dsd-audit/20-step6-success-desktop.jpeg` | Step 6 sucesso |
| 21 | `dsd-audit/21-evaluation-details-desktop.jpeg` | Evaluation Details |
| 22 | `dsd-audit/22-protocol-top-desktop.jpeg` | Protocol topo + slider |
| 23 | `dsd-audit/23-protocol-stratification-desktop.jpeg` | Protocol proporcoes + tabela |
| 24 | `dsd-audit/24-protocol-steps-desktop.jpeg` | Protocol resinas + alternativa |
| 25 | `dsd-audit/25-protocol-alerts-desktop.jpeg` | Protocol passo a passo + alertas |
| 26 | `dsd-audit/26-protocol-mobile-top.jpeg` | Protocol mobile |

---

## Recomendacoes Adicionais

### Design System
1. **Criar tokens `warning`**: Se nao existem `bg-warning`, `text-warning`, `border-warning` — criar para substituir todos os amber/yellow hardcoded
2. **Documentar hierarquia de botoes**: `default` (CTA primario), `outline` (secundario), `ghost` (terciario) — hoje mistura de estilos

### UX do Fluxo
3. **Step 6 Success**: Adicionar resumo do caso gerado (quantos dentes, tipos, se tem DSD) — a tela mais fraca
4. **Evaluation Details**: Adicionar hero card com foto + DSD preview + stats — pagina mais vazia
5. **Passo a Passo**: Agrupar os 19 steps em categorias (Preparacao, Aplicacao de Camadas, Acabamento, Pos-op)
6. **Mobile DSD gengivoplastia**: Botoes devem stackar vertical em mobile

### Cross-skill References
> **Cross-skill**: O finding P2-007 (observacoes duplicadas) seria melhor tratado no backend (prompt engineering).
> **Cross-skill**: Problemas de acessibilidade (P2-010 aria-describedby) merecem `mobile-pwa-usability` audit.
> **Cross-skill**: O finding P0-001 (i18n key) deve ser validado com `i18n-audit` skill.

---

## Checklist Final

- [x] 8 telas analisadas (6 wizard + 2 resultado)
- [x] Screenshots capturados em desktop (1440px) e mobile (390px)
- [x] Score atribuido para cada pilar em cada pagina
- [x] Todos os findings tem: severidade, arquivo:linha, descricao, fix sugerido
- [ ] Correcoes P0/P1/P2 aplicadas (PENDENTE — aguardando aprovacao)
- [x] Relatorio salvo em docs/plans/2026-02-23-design-critique-dsd-flow.md
- [x] Cross-skill references indicadas
