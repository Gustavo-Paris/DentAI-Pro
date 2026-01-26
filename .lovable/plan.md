
## Plano: Corrigir Recomendação de Resina para Considerar Inventário e Orçamento

### Problema Identificado

A edge function `recommend-resin` está sempre recomendando **Filtek Z350 XT** independentemente do:
- **Inventário do profissional** (mesmo que tenha outras resinas cadastradas)
- **Orçamento selecionado** (econômico/moderado/premium)

### Causa Raiz

1. O prompt para IA não tem instruções claras sobre **mapeamento de orçamento para faixas de preço**
2. As resinas não são apresentadas com **clareza sobre custo-benefício**
3. O usuário **não tem inventário cadastrado** (`has_inventory_at_creation: false`), então o sistema deveria recomendar **a melhor opção geral considerando o orçamento**
4. A IA está "fixando" na Filtek Z350 XT (Premium) mesmo quando o orçamento é "moderado"

---

### Solução Proposta

Melhorar o prompt da edge function para:

1. **Mapear orçamento explicitamente para faixas de preço**
2. **Priorizar resinas adequadas ao orçamento antes de considerar aspectos técnicos**
3. **Incluir regras rígidas de seleção baseadas no orçamento**

---

### Alterações na Edge Function `recommend-resin/index.ts`

**1. Adicionar mapeamento de orçamento para faixas de preço no prompt:**

```text
REGRAS DE ORÇAMENTO (OBRIGATÓRIO SEGUIR):
- Orçamento "econômico": Priorizar APENAS resinas com faixa de preço "Econômico" ou "Intermediário"
- Orçamento "moderado": Priorizar resinas com faixa "Intermediário" ou "Médio-alto", evitar "Premium"
- Orçamento "premium": Pode recomendar qualquer faixa, priorizando as melhores tecnicamente

IMPORTANTE: A recomendação principal DEVE respeitar o orçamento do paciente!
Se o orçamento é "moderado", NÃO recomende resinas "Premium" como Filtek Z350 XT.
```

**2. Reorganizar a lista de resinas por faixa de preço:**

```typescript
// Agrupar resinas por faixa de preço
const groupResinsByPrice = (resinList: typeof resins) => {
  const groups = {
    'Econômico': resinList.filter(r => r.price_range === 'Econômico'),
    'Intermediário': resinList.filter(r => r.price_range === 'Intermediário'),
    'Médio-alto': resinList.filter(r => r.price_range === 'Médio-alto'),
    'Premium': resinList.filter(r => r.price_range === 'Premium'),
  };
  return groups;
};
```

**3. Adicionar instruções de prioridade baseadas no orçamento:**

```text
=== RESINAS POR FAIXA DE PREÇO ===

**ECONÔMICAS** (recomendadas para orçamento econômico):
${formatResinList(economicResins)}

**INTERMEDIÁRIAS** (recomendadas para orçamento moderado):
${formatResinList(intermediateResins)}

**MÉDIO-ALTO** (aceitáveis para orçamento moderado/premium):
${formatResinList(mediumHighResins)}

**PREMIUM** (apenas para orçamento premium):
${formatResinList(premiumResins)}
```

**4. Adicionar validação de conformidade com orçamento na resposta:**

O JSON de resposta incluirá um campo `budget_compliance` para verificar se a recomendação está dentro do orçamento solicitado.

---

### Fluxo de Lógica Atualizado

```text
1. Receber dados do caso incluindo budget (econômico/moderado/premium)
2. Buscar resinas do banco de dados
3. Agrupar resinas por faixa de preço
4. Verificar se usuário tem inventário:
   - SE TEM: Filtrar inventário por faixas adequadas ao orçamento
   - SE NÃO TEM: Usar todas as resinas adequadas ao orçamento
5. Montar prompt enfatizando:
   - Resinas compatíveis com orçamento (prioridade 1)
   - Adequação técnica ao caso (prioridade 2)
   - Inventário do profissional (prioridade 3 se aplicável)
6. Chamar IA com instruções claras de seleção
7. Validar resposta contra orçamento
```

---

### Detalhes Técnicos

**Arquivo: `supabase/functions/recommend-resin/index.ts`**

Alterações específicas:

**Linha ~121-168**: Substituir lógica de formatação de resinas para incluir agrupamento por preço

**Linha ~170-190**: Adicionar seção de "REGRAS DE ORÇAMENTO" no prompt

**Linha ~196-245**: Reformular prompt para enfatizar orçamento antes de aspectos técnicos

**Novo bloco após a resposta**: Adicionar logging para debug de conformidade com orçamento

---

### Resultado Esperado

| Orçamento | Resinas Recomendadas |
|-----------|---------------------|
| Econômico | Opus Bulk Fill, Z100, Charisma Diamond |
| Moderado | Essentia, Estelite Sigma, Beautifil II, Opallis |
| Premium | Filtek Z350 XT, Estelite Omega, Venus Diamond |

---

### Benefícios

- Recomendações respeitam o orçamento do paciente
- Profissionais recebem sugestões realistas para diferentes perfis econômicos
- Melhor utilização do inventário quando cadastrado
- Transparência sobre por que determinada resina foi escolhida
