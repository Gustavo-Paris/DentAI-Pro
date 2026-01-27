
# Plano: Equilibrar Prompt DSD - Acao Positiva com Limites

## Problema Identificado

O prompt ultra-conservador esta funcionando como uma "lista de proibicoes" que paralisa a IA generativa. Resultado: nenhuma alteracao visivel.

### Exemplo do problema atual:
```
PROIBIDO: formato, tamanho, contorno, bordos, posicao, espacamentos...
PERMITIDO: clarear cor (1 linha)
```

A proporcao de instrucoes negativas vs positivas e ~5:1, fazendo a IA "ter medo" de fazer qualquer coisa.

## Solucao: Inverter a Enfase

Reescrever os prompts para:
1. **COMECA** com instrucao POSITIVA clara (o que FAZER)
2. **ENFATIZA** a acao desejada (clareamento, remocao de manchas)
3. **TERMINA** com limites (o que nao fazer) - mais curto

### Nova Filosofia de Prompt

```text
TAREFA PRINCIPAL: Aplicar clareamento dental profissional.
[instrucoes detalhadas do que FAZER]

LIMITES: Preservar formato e silhueta.
[limites concisos]
```

## Alteracoes Tecnicas

### Arquivo: supabase/functions/generate-dsd/index.ts

#### 1. Novo Prompt Restoration-Replacement (Balanceado)

Substituir linhas 340-391 por:

```typescript
simulationPrompt = `TAREFA: Aplicar clareamento dental profissional e remover manchas.

=== ACAO PRINCIPAL (OBRIGATORIA) ===
CLAREAR TODOS OS DENTES para tom A1/A2 (branco natural brilhante).
Isso e um CLAREAMENTO DENTAL - os dentes devem ficar VISIVELMENTE mais brancos.

ACOES ESPECIFICAS:
1. CLAREAR: Mude a cor de todos os dentes para branco natural A1/A2
2. MANCHAS: REMOVA todas as manchas amarelas, marrons ou acinzentadas
3. INTERFACES: Nos dentes ${restorationTeeth || '11 e 21'}, ELIMINE as linhas de transicao entre resina e esmalte
4. UNIFORMIZAR: Todos os dentes devem ter a MESMA cor (sem variacoes)
5. BRILHO: Adicione reflexos naturais uniformes

O RESULTADO deve ser um sorriso VISIVELMENTE mais branco e limpo.
Compare: antes = dentes amarelados com manchas, depois = dentes brancos uniformes.
${patientDesires}
=== PRESERVACAO ===
- Labios e pele: IDENTICOS a foto original
- Formato dos dentes: manter silhueta original
- Dimensoes da imagem: SAIDA = ENTRADA

VERIFICACAO: Os dentes devem estar CLARAMENTE mais brancos que na foto original.`;
```

#### 2. Novo Prompt Standard (Balanceado)

Substituir linhas 418-458 por:

```typescript
simulationPrompt = `TAREFA: Aplicar clareamento dental profissional.

=== ACAO PRINCIPAL (OBRIGATORIA) ===
CLAREAR TODOS OS DENTES para tom A1/A2 (branco natural brilhante).
O resultado deve ser um CLAREAMENTO VISIVEL - dentes significativamente mais brancos.

ACOES ESPECIFICAS:
1. CLAREAR: Mude a cor de TODOS os dentes visiveis para branco A1/A2
2. MANCHAS: REMOVA qualquer mancha amarela, marrom ou descoloracao
3. UNIFORMIZAR: Todos os dentes devem ter a MESMA cor e brilho
4. REFLEXOS: Adicione reflexos naturais que indicam dentes saudaveis
${patientDesires}
=== PRESERVACAO ===
- Labios e pele: copie EXATAMENTE da foto original
- Formato dos dentes: mantenha a silhueta natural
- Dimensoes: SAIDA = mesmas dimensoes da ENTRADA

RESULTADO ESPERADO:
- Dentes VISIVELMENTE mais brancos (diferenca clara do original)
- Cor uniforme A1/A2 em todos os dentes
- Sem manchas ou descoloracoes
- Labios e rosto inalterados`;
```

#### 3. Novo Prompt Intraoral (Balanceado)

Substituir linhas 393-416 por:

```typescript
simulationPrompt = `TAREFA: Aplicar clareamento dental profissional em foto intraoral.

=== ACAO PRINCIPAL ===
CLAREAR TODOS OS DENTES para tom A1/A2 (branco natural).
Os dentes devem ficar VISIVELMENTE mais brancos.

ACOES:
1. CLAREAR todos os dentes para branco natural
2. REMOVER todas as manchas e descoloracoes
3. UNIFORMIZAR cor e brilho
4. SUAVIZAR linhas de interface de restauracoes
${patientDesires}
PRESERVAR: Gengiva, fundo, dimensoes da imagem.
Manter silhueta dental original.

RESULTADO: Dentes CLARAMENTE mais brancos que na foto original.`;
```

## Resumo das Mudancas

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Foco do prompt | 70% proibicoes | 70% acoes positivas |
| Primeira instrucao | "PRESERVACAO TOTAL" | "CLAREAR TODOS OS DENTES" |
| Tom | Defensivo/restritivo | Proativo/claro |
| Resultado esperado | Implicito | Explicito ("VISIVELMENTE mais brancos") |

## Resultado Esperado

### Antes (problema atual):
- IA "paralizada" pelas proibicoes
- Resultado = foto identica sem mudancas

### Depois (com mudancas):
- IA entende que DEVE clarear os dentes
- Resultado = dentes visivelmente mais brancos
- Formato preservado (limite secundario, nao primario)

## Nota Importante

Esta abordagem confia na IA para entender "clarear sem mudar formato" como uma instrucao unica. Se ainda houver problemas de formato alterado, podemos adicionar uma etapa de pos-processamento que usa a mascara de silhueta original.
