# AURIA - Design: Correções QA + Avaliação Especialista

**Data:** 2026-02-04
**Baseado em:** Teste QA automatizado + Avaliação de Dentista Especialista
**Status:** Revisado e aprovado para implementação
**Revisão:** v2 — corrigido após validação de file paths e revisão de escopo

---

## Resumo

8 correções identificadas a partir de QA automatizado e avaliação de dentista especialista.
3 mudanças de frontend (determinísticas) e 5 mudanças de prompt de IA (probabilísticas).

| # | Item | Tipo | Prioridade | Arquivo Principal |
|---|------|------|------------|-------------------|
| 1 | Remover coluna "Detalhes" | Frontend | Alta | `EvaluationDetails.tsx` |
| 2 | Colapsar "Dados Detectados" | Frontend | Alta | `ReviewAnalysisStep.tsx` |
| 3 | Falso positivo restauração | Prompt | Alta | `analyze-dental-photo/index.ts` |
| 4 | Drag & drop fotos adicionais | Frontend | Média | `PhotoUploadStep.tsx` |
| 5 | Pré-molares no DSD | Prompt | Média | `generate-dsd/index.ts` |
| 6 | Gengivoplastia estruturada | Prompt | Média | `generate-dsd/index.ts` |
| 7 | Camadas de estratificação + resinas | Prompt | Baixa | `recommend-resin/index.ts` |
| 8 | Contenção terapêutica DSD | Prompt | Baixa | `generate-dsd/index.ts` |

---

## Item 1 — Remover coluna "Detalhes" da tabela de Casos Gerados

### Root Cause

A função `getClinicalDetails()` em `useEvaluationDetail.ts:261-276` exibe `cavity_class` + `restoration_size` para resinas (ex: "Classe VI - Pequena") e `ai_treatment_indication` para outros tratamentos. Classificações de Black não fazem sentido para facetas/coroas e confundem o dentista no contexto de uma tabela resumo.

### Arquivos

- `apps/web/src/pages/EvaluationDetails.tsx` (linhas ~246-321 desktop, ~323-379 mobile)

> **Nota de revisão:** `SharedEvaluation.tsx` foi removida do escopo. A página pública exibe `ai_treatment_indication` (linha 179), não `cavity_class`. Não há coluna "Detalhes" lá — nenhuma mudança necessária.

### Mudança

**Desktop table**: Remover `<TableHead>Detalhes</TableHead>` (linha ~256) e o `<TableCell>` correspondente que chama `getClinicalDetails()`.

**Mobile card view**: Remover renderização de "Detalhes" nos cards (linhas ~323-379).

A função `getClinicalDetails()` em `useEvaluationDetail.ts` pode permanecer no hook — não causa efeito se não for chamada.

### Resultado esperado

Tabela com 4 colunas: Dente | Tratamento (badge) | Status | Ações.

---

## Item 2 — Colapsar "Dados Detectados" e "Detalhes Clínicos" em accordion fechado

### Root Cause

`ReviewAnalysisStep.tsx:842-987` renderiza um formulário editável com campos técnicos (Cor VITA, Substrato, Profundidade) preenchidos pela IA. O dentista vê como dados "perdidos" porque a informação já flui internamente para gerar sugestões de tratamento.

Logo abaixo (linhas ~991+), existe um Accordion "Detalhes Clínicos Adicionais" com campos extras (Condição do Substrato, Condição do Esmalte). Mesma lógica — dados técnicos que o dentista comum não precisa validar.

### Trade-off considerado

Remover completamente a UI de edição eliminaria a capacidade do dentista corrigir a IA quando ela erra (ver Item 3). Como a IA não é 100% precisa, a recomendação é **colapsar** em vez de remover — preserva o escape hatch sem poluir a UI.

### Arquivos

- `apps/web/src/components/wizard/ReviewAnalysisStep.tsx` (linhas ~842-987 + ~991+)

### Mudança

Envolver o `<Card>` de "Dados Detectados" (linhas 842-987) **e** o `<Accordion>` de "Detalhes Clínicos Adicionais" (linhas 991+) em um **único Accordion fechado por padrão**:

