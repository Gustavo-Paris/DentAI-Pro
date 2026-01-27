
# Plano: Simulacao DSD Conservadora - Preservar Morfologia

## Problema Central

A IA esta alterando a ESTRUTURA dos dentes (formato, proporcao, contorno) quando deveria apenas alterar COR e TEXTURA. Isso resulta em:
- Dentes com aparencia artificial/"protese"
- Bordos incisais diferentes
- Proporcoes alteradas
- Boca com aparencia "esquisita"

## Diagnostico Tecnico

Os prompts atuais incluem instrucoes que dao "permissao" para alterar estrutura:
- "Suavizar contorno levemente"
- "Harmonizar"
- "Proporcao 75-80% da altura"
- Sugestoes de mudancas propostas (aumentar, fechar espacos)

A IA interpreta essas instrucoes como liberdade para modificar a morfologia.

## Solucao: Prompt Ultra-Conservador

Criar uma nova abordagem de prompt que seja EXTREMAMENTE restritiva:

### Filosofia do Novo Prompt

```text
TAREFA: Apenas RECOLORIR dentes, NAO modificar estrutura.
```

### Regras Estruturais Rigidas

```text
PROIBIDO ALTERAR (tolerancia ZERO):
- Formato/contorno de QUALQUER dente
- Tamanho (largura, altura) de QUALQUER dente
- Posicao relativa dos dentes
- Bordos incisais (silhueta da borda deve ser IDENTICA)
- Pontos de contato entre dentes
- Espacamentos/diastemas existentes
- Angulacao dos dentes
```

### O Que PODE Ser Alterado

```text
UNICAS EDICOES PERMITIDAS:
1. COR: Clarear uniformemente para A1/A2
2. MANCHAS: Remover manchas superficiais de cor
3. INTERFACES: Suavizar linhas de interface de restauracoes antigas
4. BRILHO: Uniformizar brilho/reflexos

TECNICA: Pense como aplicar um "filtro de clareamento" 
que NAO altera a geometria dos dentes.
```

### Verificacao de Morfologia

```text
TESTE DE VALIDACAO:
Se voce sobrepor a silhueta dos dentes originais sobre a simulacao,
elas devem ser IDENTICAS. Se nao forem, a edicao foi excessiva.
```

## Alteracoes Tecnicas

### Arquivo: supabase/functions/generate-dsd/index.ts

#### 1. Criar Novo Prompt Ultra-Conservador

Substituir o prompt de "restoration-replacement" e "standard" por versoes muito mais restritivas que:

- Removam qualquer mencao a "harmonizar contorno"
- Removam referencias a proporcoes ideais
- Proibam explicitamente alteracoes geometricas
- Foquem APENAS em cor/textura

#### 2. Novo Prompt Standard (Conservador)

```typescript
simulationPrompt = `TAREFA: RECOLORIR dentes - NAO alterar estrutura.

=== PRESERVACAO DE LABIOS/PELE (CRITICO) ===
Labios e pele = IDENTICOS a foto original (pixel por pixel).

=== PRESERVACAO DE MORFOLOGIA DENTAL (CRITICO) ===
A ESTRUTURA dos dentes deve ser 100% preservada.

PROIBIDO ALTERAR (TOLERANCIA ZERO):
- Formato/contorno de qualquer dente
- Tamanho (largura, altura)
- Bordos incisais (silhueta deve ser IDENTICA)
- Posicao relativa dos dentes
- Pontos de contato
- Espacamentos existentes
- Angulacao

UNICAS EDICOES PERMITIDAS:
1. COR: Clarear para tom uniforme A1/A2
2. MANCHAS: Remover manchas de superficie
3. INTERFACES: Suavizar linhas de restauracoes antigas
4. BRILHO: Uniformizar reflexos

TECNICA DE EDICAO:
Aplique um "filtro de clareamento dental" que:
- Muda APENAS a cor dos dentes
- NAO altera geometria ou silhueta
- Preserva micro-textura natural

