import type { DetectedTooth, TreatmentType } from '@/components/wizard/ReviewAnalysisStep';
import { ANTERIOR_TEETH } from './constants';

export function isAnterior(tooth: string): boolean {
  return ANTERIOR_TEETH.includes(tooth);
}

/**
 * Infer the aesthetic cavity class when cavity_class is null.
 * Microdontia, diastema closure, and other aesthetic procedures don't have
 * a traditional Black's classification — but the recommend-resin edge function
 * requires a valid cavityClass string. This maps indication_reason → aesthetic class.
 */
export function inferCavityClass(
  toothData: DetectedTooth | undefined,
  fallback: string,
  treatmentType?: string,
): string {
  if (toothData?.cavity_class) return toothData.cavity_class;

  const reason = (toothData?.indication_reason || '').toLowerCase();
  if (reason.includes('lente') || reason.includes('contato')) {
    return 'Lente de Contato';
  }
  if (reason.includes('reanatomização') || reason.includes('microdontia') || reason.includes('volume') || reason.includes('conoide')) {
    return 'Recontorno Estético';
  }
  if (reason.includes('diastema') || reason.includes('espaçamento')) {
    return 'Fechamento de Diastema';
  }
  if (reason.includes('faceta')) {
    return 'Faceta Direta';
  }
  if (reason.includes('reparo') || reason.includes('substituição')) {
    return 'Reparo de Restauração';
  }
  if (reason.includes('desgaste') || reason.includes('incisal') || reason.includes('recontorno')) {
    return 'Recontorno Estético';
  }

  // When treatment is porcelana and fallback would be a Black's class, use Faceta Direta
  if (treatmentType === 'porcelana' && /^Classe\s/i.test(fallback)) {
    return 'Faceta Direta';
  }

  return fallback;
}

export function getFullRegion(tooth: string): string {
  const toothNum = parseInt(tooth);
  const isUpper = toothNum >= 10 && toothNum <= 28;
  if (isAnterior(tooth)) {
    return isUpper ? 'anterior-superior' : 'anterior-inferior';
  }
  return isUpper ? 'posterior-superior' : 'posterior-inferior';
}