```tsx
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="technical-data">
    <AccordionTrigger className="text-sm text-muted-foreground">
      Dados técnicos (avançado)
    </AccordionTrigger>
    <AccordionContent>
      {/* Card "Dados Detectados" existente (linhas 842-987) */}
      {/* Campos de "Detalhes Clínicos Adicionais" existentes (linhas 991+) */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

O state do wizard (`formData.tooth`, `formData.cavity_class`, etc.) continua sendo preenchido pela análise de IA e editável quando o accordion é aberto. O fluxo interno não quebra.

### Resultado esperado

Página de revisão limpa por padrão. Dentistas avançados podem expandir "Dados técnicos (avançado)" para corrigir a IA se necessário.

---

## Item 3 — Corrigir falso positivo de restauração

### Root Cause

O prompt em `analyze-dental-photo/index.ts:177-370` já tem regras contra falsos positivos, mas falta uma regra crítica: variação natural de cor/textura entre dentes homólogos não é evidência de restauração. A IA vê diferença de cor entre 11 e 21 e infere "restauração antiga amarelada" quando é variação natural.

### Arquivos

- `supabase/functions/analyze-dental-photo/index.ts` (system prompt ~linhas 177-370)
- `supabase/functions/generate-dsd/index.ts` (reforço ~linhas 800-815)

### Mudança — analyze-dental-photo

Adicionar após as regras existentes de detecção de restauração:

```
REGRAS CRÍTICAS PARA DETECÇÃO DE RESTAURAÇÕES:
- Diferença de cor, brilho ou opacidade entre dentes homólogos NÃO é evidência de restauração.
  Variações naturais de cor entre dentes contralaterais são comuns e esperadas.
- Para diagnosticar restauração existente, EXIJA pelo menos UM dos seguintes sinais DIRETOS:
  1. Linha de interface visível (junção dente-restauração)
  2. Mudança ABRUPTA de textura superficial em área delimitada
  3. Falha marginal visível (gap, degrau, descoloração na margem)
  4. Diferença de translucidez em área LOCALIZADA (não o dente inteiro)
- Se o dente inteiro apresenta cor diferente do homólogo mas sem interface visível,
  classificar como "variação natural de cor" e NÃO como restauração existente.
- Na dúvida entre "dente íntegro com variação de cor" e "restauração antiga",
  SEMPRE optar pela classificação mais conservadora (dente íntegro).
```

### Mudança — generate-dsd (reforço)

Adicionar na seção de regras de restauração:

```
REFORÇO: Se a análise clínica (camada 1) classificou um dente como íntegro,
o DSD NÃO deve reclassificá-lo como tendo restauração. Respeitar o diagnóstico
da camada clínica como fonte de verdade para presença/ausência de restaurações.
```

### Resultado esperado

IA não classifica variação natural de cor como restauração. Dentes íntegros com diferença de tonalidade em relação ao homólogo são descritos como tal.

---

## Item 4 — Drag & drop nas fotos adicionais

### Root Cause

Em `PhotoUploadStep.tsx`, o drag & drop está implementado apenas no card principal (linhas 152-170, 274-281). As fotos adicionais (Sorriso 45° e Face Completa, linhas 394-504) usam `<input type="file">` com click handler apenas. O handler `handleDrag`/`handleDrop` já existe; só não foi aplicado às áreas de upload opcionais.

### Arquivos

- `apps/web/src/components/wizard/PhotoUploadStep.tsx` (linhas ~394-504)

### Mudança

Adicionar state para drag visual feedback:

```tsx
const [dragActiveSmile45, setDragActiveSmile45] = useState(false);
const [dragActiveFace, setDragActiveFace] = useState(false);
```

No card de Sorriso 45° (~linhas 414-455):

```tsx
onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveSmile45(true); }}
onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveSmile45(false); }}
onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
onDrop={(e) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActiveSmile45(false);
  if (e.dataTransfer.files?.[0]) {
    handleOptionalFile(e.dataTransfer.files[0], 'smile45');
  }
}}
```

Visual feedback condicional no className do card:

```tsx
className={cn(
  '...classes existentes...',
  dragActiveSmile45 ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
)}
```

Mesmo padrão para Face Completa com `dragActiveFace` e `'face'`.

### Resultado esperado

Drag & drop funcional nas 3 áreas de upload (principal + 2 adicionais) com feedback visual consistente.

---

## Item 5 — Incluir pré-molares na análise DSD

### Root Cause

O prompt do DSD em `generate-dsd/index.ts:852-864` menciona pré-molares ("PRE-MOLARS if visible: 14, 15, 24, 25") mas a inclusão é condicional e vaga ("if visible"). A IA ignora na prática porque o foco primário é nos incisivos/caninos e não há critérios objetivos de quando incluir.

### Arquivos

- `supabase/functions/generate-dsd/index.ts` (~linhas 852-864)

### Mudança

Substituir a menção atual de pré-molares por:

```
ANÁLISE DE PRÉ-MOLARES (14, 15, 24, 25) - OBRIGATÓRIA quando:
1. Corredor bucal classificado como "excessivo" → sugerir facetas vestibulares nos
   pré-molares para reduzir o corredor e ampliar o arco do sorriso
