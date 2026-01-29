
# Plano de Correção: Classe/Resumo do Caso/Estratificação

## Resumo dos Problemas Identificados

Após análise do código e do banco de dados, identifiquei as seguintes causas raiz:

| # | Problema | Causa | Arquivo |
|---|----------|-------|---------|
| 1 | "Classe Classe IV" | O banco já salva "Classe IV" e o código adiciona "Classe " na frente | `EvaluationDetails.tsx` |
| 2 | "Cavidade" aparece para procedimentos estéticos | Label fixo no `CaseSummaryBox.tsx` | `CaseSummaryBox.tsx` |
| 3 | Só mostra "Tokuyama" na tabela de estratificação | Campo `resin_brand` do AI só contém fabricante | `ProtocolTable.tsx` + prompt AI |
| 4 | Badge "Estética: Alto" sem tooltip | Falta tooltip explicativo | `CaseSummaryBox.tsx` |

---

## Correção 1: Remover duplicação "Classe Classe"

**Arquivo:** `src/pages/EvaluationDetails.tsx` (linha 344)

**Problema atual:**
```typescript
return `Classe ${evaluation.cavity_class} • ${evaluation.restoration_size}`;
// evaluation.cavity_class = "Classe IV" → Resultado: "Classe Classe IV"
```

**Solução:**
Remover o prefixo "Classe " pois o valor já contém a palavra:

```typescript
// Detectar se já começa com "Classe"
const cavityLabel = evaluation.cavity_class.startsWith('Classe ') 
  ? evaluation.cavity_class 
  : `Classe ${evaluation.cavity_class}`;
return `${cavityLabel} • ${evaluation.restoration_size}`;
```

**Texto final sugerido:** `Classe IV • Média`

---

## Correção 2: Trocar label "Cavidade" por nomenclatura contextual

**Arquivo:** `src/components/protocol/CaseSummaryBox.tsx` (linhas 80-90)

**Problema atual:**
```tsx
<Layers className="w-3 h-3" />
Cavidade  // ← Sempre mostra "Cavidade"
```

**Solução:**
Adicionar lista de procedimentos estéticos e condicionar o label:

```typescript
const AESTHETIC_PROCEDURES = [
  'Faceta Direta', 
  'Recontorno Estético', 
  'Fechamento de Diastema', 
  'Reparo de Restauração'
];

const isAestheticProcedure = cavityClass && AESTHETIC_PROCEDURES.includes(cavityClass);
const cavityLabel = isAestheticProcedure ? 'Procedimento' : 'Classificação (Black)';
```

**Renderização:**
- Para classes tradicionais: "Classificação (Black): Classe IV"
- Para estéticos: "Procedimento: Faceta Direta"

---

## Correção 3: Mostrar Fabricante + Linha na tabela de estratificação

**Arquivo:** `src/components/protocol/ProtocolTable.tsx` (linha 56)

**Problema atual:**
```tsx
<TableCell>{layer.resin_brand}</TableCell>  // Mostra só "Tokuyama"
```

**Solução A - Frontend (paliativa):**
O campo `resin_brand` deveria vir do AI como "Tokuyama - Estelite Omega", não apenas "Tokuyama".

**Solução B - Corrigir no prompt da AI (recomendado):**
**Arquivo:** `supabase/functions/recommend-resin/index.ts`

Modificar a instrução no prompt que define o formato de `resin_brand`:

```
Para cada camada, informe:
- resin_brand: Fabricante + Linha do produto (ex: "Tokuyama - Estelite Sigma Quick", "FGM - Vittra APS")
- NÃO informe apenas o fabricante (ex: "Tokuyama" é incorreto)
```

Esta correção fará com que novos protocolos venham com o formato correto. Dados existentes permanecerão com formato antigo.

---

## Correção 4: Espessura como faixa guia

**Arquivo:** `src/components/protocol/ProtocolTable.tsx` (linha 64)

**Problema atual:**
```tsx
<TableCell className="text-muted-foreground">
  {layer.thickness}
</TableCell>
```

**Solução:**
A correção principal deve vir do prompt da AI que já deve gerar faixas (0.3-0.5mm). No frontend, adicionar tooltip ou texto de apoio:

```tsx
<TableCell className="text-muted-foreground">
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="cursor-help border-b border-dotted border-muted-foreground/50">
        {layer.thickness}
      </span>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p className="text-xs">Ajustar conforme profundidade e mascaramento necessário</p>
    </TooltipContent>
  </Tooltip>
</TableCell>
```

---

## Correção 5: Tooltip para "Estética: Alto"

**Arquivo:** `src/components/protocol/CaseSummaryBox.tsx` (linhas 116-119)

**Problema atual:**
```tsx
<Badge variant="outline" className="capitalize text-xs">
  Estética: {aestheticLevel}
</Badge>
```

**Solução:**
Adicionar Tooltip com explicação dos níveis:

```tsx
const aestheticExplanations: Record<string, string> = {
  'básico': 'Restauração funcional, estética secundária',
  'alto': 'Mimetismo natural exigido, paciente atento aos detalhes',
  'muito alto': 'DSD ativo, harmonização completa, estética de excelência'
};

<Tooltip>
  <TooltipTrigger asChild>
    <Badge variant="outline" className="capitalize text-xs cursor-help">
      <Info className="w-3 h-3 mr-1" />
      Estética: {aestheticLevel}
    </Badge>
  </TooltipTrigger>
  <TooltipContent>
    <p className="text-xs max-w-[200px]">
      {aestheticExplanations[aestheticLevel.toLowerCase()] || 'Nível estético selecionado'}
    </p>
  </TooltipContent>
</Tooltip>
```

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/EvaluationDetails.tsx` | Corrigir duplicação "Classe Classe" |
| `src/components/protocol/CaseSummaryBox.tsx` | Label contextual + tooltip estética |
| `src/components/protocol/ProtocolTable.tsx` | Tooltip na espessura |
| `supabase/functions/recommend-resin/index.ts` | Instruir AI a informar "Fabricante - Linha" |

---

## Ordem de Implementação

1. **EvaluationDetails.tsx** - Correção crítica P0 (duplicação visível)
2. **CaseSummaryBox.tsx** - Label contextual + tooltip
3. **ProtocolTable.tsx** - Tooltip na espessura
4. **recommend-resin/index.ts** - Formato correto no prompt AI

---

## Validação Pós-Implementação

1. Criar caso com Classe IV → verificar se mostra "Classe IV • Média" (não "Classe Classe IV")
2. Criar caso com "Faceta Direta" → verificar se mostra "Procedimento: Faceta Direta"
3. Verificar tooltip no badge "Estética: Alto"
4. Criar novo caso → verificar se protocolo mostra "Tokuyama - Estelite Omega"
