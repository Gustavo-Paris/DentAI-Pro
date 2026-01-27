
# Plano: Correções e Melhorias Baseadas no Feedback da Dentista

## Resumo dos Problemas Identificados (com Evidência Visual)

| # | Problema | Evidência | Prioridade |
|---|----------|-----------|------------|
| 1 | Erro "Erro ao criar caso" sem detalhes | Print mostra toast genérico | ALTA |
| 2 | Detecção incorreta (11,21 vs 11,12) | Relatório da dentista | ALTA |
| 3 | Sugestões incompletas (3 vs 8 dentes) | Relatório da dentista | ALTA |
| 4 | Simulação não corrige assimetria laterais | Prints do slider DSD | MÉDIA |
| 5 | Falta preferência de clareamento | Relatório da dentista | BAIXA |
| 6 | Lista consolidada de resinas | Print mostra tabela dispersa | BAIXA |
| 7 | "Biselamento em esmalte" desatualizado | Print IMG_2710 mostra no checklist | MÉDIA |
| 8 | Protocolo adesivo rígido | Relatório da dentista | BAIXA |

---

## Correções Técnicas Detalhadas

### 1. Mensagens de Erro Detalhadas

**Arquivo**: `src/pages/NewCase.tsx` (linhas 648-656)

**Problema Atual**:
```typescript
} catch (error) {
  console.error('Error:', error);
  toast.error('Erro ao criar caso');
  setStep(4);
}
```

**Solução**:
Implementar tratamento de erros específico com mensagens descritivas:

```typescript
} catch (error: any) {
  console.error('Error creating case:', error);
  
  let errorMessage = 'Erro ao criar caso';
  let shouldGoBack = true;
  
  // Erros de banco de dados
  if (error?.code === '23505') {
    errorMessage = 'Paciente já cadastrado com este nome. Selecione o paciente existente.';
  } else if (error?.code === '23503') {
    errorMessage = 'Erro de referência no banco de dados. Verifique os dados do paciente.';
  } 
  // Erros de Edge Functions
  else if (error?.message?.includes('recommend-resin')) {
    errorMessage = 'Erro ao gerar protocolo de resina. Verifique a cor VITA e tente novamente.';
  } else if (error?.message?.includes('recommend-cementation')) {
    errorMessage = 'Erro ao gerar protocolo de cimentação. Tente novamente.';
  }
  // Erros de validação
  else if (error?.message?.includes('Cor VITA')) {
    errorMessage = 'Cor VITA inválida. Selecione uma cor válida (ex: A1, A2, B1).';
  }
  // Erros de rede
  else if (error?.message?.includes('network') || error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
    errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  // Erros de rate limit
  else if (error?.message?.includes('429') || error?.code === 'RATE_LIMITED') {
    errorMessage = 'Muitas requisições. Aguarde alguns minutos.';
    shouldGoBack = false;
  }
  // Erro genérico com detalhes
  else if (error?.message && error.message.length < 100) {
    errorMessage = `Erro: ${error.message}`;
  }
  
  toast.error(errorMessage, { duration: 5000 });
  if (shouldGoBack) {
    setStep(5); // Voltar para revisão
  }
}
```

---

### 2. Melhorar Detecção de Dentes (11 vs 12)

**Arquivo**: `supabase/functions/generate-dsd/index.ts` (linhas 580-612)

**Problema**: A IA confunde central (11/21) com lateral (12/22).

**Solução**: Adicionar critérios precisos de identificação FDI no `analysisPrompt`:

Adicionar após linha 612 (antes de "=== AVALIAÇÃO DE VIABILIDADE"):