2. 4 ou mais dentes anteriores (11-13, 21-23) receberão tratamento estético →
   avaliar pré-molares para harmonização de cor e forma com os anteriores tratados
3. Foto de sorriso 45° disponível → SEMPRE analisar pré-molares visíveis nessa foto
4. Paciente relata insatisfação com "sorriso estreito" ou "espaço escuro lateral"

Para pré-molares, avaliar especificamente:
- Facetas vestibulares parciais para preenchimento de corredor bucal
- Harmonização de cor com dentes anteriores (especialmente se whitening aplicado)
- Aumento de volume vestibular quando deficiente
- NÃO sugerir tratamento em pré-molares se corredor bucal é "adequado" e
  anteriores não receberão tratamento
```

### Resultado esperado

DSD inclui pré-molares na análise quando clinicamente justificado, com critérios objetivos documentados no prompt.

---

## Item 6 — Gengivoplastia como sugestão estruturada

### Root Cause

O sistema já detecta condições gengivais (prompt do DSD, linhas 817-850, com critérios: sorriso >3mm, assimetria >1mm, proporção >85%). Mas essas indicações ficam enterradas nas observações textuais — não são transformadas em sugestão de tratamento estruturada com ação clara.

### Arquivos

- `supabase/functions/generate-dsd/index.ts` (prompt ~linhas 817-850, schema ~linhas 1005-1116)

### Mudança — Output schema

No `suggestions[]`, adicionar `"gengivoplastia"` como valor válido de `treatment_indication`.

### Mudança — Prompt

Substituir a seção gengival por:

```
ANÁLISE GENGIVAL E INDICAÇÃO DE GENGIVOPLASTIA:
Quando detectar QUALQUER uma das seguintes condições, gerar uma sugestão
ESTRUTURADA (não apenas observação textual) com treatment_indication "gengivoplastia":

Critérios de indicação:
1. Sorriso gengival > 3mm de exposição gengival
2. Assimetria de zenith gengival > 1mm entre dentes homólogos
3. Proporção largura/altura dos incisivos centrais > 85% (coroas clínicas curtas)
4. Margens gengivais irregulares que comprometem a harmonia do tratamento restaurador planejado

Formato da sugestão:
- tooth_number: listar TODOS os dentes envolvidos (ex: "15 ao 25" ou "13, 12, 11, 21, 22, 23")
- treatment_indication: "gengivoplastia"
- description: justificativa clínica específica
- SEMPRE incluir nota: "Procedimento preparatório - realizar ANTES do tratamento restaurador"
- Classificar como prioridade "alta" quando indicada, pois condiciona o resultado final

Se não houver indicação de gengivoplastia, NÃO mencionar. Evitar sugestões
desnecessárias tipo "gengiva aparenta saudável" sem contexto clínico.
```

### Resultado esperado

Gengivoplastia aparece como sugestão de tratamento estruturada (com dentes, justificativa, prioridade), não apenas como texto em observações.

---

## Item 7 — Consolidar camadas de estratificação + expandir resinas

### Root Cause

O prompt em `recommend-resin/index.ts:407-438` trata "Opaco/Mascaramento" e "Dentina/Body" como camadas separadas. **Clinicamente, opaco não é uma camada distinta** — é uma seleção de shade dentro da camada de dentina usada quando o substrato exige mascaramento. O protocolo atual confunde o dentista apresentando "Camada 1: Opaco" e "Camada 2: Dentina" como etapas distintas.

Além disso: (1) não há critério de priorização por polimento na camada de esmalte, (2) não existe conceito de "efeitos especiais" (corantes) para casos de alta exigência estética.

### Arquivos

- `supabase/functions/recommend-resin/index.ts` (~linhas 407-438, output schema)
- `apps/web/src/pages/Result.tsx` (consome `protocol.layers[]` para renderização)

> **Nota de revisão:** `Result.tsx` foi adicionado ao escopo. O frontend renderiza o protocolo de estratificação a partir do JSON retornado pela Edge Function. Se a estrutura de `layers[]` mudar (de 3-4 para 2-3 camadas), o componente que renderiza o protocolo em `Result.tsx` precisa suportar a nova estrutura.

### Mudança — Prompt

Substituir toda a seção de camadas por:

```
PROTOCOLO DE ESTRATIFICAÇÃO - CAMADAS:

1. CAMADA DE DENTINA (Body):
   Seleção de shade conforme substrato:
   - Substrato ESCURECIDO ou endodonticamente tratado:
     Usar shades opacos para mascaramento (OA1, OA2, OA3, OB1, WO).
     Aplicar como primeiro incremento da camada de dentina com 0.5-1mm de espessura.
     NÃO listar como camada separada - é o primeiro incremento de dentina.
   - Substrato NORMAL (esmalte saudável, dentina clara):
     Usar shades de dentina regulares (DA1, DA2, DA3, A1, A2, A3, B1, B2).
     Não usar shades opacos - criam aspecto artificial "morto".
   - Substrato LEVEMENTE ESCURECIDO:
     Usar shades de dentina com maior opacidade (DA3, A3) sem necessidade de O prefix.

2. CAMADA DE EFEITOS (opcional - apenas para alta exigência estética):
   Quando o caso envolver dentes anteriores com demanda estética alta:
   - Corante White: halo opaco incisal (simula naturalidade)
   - Corante Blue: translucidez incisal azulada
   - Opalescente: efeito de profundidade no terço incisal
   Listar como "Efeitos" no protocolo apenas quando indicado.
   Para casos rotineiros de posteriores, OMITIR esta camada.

3. CAMADA DE ESMALTE (Final):
   Seleção com PRIORIDADE para capacidade de polimento:
   - PRIORIDADE 1 (melhor polimento): Estelite Omega (MW, WE), Palfique LX5 (CE),
     Estelite Sigma Quick (WE, CE)
   - PRIORIDADE 2 (bom polimento): Filtek Z350 XT (CT, GT, WE, WT),
     FORMA (Trans, Enamel)
   - PRIORIDADE 3 (polimento adequado): Harmonize (Incisal, TN),
     Vittra APS (Trans, INC)
   Para shades BL (branqueamento): verificar se linha possui.
   Linhas COM shades BL: Palfique LX5, Forma, Filtek Z350 XT, Estelite Bianco.
   Se linha do inventário NÃO tem BL: alertar e sugerir shade mais próximo (A1, B1).

4. ACABAMENTO E POLIMENTO:
   (manter seção atual - está adequada conforme feedback da especialista)
```

### Mudança — Output schema

Ajustar `protocol.layers[]`:
- Remover conceito de "camada opaco" como item separado
- Dentina é sempre camada 1 (com nota de shade opaco se substrato exigir)
- Efeitos é camada 2 (opcional, pode ser omitida)
- Esmalte é camada 3 (com ranking de polimento na justificativa)

### Mudança — Result.tsx (frontend)

Verificar e ajustar a renderização de `protocol.layers[]` para suportar:
- Protocolo com 2 camadas (Dentina + Esmalte) quando efeitos não indicados
- Protocolo com 3 camadas (Dentina + Efeitos + Esmalte) quando efeitos indicados
- Label "Dentina" (com sub-nota sobre shade opaco) em vez de labels separados "Opaco" / "Dentina"

### Resultado esperado

Protocolo de estratificação com 2-3 camadas (Dentina, Efeitos opcional, Esmalte) em vez de 3-4 (Opaco, Dentina, Esmalte, às vezes Efeitos). Camada de esmalte prioriza resinas com melhor polimento.

---

## Item 8 — Contenção terapêutica: alinhar DSD com análise clínica

### Root Cause

A arquitetura de 3 camadas (detecção → DSD → recomendação) faz os prompts rodarem semi-independentemente. O `analyze-dental-photo` produz observações conservadoras (enfatiza evidência clínica). O `generate-dsd` tem foco estético e tende a sugerir tratamentos mais invasivos. Embora o DSD receba achados clínicos como contexto, o prompt não tem regra explícita de não contradizer a camada clínica.

### Arquivos

- `supabase/functions/generate-dsd/index.ts` (system prompt ~linhas 732-1003)

### Mudança

Adicionar como regra no início da seção de sugestões do DSD:

```
PRINCÍPIO DE CONTENÇÃO TERAPÊUTICA (OBRIGATÓRIO):

