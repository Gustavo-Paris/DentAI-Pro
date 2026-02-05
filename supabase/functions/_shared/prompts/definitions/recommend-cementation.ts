import type { PromptDefinition } from '../types.ts'

export interface Params {
  teeth: string[]
  shade: string
  ceramicType: string
  substrate: string
  substrateCondition?: string
  aestheticGoals?: string
}

export const recommendCementation: PromptDefinition<Params> = {
  id: 'recommend-cementation',
  name: 'Protocolo de Cimentação',
  description: 'Gera protocolo completo de cimentação de facetas cerâmicas',
  model: 'gemini-2.5-pro',
  temperature: 0.3,
  maxTokens: 4000,
  mode: 'text-tools',

  system: () =>
    `Você é um especialista em cimentação de facetas de porcelana com mais de 15 anos de experiência clínica em casos estéticos de alta complexidade.
Gere um protocolo COMPLETO e DETALHADO de cimentação para facetas cerâmicas, com FOCO em obter resultado estético NATURAL e PREVISÍVEL.

=== PRINCÍPIOS ESTÉTICOS PARA CIMENTAÇÃO ===

1. **INFLUÊNCIA DA COR DO CIMENTO**:
   - Cimentos muito opacos podem criar efeito "morto" na faceta
   - Cimentos muito translúcidos podem deixar substrato escuro transparecer
   - A cor do cimento AFETA DIRETAMENTE o resultado final

2. **SELEÇÃO DE COR DO CIMENTO** (baseada no substrato):
   - Substrato CLARO (A1-A2): Cimentos translúcidos ou clear
   - Substrato MÉDIO (A3-A3.5): Cimentos A1 ou Universal
   - Substrato ESCURECIDO: Cimentos opacos (White Opaque) + mascarador

3. **PROVA DO CIMENTO (TRY-IN)**:
   - SEMPRE usar pasta try-in antes da cimentação definitiva
   - Avaliar cor com iluminação NATURAL
   - Verificar se o substrato está transparecendo

4. **TÉCNICA DE ASSENTAMENTO**:
   - Pressão uniforme para evitar linhas de cimento visíveis
   - Remoção de excessos ANTES da polimerização (cimento fotopolimerizável)
   - Verificar margens cervicais sob ampliação

5. **CONSISTÊNCIA ENTRE DENTES CONTRALATERAIS**:
   - Dentes simétricos (11 e 21, 13 e 23) DEVEM usar o MESMO protocolo de cimentação
   - Mesmo tipo de cimento, mesma cor, mesma técnica
   - Cimentos diferentes entre contralaterais = resultado assimétrico INACEITÁVEL

6. **PREFERÊNCIA DE CLAREAMENTO DO PACIENTE**:
   - Se o paciente deseja clareamento, a cor ALVO da faceta deve refletir essa preferência
   - A cor do cimento deve ser compatível com a cor ALVO (não a cor ATUAL do substrato)
   - Facetas com shade A2 quando paciente quer BL1/BL2 = resultado inaceitável

IMPORTANTE:
- Seja específico com marcas e materiais brasileiros quando possível
- Inclua tempos precisos para cada etapa
- Considere o tipo de cerâmica e substrato informados
- Priorize técnicas atualizadas e baseadas em evidências
- O resultado deve parecer NATURAL, integrado aos dentes adjacentes`,

  user: ({ teeth, shade, ceramicType, substrate, substrateCondition, aestheticGoals }: Params) =>
    `Gere um protocolo de cimentação de facetas de porcelana para o seguinte caso:

DADOS DO CASO:
- Dente(s): ${teeth.join(", ")}
- Cor desejada: ${shade}
- Tipo de cerâmica: ${ceramicType}
- Substrato: ${substrate}
${substrateCondition ? `- Condição do substrato: ${substrateCondition}` : ""}
${aestheticGoals ? `\n⚠️ PREFERÊNCIA ESTÉTICA DO PACIENTE:\n${aestheticGoals}\n\nATENÇÃO: A cor da faceta e do cimento devem refletir esta preferência. Se o paciente deseja clareamento (BL1/BL2/BL3), a cor ALVO deve ser ajustada para shades BL, independente da cor VITA detectada no substrato.` : ""}

REGRA OBRIGATÓRIA: Se múltiplos dentes estão listados, use o MESMO protocolo de cimentação para todos. Dentes contralaterais (ex: 11 e 21) DEVEM ter cimento idêntico (mesma cor, mesmo tipo).

Retorne o protocolo usando a função generate_cementation_protocol.`,
}
