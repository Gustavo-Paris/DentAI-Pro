
# Análise do Relatório de Melhorias da Especialista

## Resumo dos Problemas Identificados

| # | Problema | Gravidade | Status Atual | Ação Sugerida |
|---|----------|-----------|--------------|---------------|
| 1 | Protocolo simplista (uma marca só) | Média | Sistema usa inventário OU recomenda | Melhorar prompt da IA |
| 2 | Resinas de baixa qualidade para detalhes | Média | Respeita orçamento definido | Ajustar lógica de casos estéticos |
| 3 | Classificação incorreta (Classe IV vs Faceta) | Alta | Termos incorretos | Atualizar terminologia |
| 4 | DSD com distorções | Alta | Já melhorado recentemente | Monitorar |

---

## Análise Detalhada de Cada Ponto

### 1. Protocolo de Estratificação Simplista

**Feedback**: "O sistema sugere uso de uma única marca (Tokuyama) para todas as camadas"

**Análise do código atual**:
O prompt atual (linha 272-277 do `recommend-resin/index.ts`) instrui:
```
Para casos estéticos (anteriores), use 3 camadas: Opaco, Dentina, Esmalte
```

Porém, não há instrução explícita para **combinar marcas diferentes** quando benéfico.

**Avaliação**: 
- **Parcialmente válido** - O sistema prioriza o inventário do usuário, então se o usuário só tem Tokuyama, faz sentido usar Tokuyama
- **Melhoria possível**: Para casos de alta estética, permitir combinar marcas quando isso melhora o resultado

**Sugestão de implementação**:
Adicionar ao prompt da IA uma seção específica sobre **combinação de marcas para alta estética**, incluindo a tabela da especialista como referência:

```
=== ESTRATIFICAÇÃO AVANÇADA (para nível estético "muito alto") ===

Você pode combinar diferentes marcas para otimizar cada camada:
- Aumento Incisal (Efeito): Trans-forma, CT-Z350, Trans20 (Empress)
- Interface Opaca: D BL-L (Empress), WB (Forma)
- Proximais (Esmalte): XLE (Harmonize), E BL-L (Empress)
- Esmalte Final: MW (Estelite) - excelente polimento
- Detalhes (Dentes Clareados): WE (Estelite Bianco)

NOTA: Só sugira combinações quando o nível estético for "muito alto" e o orçamento permitir.
```

---

### 2. Resinas de Baixa Qualidade para Detalhes Estéticos

**Feedback**: "Para detalhes pequenos, sugere Z350 quando deveria sugerir resina de alta qualidade"

**Análise**:
- A Z350 É uma resina premium de alta qualidade
- A especialista pode estar se referindo a usar resinas especializadas para acabamento (como Estelite MW para polimento superior)

**Avaliação**:
- **Parcialmente válido** - Para detalhes específicos, resinas especializadas podem ser melhores
- O sistema atual já considera a categoria "estética" da resina

**Sugestão de implementação**:
Para restaurações pequenas de refinamento estético, priorizar resinas com:
- Polimento "Excelente"
- Estética "Muito Alta"

---

### 3. Classificação Incorreta do Tipo de Tratamento

**Feedback**: "Não seria Classe IV, seria faceta ou recontorno estético"

**Análise do código**:
O campo `cavity_class` (Classe I, II, III, IV, V) é usado para **qualquer restauração**, mas a especialista aponta que procedimentos puramente estéticos (sem cavidade) devem ter terminologia diferente.

**Avaliação**: 
- **Válido e importante** - A terminologia está incorreta para casos estéticos puros

**Situação atual**:
- `ReviewAnalysisStep` força seleção de "Classe" mesmo para recontorno estético
- O schema `evaluation.ts` define `cavityClass: z.string().min(1, 'Classe é obrigatória')`

**Sugestão de implementação**:
1. Adicionar opções específicas ao campo `cavityClass`:
   - Para procedimentos restauradores: Classe I, II, III, IV, V
   - Para procedimentos estéticos: "Faceta Direta", "Recontorno Estético", "Fechamento de Diastema"