As sugestões do DSD devem SEMPRE respeitar o princípio de mínima intervenção:

1. HIERARQUIA DE INVASIVIDADE (menor → maior):
   Clareamento → Recontorno cosmético → Resina direta → Faceta de resina →
   Faceta de porcelana → Coroa parcial → Coroa total

2. REGRA: O DSD NUNCA deve sugerir um tratamento mais de 2 níveis acima do
   indicado pela análise clínica. Exemplos:
   - Análise clínica diz "desgaste incisal leve" → DSD pode sugerir até
     "resina direta" (2 níveis: recontorno → resina). NÃO pode sugerir faceta.
   - Análise clínica diz "fratura com perda de estrutura moderada" →
     DSD pode sugerir até "faceta de resina". NÃO pode sugerir coroa.
   - Análise clínica diz "restauração antiga com falha marginal" →
     DSD pode sugerir "substituição de restauração" ou "faceta direta".
     NÃO deve escalar para porcelana sem justificativa de extensão da falha.

3. EXCEÇÃO: Escalação permitida APENAS quando o paciente selecionou nível de
   whitening "hollywood" E múltiplos dentes anteriores necessitam harmonização
   simultânea. Neste caso, justificar explicitamente a escolha mais invasiva.

4. LINGUAGEM: Usar "considerar" e "avaliar possibilidade" em vez de
   "substituir por" ou "indicar". O DSD sugere, não prescreve.
```

### Resultado esperado

Notas DSD alinhadas com conservadorismo da análise clínica. Sem sugestões de faceta de porcelana quando a análise indica desgaste leve.

---

## Ordem de Implementação Recomendada

### Fase 1 — Frontend (sem risco de regressão de IA)
1. Item 1: Remover coluna "Detalhes"
2. Item 2: Colapsar "Dados Detectados" + "Detalhes Clínicos" em accordion fechado
3. Item 4: Drag & drop fotos adicionais

### Fase 2 — Prompts de alta prioridade
4. Item 3: Falso positivo de restauração (analyze-dental-photo + generate-dsd)
5. Item 8: Contenção terapêutica DSD (generate-dsd)

### Fase 3 — Prompts de expansão funcional
6. Item 5: Pré-molares no DSD (generate-dsd)
7. Item 6: Gengivoplastia estruturada (generate-dsd)

### Fase 4 — Protocolo de estratificação
8. Item 7: Consolidar camadas + expandir resinas (recommend-resin + Result.tsx)

### Validação entre fases

Após cada fase de prompt, rodar pelo menos 3 avaliações de teste com fotos variadas para verificar:
- Mudanças desejadas estão ocorrendo
- Sem regressão em cenários que já funcionavam
- Linguagem e formato da saída estão consistentes

---

## Referência de Arquivos

```
apps/web/src/
├── pages/
│   ├── EvaluationDetails.tsx      # Item 1: remover coluna Detalhes
│   └── Result.tsx                 # Item 7: renderização de protocol.layers[]
├── components/
│   └── wizard/
│       ├── ReviewAnalysisStep.tsx  # Item 2: colapsar Dados Detectados + Detalhes Clínicos
│       └── PhotoUploadStep.tsx     # Item 4: drag & drop fotos adicionais
└── hooks/
    └── domain/
        └── useEvaluationDetail.ts  # Item 1: getClinicalDetails() pode manter

supabase/functions/
├── analyze-dental-photo/
│   └── index.ts                   # Item 3: regras de detecção de restauração
├── generate-dsd/
│   └── index.ts                   # Itens 5, 6, 8: pré-molares, gengivoplastia, contenção
└── recommend-resin/
    └── index.ts                   # Item 7: camadas de estratificação + resinas
```

---

## Log de Revisão

| Versão | Data | Mudanças |
|--------|------|----------|
| v1 | 2026-02-04 | Documento inicial |
| v2 | 2026-02-04 | SharedEvaluation.tsx removida do escopo (não tem coluna Detalhes). Item 2 mudou de "remover" para "colapsar em accordion fechado" para preservar edição manual como escape hatch. Accordion "Detalhes Clínicos Adicionais" incluído no colapso. Result.tsx adicionada ao escopo do Item 7 (consome protocol.layers[]). |