TESTE: Sobreponha silhueta original → deve ser IDENTICA.

=== DIMENSOES ===
SAIDA = mesmas dimensoes que ENTRADA

RESULTADO: Mesmos dentes, apenas mais claros e uniformes.`;
```

#### 3. Novo Prompt Restoration-Replacement (Conservador)

```typescript
simulationPrompt = `TAREFA: Corrigir COR de restauracoes antigas - NAO alterar formato.

=== PRESERVACAO TOTAL ===
- Labios/pele: IDENTICOS (pixel por pixel)
- Formato dos dentes: IDENTICO (silhueta preservada)
- Tamanho dos dentes: IDENTICO
- Posicao dos dentes: IDENTICA

PROIBIDO (TOLERANCIA ZERO):
- Alterar contorno de qualquer dente
- Modificar bordos incisais
- Mudar espacamentos
- "Harmonizar" ou "suavizar" geometria

DENTES COM RESTAURACOES: ${restorationTeeth || 'anteriores superiores'}

EDICOES PERMITIDAS (APENAS):
1. Remover LINHA DE INTERFACE (transicao resina/esmalte)
2. Uniformizar COR com dentes adjacentes
3. Remover MANCHAMENTO marginal
4. Clarear para A1/A2

O que NAO fazer:
- Nao altere o FORMATO da restauracao
- Nao modifique o CONTORNO do dente
- Nao mude a PROPORCAO do dente

TECNICA: Edite APENAS cor e textura, preserve geometria 100%.

RESULTADO: Mesmos dentes, mesma forma, apenas cor corrigida.`;
```

#### 4. Remover Referencias a Proporcoes/Harmonizacao

Remover de TODOS os prompts:
- "Proporcao: largura = 75-80% da altura"
- "suavizar contorno"
- "harmonizar"
- Referencias as sugestoes de mudanca propostas

#### 5. Simplificar Logs

```typescript
console.log("DSD Simulation Request:", {
  promptType: promptType,
  approach: "CONSERVADOR - apenas cor, sem alteracao estrutural",
  analysisConfidence: analysis.confidence
});
```

## Resumo das Mudancas

| Secao | Alteracao |
|-------|-----------|
| Standard Prompt | Reescrever para proibir alteracoes geometricas |
| Restoration Prompt | Reescrever para focar apenas em cor/interface |
| Reconstruction Prompt | Manter (casos de dentes ausentes precisam reconstruir) |
| Intraoral Prompt | Simplificar para apenas cor |
| Todas as instrucoes de proporcao | REMOVER |

## Resultado Esperado

### Antes (problema atual):
- Dentes com formato alterado
- Bordos incisais diferentes
- Aparencia de "protese"
- Boca "esquisita"

### Depois (com mudancas):
- Mesma silhueta dental
- Mesmos contornos e bordos
- Apenas cor clareada e uniformizada
- Aparencia NATURAL do proprio paciente
- Restauracoes antigas "invisiveis" mas SEM alterar formato

## Fluxo Visual

```text
FOTO ORIGINAL              SIMULACAO DSD
+----------------+         +----------------+
|  [silhueta A]  |   -->   |  [silhueta A]  |  <- MESMA silhueta
|  cor: amarelada|         |  cor: A1/A2    |  <- SO cor mudou
|  interface: sim|         |  interface: nao|  <- SO textura mudou
+----------------+         +----------------+
```

## Limitacao Conhecida

Esta abordagem conservadora NAO mostrara:
- Fechamento de diastemas
- Aumento de comprimento
- Correcao de angulacao

Isso e INTENCIONAL - o objetivo e mostrar uma simulacao REALISTA do que restauracoes de resina podem fazer (mudar cor, nao formato).

Para mudancas estruturais, o paciente precisaria de ortodontia ou facetas ceramicas, que sao tratamentos diferentes.
