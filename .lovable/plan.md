

# Análise Clínica de Consistência - Página de Resultado

## Resumo da Análise

Analisei os dados clínicos do caso `f18a75ad-733d-4117-9162-2fe90d29c44a` e encontrei **2 inconsistências clínicas reais** que precisam ser corrigidas.

---

## Dados do Caso Analisado

| Campo | Valor |
|-------|-------|
| Dente | 11 (Incisivo Central Superior) |
| Classe | Classe IV |
| Cor Detectada | A2 |
| Preferência | "Clareamento notável - dentes mais brancos (BL1/BL2)" |
| Resina Recomendada | Tokuyama - Estelite Sigma Quick |

### Protocolo Gerado pela IA

| Camada | Resina | Cor | Espessura |
|--------|--------|-----|-----------|
| 1. Opaco | Estelite Sigma Quick | **OA1** | 0.3mm |
| 2. Dentina | Estelite Sigma Quick | **OA1** | 0.5-1.0mm |
| 3. Esmalte | Estelite Sigma Quick | **B1** | 0.3mm |

---

## Inconsistência 1: Cor OA1 Não Existe na Linha Estelite Sigma Quick

### Problema Crítico

O protocolo recomenda a cor **OA1** para a camada de Opaco e Dentina usando a resina **Estelite Sigma Quick**. No entanto, ao verificar o catálogo de resinas no banco de dados:

**Cores disponíveis na Estelite Sigma Quick:**
- Esmalte: CE, WE
- Opaco: **OA2, OA3** (não existe OA1!)
- Universal: A1, A2, A3, A3.5, B1, B2

**A cor OA1 só existe na linha Palfique LX5**, também da Tokuyama:
- Palfique LX5: OA1, OA2, OA3, OPA2

### Impacto Clínico

O dentista pode:
1. Procurar uma resina que não existe no mercado
2. Fazer um pedido incorreto ao distribuidor
3. Ficar confuso ao não encontrar o produto

### Solução

Adicionar validação no `recommend-resin` para verificar se a combinação (linha de produto + cor) existe no catálogo. Se a IA recomendar uma cor inexistente, o sistema deve:

1. Consultar o catálogo para cores disponíveis naquela linha
2. Substituir pela cor mais próxima disponível (OA2)
3. OU recomendar a linha que possui a cor desejada (Palfique LX5 OA1)

---

## Inconsistência 2: Camada de Dentina Usando Cor Opaca

### Problema Clínico

O protocolo usa **OA1** (Opaco) para a camada de **Dentina** (camada 2):

```
2. Dentina | Estelite Sigma Quick | OA1 | 0.5-1.0mm
```

Tecnicamente, cores com prefixo "O" (Opaco) são para mascaramento e não para reproduzir a estrutura da dentina. A nomenclatura correta seria:

- **Camada Opaco**: OA1/OA2 (mascaramento)
- **Camada Dentina**: DA1/DA2 ou simplesmente A1/A2 (corpo da dentina)

### Impacto Clínico

Usar uma resina opaca em toda a camada de dentina pode resultar em:
1. Aparência artificial e "morta" do dente
2. Perda de profundidade óptica
3. Dificuldade em atingir o mimetismo natural

### Solução

Ajustar o prompt do `recommend-resin` para diferenciar claramente:

```text
REGRAS DE COR POR CAMADA:
- Camada OPACO: Cores com prefixo O (OA1, OA2, OB1) - para mascarar substrato
- Camada DENTINA/BODY: Cores universais (A1, A2, B1) ou Dentina (DA1, DA2)
- Camada ESMALTE: Cores com prefixo E ou esmalte (EA1, EA2, WE, CE)
```

---

## O Que Está Correto

### 1. Direção do Clareamento
A preferência era "Clareamento notável (BL1/BL2)" e a IA ajustou:
- De A2 (cor detectada) → Para B1 no esmalte
- Isso está na direção certa (B1 é mais claro que A2)

### 2. Protocolo de 3 Camadas para Classe IV
Correto para uma restauração estética anterior de tamanho médio.

### 3. Espessuras Adequadas
- Opaco: 0.3mm (OK para substrato normal)
- Dentina: 0.5-1.0mm (adequado)
- Esmalte: 0.3mm (correto para translucidez)

### 4. Técnicas de Acabamento
O protocolo de polimento está completo e correto (Sof-Lex, Twist Gloss, pasta Diamond).

### 5. Checklist Atualizado
Não menciona "bisel" (técnica ultrapassada) e inclui sistema adesivo adequado.

---

## Plano de Correções

### Correção 1: Validação de Combinação Resina + Cor

**Arquivo:** `supabase/functions/recommend-resin/index.ts`

Adicionar uma etapa de pós-processamento que valida as cores recomendadas:

```typescript
// Após receber resposta da IA
async function validateAndFixProtocol(
  protocol: StratificationProtocol, 
  supabase: SupabaseClient
): Promise<StratificationProtocol> {
  // Para cada camada, verificar se a cor existe na linha recomendada
  for (const layer of protocol.layers) {
    const [manufacturer, productLine] = layer.resin_brand.split(' - ');
    
    // Consultar catálogo
    const { data: available } = await supabase
      .from('resin_catalog')
      .select('shade')
      .ilike('product_line', `%${productLine}%`)
      .eq('shade', layer.shade);
    
    if (!available || available.length === 0) {
      // Cor não existe - buscar alternativa
      const { data: alternatives } = await supabase
        .from('resin_catalog')
        .select('shade, type')
        .ilike('product_line', `%${productLine}%`)
        .ilike('type', `%${getLayerType(layer.name)}%`)
        .limit(3);
      
      if (alternatives?.length > 0) {
        layer.shade = alternatives[0].shade;
        // Adicionar alerta sobre substituição
        protocol.alerts.push(
          `Cor ${layer.shade} substituída: a cor original não está disponível nesta linha.`
        );
      }
    }
  }
  
  return protocol;
}
```

### Correção 2: Regras Claras de Cor por Tipo de Camada

**Arquivo:** `supabase/functions/recommend-resin/index.ts`

Adicionar ao prompt (antes do JSON de resposta):

```text
=== REGRAS DE COR POR TIPO DE CAMADA (OBRIGATÓRIO) ===

CAMADA OPACO/MASCARAMENTO:
- USAR: Cores com prefixo O (OA1, OA2, OB1, WO) ou White Opaquer
- OBJETIVO: Bloquear substrato escuro, criar barreira

CAMADA DENTINA/BODY:
- USAR: Cores universais (A1, A2, B1) ou Dentina específica (DA1, DA2)
- NÃO USAR: Cores opacas (OA1) para dentina - resultado artificial
- OBJETIVO: Reproduzir corpo do dente com profundidade

CAMADA ESMALTE:
- USAR: Cores de esmalte (EA1, WE, CE) ou translúcidos (Trans, CT, IT)
- OBJETIVO: Brilho superficial e mimetismo
```

---

## Resumo de Impacto

| Problema | Severidade | Impacto Clínico |
|----------|------------|-----------------|
| Cor inexistente (OA1 na Sigma Quick) | **Alta** | Produto não encontrado, confusão |
| Opaco na camada de dentina | **Média** | Estética sub-ótima, mas funcional |

---

## Arquivos a Modificar

1. **`supabase/functions/recommend-resin/index.ts`**
   - Adicionar validação de cor vs linha de produto no catálogo
   - Refinar regras de cor por tipo de camada no prompt

