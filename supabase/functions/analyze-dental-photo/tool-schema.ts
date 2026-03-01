import type { OpenAITool } from "../_shared/claude.ts";

// Tool definition for structured output - MULTI-TOOTH SUPPORT
export const ANALYZE_PHOTO_TOOL: OpenAITool[] = [
  {
    type: "function",
    function: {
      name: "analyze_dental_photo",
      description: "Retorna a análise estruturada de uma foto dental intraoral, detectando TODOS os dentes com problemas",
      parameters: {
        type: "object",
        properties: {
          detected: {
            type: "boolean",
            description: "Se foi possível detectar pelo menos um dente com problema na foto"
          },
          confidence: {
            type: "number",
            description: "Nível de confiança geral da análise de 0 a 100"
          },
          detected_teeth: {
            type: "array",
            description: "Lista de TODOS os dentes detectados com problemas, ordenados por prioridade",
            items: {
              type: "object",
              properties: {
                tooth: {
                  type: "string",
                  description: "Número do dente (notação FDI: 11-18, 21-28, 31-38, 41-48)"
                },
                tooth_region: {
                  type: "string",
                  enum: ["anterior-superior", "anterior-inferior", "posterior-superior", "posterior-inferior"],
                  description: "Região do dente na arcada",
                  nullable: true
                },
                cavity_class: {
                  type: "string",
                  enum: ["Classe I", "Classe II", "Classe III", "Classe IV", "Classe V", "Classe VI", "Fechamento de Diastema", "Recontorno Estético", "Faceta Direta", "Lente de Contato"],
                  description: "Classificação de Black da cavidade (Classes I-VI) OU procedimento estético sem cavidade cariosa (Fechamento de Diastema, Recontorno Estético, Faceta Direta, Lente de Contato). Use null para tratamentos protéticos (coroa, implante, endodontia).",
                  nullable: true
                },
                restoration_size: {
                  type: "string",
                  enum: ["Pequena", "Média", "Grande", "Extensa"],
                  description: "Tamanho estimado da restauração",
                  nullable: true
                },
                substrate: {
                  type: "string",
                  enum: ["Esmalte", "Dentina", "Esmalte e Dentina", "Dentina profunda"],
                  description: "Tipo de substrato principal visível",
                  nullable: true
                },
                substrate_condition: {
                  type: "string",
                  enum: ["Saudável", "Esclerótico", "Manchado", "Cariado", "Desidratado"],
                  description: "Condição do substrato dentário",
                  nullable: true
                },
                enamel_condition: {
                  type: "string",
                  enum: ["Íntegro", "Fraturado", "Hipoplásico", "Fluorose", "Erosão", "Restauração prévia", "Restauração prévia (faceta em resina)", "Restauração prévia (coroa)"],
                  description: "Condição do esmalte periférico. Use 'Restauração prévia' quando há evidência de restauração existente, 'Restauração prévia (faceta em resina)' para facetas vestibulares, 'Restauração prévia (coroa)' para coroas protéticas.",
                  nullable: true
                },
                depth: {
                  type: "string",
                  enum: ["Superficial", "Média", "Profunda"],
                  description: "Profundidade estimada da cavidade",
                  nullable: true
                },
                priority: {
                  type: "string",
                  enum: ["alta", "média", "baixa"],
                  description: "Prioridade de tratamento baseada na urgência clínica"
                },
                notes: {
                  type: "string",
                  description: "Observações específicas sobre este dente",
                  nullable: true
                },
                treatment_indication: {
                  type: "string",
                  enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento", "gengivoplastia", "recobrimento_radicular"],
                  description: "Tipo de tratamento indicado: resina (restauração direta), porcelana (faceta/laminado), coroa (coroa total), implante (extração + implante), endodontia (canal), encaminhamento (especialista), gengivoplastia (remoção de excesso gengival), recobrimento_radicular (cobertura de raiz exposta)"
                },
                indication_reason: {
                  type: "string",
                  description: "Razão detalhada da indicação de tratamento",
                  nullable: true
                },
                tooth_bounds: {
                  type: "object",
                  description: "Posição aproximada do dente na imagem, em porcentagem (0-100). SEMPRE forneça para o dente principal.",
                  properties: {
                    x: { type: "number", description: "Posição X do centro do dente (0-100%)" },
                    y: { type: "number", description: "Posição Y do centro do dente (0-100%)" },
                    width: { type: "number", description: "Largura aproximada do dente (0-100%)" },
                    height: { type: "number", description: "Altura aproximada do dente (0-100%)" }
                  },
                  required: ["x", "y", "width", "height"]
                },
                current_issue: {
                  type: "string",
                  description: "Problema estético identificado (ex: 'Restauração infiltrada com gap mesial de ~1mm')",
                  nullable: true
                },
                proposed_change: {
                  type: "string",
                  description: "Mudança proposta com medidas em mm (ex: 'Fechamento com resina composta ~1.5mm, harmonização com 21')",
                  nullable: true
                }
              },
              required: ["tooth", "priority", "treatment_indication"]
            }
          },
          primary_tooth: {
            type: "string",
            description: "Número do dente que deve ser tratado primeiro (mais urgente)",
            nullable: true
          },
          vita_shade: {
            type: "string",
            description: "Cor VITA geral da arcada (ex: A1, A2, A3, A3.5, B1, B2, C1, D2)",
            nullable: true
          },
          observations: {
            type: "array",
            items: { type: "string" },
            description: "Observações clínicas gerais sobre a arcada/foto"
          },
          warnings: {
            type: "array",
            items: { type: "string" },
            description: "Alertas ou pontos de atenção para o operador"
          },
          dsd_simulation_suitability: {
            type: "number",
            description: "Score 0-100: foto adequada para EDIÇÃO DE IMAGEM por IA? Fator dominante (60%): coroa COMPLETA de cada dente anterior visível (gengiva até incisal) sem obstrução labial. Se lábio cobre cervical/gengival dos dentes → MAX 50. Se laterais/caninos parcialmente escondidos → MAX 50. Afastador + coroas expostas = 85-100. Sorriso aberto, gengiva visível, nada coberto = 65-80. Lábio cobre cervical = 40-55. Lábios cobrem laterais = 30-45. Na dúvida → score MAIS BAIXO."
          },
          treatment_indication: {
            type: "string",
            enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento", "gengivoplastia", "recobrimento_radicular"],
            description: "Indicação GERAL predominante do caso (o tipo de tratamento mais relevante para a maioria dos dentes)"
          },
          indication_reason: {
            type: "string",
            description: "Razão detalhada da indicação de tratamento predominante"
          },

          // --- DSD aesthetic analysis fields ---
          facial_midline: {
            type: "string",
            enum: ["centrada", "desviada_esquerda", "desviada_direita"],
            description: "Posição da linha média facial em relação ao filtro labial"
          },
          dental_midline: {
            type: "string",
            enum: ["alinhada", "desviada_esquerda", "desviada_direita"],
            description: "Alinhamento da linha média dental em relação à facial"
          },
          smile_line: {
            type: "string",
            enum: ["alta", "média", "baixa"],
            description: "Classificação da linha do sorriso (exposição gengival)"
          },
          buccal_corridor: {
            type: "string",
            enum: ["adequado", "excessivo", "ausente"],
            description: "Corredor bucal (espaço escuro lateral ao sorrir)"
          },
          occlusal_plane: {
            type: "string",
            enum: ["nivelado", "inclinado_esquerda", "inclinado_direita"],
            description: "Plano oclusal em relação à linha bipupilar"
          },
          golden_ratio_compliance: {
            type: "number",
            description: "Aderência à proporção áurea (0-100). Mede a relação largura aparente central:lateral:canino"
          },
          symmetry_score: {
            type: "number",
            description: "Score de simetria bilateral do sorriso (0-100)"
          },
          lip_thickness: {
            type: "string",
            enum: ["fino", "médio", "volumoso"],
            description: "Espessura labial (influencia visibilidade dos dentes)"
          },
          overbite_suspicion: {
            type: "string",
            enum: ["sim", "não", "indeterminado"],
            description: "Suspeita de sobremordida excessiva baseada na foto"
          },
          smile_arc: {
            type: "string",
            enum: ["consonante", "plano", "reverso"],
            description: "Arco do sorriso em relação à curvatura do lábio inferior"
          },
          face_shape: {
            type: "string",
            enum: ["oval", "quadrado", "triangular", "retangular", "redondo"],
            description: "Formato do rosto (para visagismo). Requer foto facial.",
            nullable: true
          },
          perceived_temperament: {
            type: "string",
            enum: ["colérico", "sanguíneo", "melancólico", "fleumático", "misto"],
            description: "Temperamento percebido (visagismo). Requer foto facial.",
            nullable: true
          },
          recommended_tooth_shape: {
            type: "string",
            enum: ["quadrado", "oval", "triangular", "retangular", "natural"],
            description: "Formato de dente recomendado baseado no visagismo.",
            nullable: true
          },
          visagism_notes: {
            type: "string",
            description: "Notas sobre visagismo e personalidade dental. Requer foto facial.",
            nullable: true
          }
        },
        required: [
          "detected", "confidence", "detected_teeth", "observations", "warnings",
          "dsd_simulation_suitability",
          "facial_midline", "dental_midline", "smile_line", "buccal_corridor",
          "occlusal_plane", "golden_ratio_compliance", "symmetry_score",
          "lip_thickness", "overbite_suspicion", "smile_arc"
        ],
        additionalProperties: false
      }
    }
  }
];