```typescript
=== IDENTIFICAÇÃO PRECISA DE DENTES COM RESTAURAÇÃO ===

PROCESSO OBRIGATÓRIO DE IDENTIFICAÇÃO:
1. Analise CADA dente INDIVIDUALMENTE
2. Compare o dente com seu contralateral (11 vs 21, 12 vs 22)
3. Se um dente tem restauração e seu contralateral NÃO tem, isso é um indicador FORTE

CRITÉRIOS DE IDENTIFICAÇÃO FDI - MEMORIZE:
┌─────────────────────────────────────────────────────────────────┐
│ CENTRAIS (11, 21): MAIORES, mais LARGOS, bordos mais RETOS     │
│ LATERAIS (12, 22): MENORES (~20-30% mais estreitos),           │
│                    contorno mais ARREDONDADO/OVAL              │
│ CANINOS (13, 23): PONTIAGUDOS, proeminência vestibular         │
└─────────────────────────────────────────────────────────────────┘

ERRO COMUM A EVITAR:
Se você detectar 2 dentes com restauração lado a lado, pergunte-se:
- São dois CENTRAIS (11 e 21)? → Estão um de cada lado da linha média
- São CENTRAL + LATERAL (11 e 12)? → Estão do MESMO lado, lateral é menor

DICA VISUAL: 
O lateral é visivelmente MAIS ESTREITO que o central ao lado.
Se dois dentes parecem ter o MESMO tamanho, provavelmente são os dois centrais.
Se um é claramente MENOR, é o lateral.
```

---

### 3. Remover Limite de Sugestões (3-4 dentes)

**Arquivo**: `supabase/functions/generate-dsd/index.ts` (linha 664)

**Problema Atual**:
```typescript
❌ PROIBIDO: sugerir mais de 3-4 dentes por arcada (foque nos essenciais)
```

**Solução**: Substituir linha 664 por:

```typescript
✅ OBRIGATÓRIO: Listar TODOS os dentes que precisam de intervenção
   - Se o paciente tem 6-8 dentes com restaurações antigas, liste TODOS
   - Ordene por prioridade: problemas de saúde > estética funcional > refinamento
   - O dentista precisa ver o escopo COMPLETO para planejar orçamento
```

---

### 4. Permitir Correção de Assimetria dos Laterais

**Arquivo**: `supabase/functions/generate-dsd/index.ts` (prompt Standard, linhas 386-407)

**Problema**: Os prompts conservadores impedem correção de assimetria.

**Solução**: Adicionar exceção explícita para harmonização de simetria:

Inserir após linha 396 (após "4. REFLEXOS"):

```typescript
5. SIMETRIA BILATERAL: Se os LATERAIS (12 e 22) tiverem formas DIFERENTES:
   - Um mais quadrado, outro mais arredondado
   - Um mais largo, outro mais estreito
   VOCÊ PODE harmonizar os contornos para ficarem SIMÉTRICOS
   Use o lateral mais harmônico como referência para o outro
```

Também adicionar no prompt restoration-replacement após linha 353:

```typescript
6. SIMETRIA: Harmonize contornos de laterais assimétricos (12 vs 22)
```

---

### 5. Preferência de Clareamento já Existe

**Verificação**: O campo `whiter` já existe em `PatientPreferencesStep.tsx`.

**Problema**: Não está sendo usado no `recommend-resin`.

**Arquivo**: `supabase/functions/recommend-resin/index.ts` (linha 265)

**Solução**: Adicionar após linha 265:

```typescript
${data.patientDesiredWhiter ? `
PREFERÊNCIA DE COR DO PACIENTE:
O paciente DESEJA dentes mais brancos. 
Recomende tons de resina 1-2 níveis mais claros que ${data.toothColor}.
Exemplo: Se cor atual é A3, sugira resinas em A2 ou A1.
` : ''}
```

E adicionar o campo na validação e interface se necessário.

---

### 6. Card de Resumo de Resinas

**Arquivo**: `src/pages/Result.tsx` ou `src/components/protocol/StratificationProtocol.tsx`

**Problema**: As resinas estão dispersas na tabela de camadas.

**Solução**: Adicionar card consolidado após a tabela de estratificação:

```typescript
// Novo card após a tabela de layers
<Card className="mt-4 border-primary/20">
  <CardHeader className="py-3">
    <CardTitle className="text-sm flex items-center gap-2">
      <Palette className="w-4 h-4" />
      Resinas Utilizadas
    </CardTitle>
  </CardHeader>
  <CardContent className="py-2">
    <div className="flex flex-wrap gap-2">
      {/* Deduplicate resins */}
      {[...new Set(protocol?.layers?.map(l => `${l.resin_brand} ${l.shade}`))].map((resin, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {resin}
        </Badge>
      ))}
    </div>
  </CardContent>
</Card>
```