2. Condicionar as opções ao tipo de tratamento:
   ```typescript
   const CAVITY_OPTIONS_RESIN_RESTORATIVE = [
     { value: 'I', label: 'Classe I' },
     { value: 'II', label: 'Classe II' },
     { value: 'III', label: 'Classe III' },
     { value: 'IV', label: 'Classe IV' },
     { value: 'V', label: 'Classe V' },
   ];
   
   const CAVITY_OPTIONS_AESTHETIC = [
     { value: 'faceta_direta', label: 'Faceta Direta' },
     { value: 'recontorno', label: 'Recontorno Estético' },
     { value: 'fechamento_diastema', label: 'Fechamento de Diastema' },
     { value: 'reparo', label: 'Reparo de Restauração' },
   ];
   ```

---

### 4. Simulação DSD com Distorções

**Feedback**: "O DSD emagreceu demais os centrais, difícil de reproduzir clinicamente"

**Análise**:
- Este problema já foi parcialmente resolvido nas últimas atualizações
- O sistema agora usa `gemini-3-pro-image-preview` com prompt anti-distorção
- O prompt atual inclui: "Tooth size (same width, length)" e "CRITICAL: Maintain natural enamel texture"

**Avaliação**:
- **Já abordado** - As melhorias recentes devem resolver este problema
- Monitorar feedback contínuo

**Sugestão de implementação**:
Adicionar ao prompt do DSD uma instrução mais explícita:
```
PROPORTION CONSTRAINT:
- Keep original tooth width proportions
- Never make teeth appear thinner or narrower than original
- Only add/fill defects, do not reshape tooth contours
```

---

## Plano de Implementação

### Prioridade 1: Terminologia Correta (Alto Impacto)

**Arquivo**: `src/components/wizard/ReviewAnalysisStep.tsx`

Modificar o campo "Classe" para exibir opções contextuais baseadas no tipo de caso:
- Se indicação IA inclui "recontorno", "faceta", "estético" → Mostrar opções estéticas
- Caso contrário → Mostrar classes tradicionais (I-V)

**Lógica**:
```typescript
const isAestheticProcedure = (indication: string) => {
  const aestheticKeywords = ['faceta', 'recontorno', 'diastema', 'estético', 'harmonia'];
  return aestheticKeywords.some(kw => indication?.toLowerCase().includes(kw));
};
```

### Prioridade 2: Estratificação Avançada para Alta Estética

**Arquivo**: `supabase/functions/recommend-resin/index.ts`

Adicionar ao prompt uma seção condicional que é ativada quando `aestheticLevel === 'muito alto'`:
- Incluir tabela de referência de combinações de marcas
- Permitir que a IA sugira diferentes marcas por camada
- Manter respeito ao inventário do usuário como primeira opção

### Prioridade 3: Melhoria no Prompt DSD

**Arquivo**: `supabase/functions/generate-dsd/index.ts`

Adicionar constraint de proporção para evitar "emagrecimento" dos dentes:
```
CRITICAL PROPORTION RULE:
- Maintain original tooth width proportions
- Do NOT make teeth narrower or thinner
- Only correct defects, do not reshape contours
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/wizard/ReviewAnalysisStep.tsx` | Adicionar opções de "tipo de procedimento" estético |
| `supabase/functions/recommend-resin/index.ts` | Adicionar seção de estratificação avançada no prompt |
| `supabase/functions/generate-dsd/index.ts` | Adicionar constraint de proporção |
| `src/lib/schemas/evaluation.ts` | Expandir valores aceitos para `cavityClass` |

---

## O Que NÃO Modificar (Já Está Bom)

1. **Sistema de inventário** - Funciona bem, prioriza resinas do usuário
2. **Lógica de orçamento** - Respeita as faixas de preço corretamente
3. **Estrutura do protocolo de camadas** - A tabela visual está clara e informativa
4. **Modelo DSD atual** - O `gemini-3-pro-image-preview` está produzindo bons resultados

---

## Resumo das Mudanças

1. **Terminologia**: Adicionar "Faceta Direta", "Recontorno Estético" como opções além das classes I-V
2. **Estratificação**: Para casos "muito alto" estético, permitir combinação de marcas com guia de referência
3. **DSD**: Adicionar constraint explícito de manter proporções originais dos dentes
4. **Catálogo**: Verificar se resinas especializadas (Estelite MW, Empress BL-L) estão no banco

Estas mudanças são incrementais e não quebram a funcionalidade existente que está funcionando bem.