export function getGenericProtocol(
  treatmentType: TreatmentType,
  tooth: string,
  toothData: DetectedTooth | undefined,
) {
  const protocols: Record<
    string,
    { summary: string; checklist: string[]; alerts: string[]; recommendations: string[] }
  > = {
    implante: {
      summary: `Dente ${tooth} indicado para extração e reabilitação com implante.`,
      checklist: [
        'Solicitar tomografia computadorizada cone beam',
        'Avaliar quantidade e qualidade óssea disponível',
        'Verificar espaço protético adequado',
        'Avaliar condição periodontal dos dentes adjacentes',
        'Planejar tempo de osseointegração',
        'Discutir opções de prótese provisória',
        'Encaminhar para cirurgião implantodontista',
        'Agendar retorno para acompanhamento',
      ],
      alerts: [
        'Avaliar contraindicações sistêmicas para cirurgia',
        'Verificar uso de bifosfonatos ou anticoagulantes',
        'Considerar enxerto ósseo se necessário',
      ],
      recommendations: [
        'Manter higiene oral adequada',
        'Evitar fumar durante o tratamento',
        'Seguir orientações pré e pós-operatórias',
      ],
    },
    coroa: {
      summary: `Dente ${tooth} indicado para restauração com coroa total.`,
      checklist: [
        'Realizar preparo coronário seguindo princípios biomecânicos',
        'Avaliar necessidade de núcleo/pino intrarradicular',
        'Selecionar material da coroa (metal-cerâmica, cerâmica pura, zircônia)',
        'Moldagem de trabalho',
        'Confecção de provisório adequado',
        'Prova da infraestrutura',
        'Seleção de cor com escala VITA',
        'Cimentação definitiva',
        'Ajuste oclusal',
        'Orientações de higiene',
      ],
      alerts: [
        'Verificar saúde pulpar antes do preparo',
        'Avaliar relação coroa-raiz',
        'Considerar tratamento periodontal prévio se necessário',
      ],
      recommendations: [
        'Proteger o provisório durante a espera',
        'Evitar alimentos duros e pegajosos',
      ],
    },
    endodontia: {
      summary: `Dente ${tooth} necessita de tratamento endodôntico antes de restauração definitiva.`,
      checklist: [
        'Confirmar diagnóstico pulpar',
        'Solicitar radiografia periapical',
        'Avaliar anatomia radicular',
        'Planejamento do acesso endodôntico',
        'Instrumentação e irrigação dos canais',
        'Medicação intracanal se necessário',
        'Obturação dos canais radiculares',
        'Radiografia de controle pós-obturação',
        'Agendar restauração definitiva',
        'Orientar retorno se houver dor ou inchaço',
      ],
      alerts: [
        'Avaliar necessidade de retratamento',
        'Verificar presença de lesão periapical',
        'Considerar encaminhamento para especialista em casos complexos',
      ],
      recommendations: [
        'Evitar mastigar do lado tratado até restauração definitiva',
        'Retornar imediatamente se houver dor intensa ou inchaço',
      ],
    },
    encaminhamento: (() => {
      const reason = (toothData?.indication_reason || '').toLowerCase();
      let specialty = '';
      if (reason.includes('apinhamento') || reason.includes('ortodon') || reason.includes('maloclusão') || reason.includes('alinhamento')) {
        specialty = 'Ortodontia';
      } else if (reason.includes('canal') || reason.includes('pulp') || reason.includes('periapical') || reason.includes('endodon')) {
        specialty = 'Endodontia';
      } else if (reason.includes('perio') || reason.includes('gengiv') || reason.includes('bolsa') || reason.includes('retração')) {
        specialty = 'Periodontia';
      } else if (reason.includes('implante') || reason.includes('cirurg') || reason.includes('extração') || reason.includes('terceiro molar')) {
        specialty = 'Cirurgia Bucomaxilofacial';
      } else if (reason.includes('dtm') || reason.includes('atm') || reason.includes('articulação')) {
        specialty = 'DTM/Dor Orofacial';
      }

      const specialtyChecklist: Record<string, string[]> = {
        'Ortodontia': [
          'Documentar achados clínicos e fotografias intra/extraorais',
          'Solicitar radiografia panorâmica e cefalometria lateral',
          'Solicitar modelos de estudo ou escaneamento digital',
          `Encaminhar para Ortodontia — motivo: ${toothData?.indication_reason || 'correção de posicionamento'}`,
          'Informar ao ortodontista sobre o plano restaurador estético em andamento',
          'Coordenar timing: alinhamento ortodôntico antes de finalizar restaurações anteriores',
          'Orientar paciente sobre duração estimada e etapas do tratamento ortodôntico',
          'Agendar retorno para acompanhamento e reavaliação do plano restaurador',
        ],
        'Endodontia': [
          'Documentar achados clínicos e teste de vitalidade pulpar',
          'Solicitar radiografia periapical do dente',
          `Encaminhar para Endodontia — motivo: ${toothData?.indication_reason || 'comprometimento pulpar'}`,
          'Informar ao endodontista sobre plano restaurador pós-tratamento',
          'Orientar paciente sobre próximos passos',
          'Agendar retorno para restauração definitiva após tratamento endodôntico',
        ],
        'Periodontia': [
          'Documentar achados clínicos e profundidade de sondagem',
          'Solicitar radiografia periapical ou panorâmica',
          `Encaminhar para Periodontia — motivo: ${toothData?.indication_reason || 'comprometimento periodontal'}`,
          'Informar ao periodontista sobre plano restaurador',
          'Orientar paciente sobre importância do controle periodontal',
          'Agendar retorno para reavaliação após tratamento periodontal',
        ],
      };

      const specialtyRecommendations: Record<string, string[]> = {
        'Ortodontia': [
          'Levar exames radiográficos e relatório clínico ao ortodontista',
          'Estabilidade oclusal a longo prazo depende do alinhamento prévio',
          'Informar sobre medicamentos em uso e expectativas estéticas',
        ],
        'Endodontia': [
          'Levar radiografias e relatório ao endodontista',
          'Retornar imediatamente se houver dor intensa ou inchaço',
          'Evitar mastigar do lado tratado até restauração definitiva',
        ],
        'Periodontia': [
          'Levar exames e relatório ao periodontista',
          'Manter higiene bucal rigorosa durante o tratamento',
          'Retornar para controle periodontal trimestral',
        ],
      };

      const checklist = specialtyChecklist[specialty] || [
        'Documentar achados clínicos',
        'Realizar radiografias necessárias',
        'Preparar relatório para o especialista',
        specialty ? `Encaminhar para ${specialty}` : 'Identificar especialidade adequada',
        'Orientar paciente sobre próximos passos',
        'Agendar retorno para acompanhamento',
      ];

      const recommendations = specialtyRecommendations[specialty] || [
        'Levar exames e relatório ao especialista',
        'Informar sobre medicamentos em uso',
      ];

      const specialtyText = specialty ? ` Sugestão de encaminhamento: **${specialty}**.` : '';
      return {
        summary: `Dente ${tooth} requer avaliação especializada.${specialtyText}`,
        checklist,
        alerts: [
          'Urgência do encaminhamento depende do diagnóstico',
          'Manter comunicação com especialista',
        ],
        recommendations,
      };
    })(),
    gengivoplastia: {
      summary: `Gengivoplastia estética indicada pelo DSD para harmonização do sorriso.`,
      checklist: [
        'Avaliação periodontal completa (sondagem, radiografias)',
        'Planejamento cirúrgico baseado na análise DSD',
        'Anestesia local infiltrativa',
        'Marcação dos zênites gengivais com sonda milimetrada',
        'Incisão com bisturi lâmina 15C seguindo o planejamento',
        'Remoção de tecido gengival excedente',
        'Osteotomia/osteoplastia se necessário (aumento de coroa clínica)',
        'Sutura (se necessário) com fio 5-0 ou 6-0',
        'Aplicação de cimento cirúrgico',
        'Prescrição: analgésico + anti-inflamatório + bochecho clorexidina 0,12%',
        'Remoção de sutura em 7-10 dias',
        'Aguardar cicatrização completa (3-6 semanas) antes de restaurações definitivas',
        'Reavaliação e moldagem para restaurações após cicatrização',
      ],
      alerts: [
        'Contraindicar em pacientes com periodontite ativa não tratada',
        'Avaliar biotipo gengival (fino vs espesso) para escolha de técnica',
        'Verificar distância biológica antes de planejar ressecção',
        'Considerar gengivoplastia bilateral para simetria',
      ],
      recommendations: [
        'Manter higiene oral rigorosa durante cicatrização',
        'Evitar alimentos duros e picantes por 7 dias',
        'Não escovar a região operada por 48h',
        'Retornar imediatamente se houver sangramento excessivo',
      ],
    },
  };

  const protocol = protocols[treatmentType] || protocols.encaminhamento;

  return {
    treatment_type: treatmentType,
    tooth,
    ai_reason: toothData?.indication_reason || null,
    ...protocol,
  };
}