---

### 7. Remover "Biselamento em Esmalte" Desatualizado

**Arquivo**: `supabase/functions/recommend-resin/index.ts` (prompt, linha ~276)

**Problema**: O checklist inclui "Biselamento amplo em esmalte" que é técnica obsoleta.

**Solução**: Adicionar regras explícitas no prompt após linha 276:

```typescript
TÉCNICAS OBSOLETAS - NÃO INCLUIR NO CHECKLIST:
❌ "Bisel em esmalte" ou "Biselamento" → Técnica ultrapassada
❌ "Bisel amplo" → Não usar
❌ "Ácido fosfórico por 30 segundos em dentina" → Tempo excessivo

TÉCNICAS ATUALIZADAS PARA USAR:
✅ "Acabamento em chanfro suave" ou "Transição suave entre resina e esmalte"
✅ "Sem preparo adicional em esmalte" (técnica minimamente invasiva)
✅ "Condicionamento ácido conforme indicação do substrato e orientação do fabricante"

REGRA: O checklist NÃO DEVE conter a palavra "bisel" ou "biselamento".
```

---

### 8. Protocolo Adesivo Flexível

**Arquivo**: `supabase/functions/recommend-resin/index.ts` (prompt)

**Solução**: Modificar a estrutura do checklist no prompt para incluir flexibilidade:

```typescript
No checklist, para o passo de adesivo, usar:
"Sistema adesivo conforme protocolo do fabricante (verificar tempo de aplicação, camadas e fotoativação específicos)"

No array de "alerts", incluir:
"O protocolo adesivo varia entre fabricantes - consulte as instruções do sistema utilizado"
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/NewCase.tsx` | Tratamento de erros detalhado (linhas 648-656) |
| `supabase/functions/generate-dsd/index.ts` | 1) Critérios FDI para dentes 2) Remover limite de sugestões 3) Permitir correção de assimetria |
| `supabase/functions/recommend-resin/index.ts` | 1) Remover bisel 2) Flexibilizar adesivo 3) Considerar preferência de clareamento |
| `src/pages/Result.tsx` | Adicionar card de resumo de resinas (opcional) |

---

## Ordem de Implementação

### Fase 1 - Críticos (Bugs)
1. Mensagens de erro detalhadas (`NewCase.tsx`)
2. Remover limite de sugestões (`generate-dsd`)
3. Remover "bisel em esmalte" (`recommend-resin`)

### Fase 2 - Melhorias de Precisão
4. Critérios FDI para identificação de dentes (`generate-dsd`)
5. Permitir correção de assimetria (`generate-dsd`)
6. Flexibilizar protocolo adesivo (`recommend-resin`)

### Fase 3 - Novas Funcionalidades
7. Usar preferência de clareamento (`recommend-resin`)
8. Card de resumo de resinas (`Result.tsx`)

---

## Seção Técnica - Detalhes de Implementação

### Validação de Cor VITA (Problema nos logs)

Nos logs aparece: `"Validation failed: Cor VITA inválida"`

Verificar se a validação em `_shared/validation.ts` aceita todas as cores VITA válidas:
- Escala clássica: A1, A2, A3, A3.5, A4, B1, B2, B3, B4, C1, C2, C3, C4, D2, D3, D4
- Bleach shades: BL1, BL2, BL3, BL4, OM1, OM2, OM3

### Deploy de Edge Functions

Após modificações:
- `generate-dsd` - precisa redeploy
- `recommend-resin` - precisa redeploy

### Testes Recomendados

1. Criar caso com paciente existente (não deve dar erro 23505)
2. Criar caso com restaurações em 11+12 (deve detectar corretamente)
3. Verificar que checklist não contém "bisel"
4. Verificar que sugestões listam todos os dentes necessários
