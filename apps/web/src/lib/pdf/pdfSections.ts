import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PDFData } from '@/types/protocol';
import { getConfidenceConfig } from '@/lib/confidence-config';
import { logger } from '@/lib/logger';
import type { PDFRenderContext } from './pdfHelpers';
import { addText, addLine, checkPageBreak, drawCheckbox, drawProgressBar, sanitizeText } from './pdfHelpers';

// ============ PAGE 1: HEADER ============
export function renderHeader(ctx: PDFRenderContext, data: PDFData) {
  const { pdf, pageWidth, margin } = ctx;

  // Gradient-like header background
  pdf.setFillColor(37, 99, 235); // Primary blue
  pdf.rect(0, 0, pageWidth, 38, 'F');

  // Decorative accent
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 35, pageWidth, 3, 'F');

  // Clinic logo on left (if available)
  let headerTextStartX = margin;
  if (data.clinicLogo) {
    try {
      pdf.addImage(data.clinicLogo, 'PNG', margin, 6, 26, 26);
      headerTextStartX = margin + 30;
    } catch (e) {
      logger.warn('Could not add clinic logo to PDF:', e);
    }
  }

  // Title and subtitle (adjusted for logo)
  if (data.clinicName) {
    addText(ctx, sanitizeText(data.clinicName), headerTextStartX, 12, { fontSize: 14, fontStyle: 'bold', color: [255, 255, 255] });
    addText(ctx, 'ToSmile.ai - Protocolo de Restauracao Estetica', headerTextStartX, 20, { fontSize: 9, color: [42, 157, 143] });
  } else {
    addText(ctx, 'ToSmile.ai', headerTextStartX, 14, { fontSize: 20, fontStyle: 'bold', color: [255, 255, 255] });
    addText(ctx, 'Protocolo de Restauracao Estetica', headerTextStartX, 22, { fontSize: 11, color: [191, 219, 254] });
  }

  // Date and professional info on right
  const dateStr = format(new Date(data.createdAt), "dd/MM/yyyy", { locale: ptBR });
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text(dateStr, pageWidth - margin, 14, { align: 'right' });

  if (data.dentistName) {
    pdf.setFontSize(10);
    pdf.text(sanitizeText(data.dentistName), pageWidth - margin, 21, { align: 'right' });
  }
  if (data.dentistCRO) {
    pdf.setFontSize(9);
    pdf.setTextColor(191, 219, 254);
    pdf.text(`CRO: ${sanitizeText(data.dentistCRO)}`, pageWidth - margin, 28, { align: 'right' });
  }

  ctx.y = 48;
}

// ============ PATIENT IDENTIFICATION ============
export function renderPatientId(ctx: PDFRenderContext, data: PDFData) {
  if (!data.patientName) return;

  const { pdf, margin, contentWidth } = ctx;

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, ctx.y, contentWidth, 12, 2, 2, 'F');
  addText(ctx, 'Paciente:', margin + 4, ctx.y + 7, { fontSize: 9, color: [100, 100, 100] });
  addText(ctx, data.patientName, margin + 28, ctx.y + 7, { fontSize: 10, fontStyle: 'bold' });
  ctx.y += 18;
}

// ============ CASE SUMMARY GRID ============
export function renderCaseSummary(ctx: PDFRenderContext, data: PDFData) {
  const { pdf, margin, contentWidth } = ctx;

  addText(ctx, 'RESUMO DO CASO', margin, ctx.y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 6;

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, ctx.y, contentWidth, 34, 2, 2, 'F');

  const col1 = margin + 5;
  const col2 = margin + contentWidth / 3;
  const col3 = margin + (contentWidth / 3) * 2;

  ctx.y += 7;

  // Row 1
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Idade', col1, ctx.y);
  pdf.text('Dente', col2, ctx.y);
  pdf.text('Regiao', col3, ctx.y);

  ctx.y += 4;
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.patientAge} anos`, col1, ctx.y);
  pdf.text(data.tooth, col2, ctx.y);
  pdf.text(data.region, col3, ctx.y);

  ctx.y += 8;

  // Row 2
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Classe', col1, ctx.y);
  pdf.text('Tamanho', col2, ctx.y);
  pdf.text('Cor', col3, ctx.y);

  ctx.y += 4;
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.cavityClass, col1, ctx.y);
  pdf.text(data.restorationSize, col2, ctx.y);
  pdf.text(data.toothColor, col3, ctx.y);

  ctx.y += 8;

  // Row 3 - Badges
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  let badgeX = col1;

  // Aesthetic level badge
  pdf.setFillColor(219, 234, 254);
  pdf.roundedRect(badgeX, ctx.y - 3, 28, 6, 1, 1, 'F');
  pdf.setTextColor(30, 64, 175);
  pdf.text(data.aestheticLevel, badgeX + 2, ctx.y);
  badgeX += 32;

  // Bruxism badge
  if (data.bruxism) {
    pdf.setFillColor(254, 226, 226);
    pdf.roundedRect(badgeX, ctx.y - 3, 18, 6, 1, 1, 'F');
    pdf.setTextColor(185, 28, 28);
    pdf.text('Bruxismo', badgeX + 2, ctx.y);
    badgeX += 22;
  }

  // Stratification badge
  if (data.stratificationNeeded) {
    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(badgeX, ctx.y - 3, 25, 6, 1, 1, 'F');
    pdf.setTextColor(22, 101, 52);
    pdf.text('Estratificacao', badgeX + 2, ctx.y);
  }

  // From inventory badge
  if (data.isFromInventory) {
    pdf.setFillColor(254, 249, 195);
    pdf.roundedRect(badgeX + 30, ctx.y - 3, 22, 6, 1, 1, 'F');
    pdf.setTextColor(133, 77, 14);
    pdf.text('No Estoque', badgeX + 32, ctx.y);
  }

  ctx.y += 15;
}

// ============ MAIN RECOMMENDATION ============
export function renderResinRecommendation(ctx: PDFRenderContext, data: PDFData) {
  if (!data.resin) return;

  const { pdf, margin, contentWidth, pageWidth } = ctx;

  checkPageBreak(ctx, 45);

  addText(ctx, 'RESINA RECOMENDADA', margin, ctx.y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 6;

  // Main card with gradient effect
  pdf.setFillColor(22, 163, 74); // Green
  pdf.roundedRect(margin, ctx.y, contentWidth, 28, 3, 3, 'F');

  // Lighter accent stripe
  pdf.setFillColor(34, 197, 94);
  pdf.rect(margin, ctx.y, 4, 28);

  ctx.y += 8;
  addText(ctx, data.resin.name, margin + 8, ctx.y, { fontSize: 14, fontStyle: 'bold', color: [255, 255, 255] });

  // Manufacturer on right
  pdf.setFontSize(10);
  pdf.setTextColor(187, 247, 208);
  pdf.text(data.resin.manufacturer, pageWidth - margin - 5, ctx.y, { align: 'right' });

  ctx.y += 6;

  // Technical specs inline
  const specs = [
    `Tipo: ${data.resin.type}`,
    `Opacidade: ${data.resin.opacity}`,
    `Resistencia: ${data.resin.resistance}`,
  ].join('  \u2022  ');
  addText(ctx, specs, margin + 8, ctx.y, { fontSize: 8, color: [187, 247, 208] });

  ctx.y += 5;
  const specs2 = [
    `Polimento: ${data.resin.polishing}`,
    `Estetica: ${data.resin.aesthetics}`,
  ].join('  \u2022  ');
  addText(ctx, specs2, margin + 8, ctx.y, { fontSize: 8, color: [187, 247, 208] });

  ctx.y += 12;

  // Justification
  if (data.recommendationText) {
    pdf.setFillColor(248, 250, 252);
    const justificationLines = pdf.splitTextToSize(data.recommendationText, contentWidth - 10);
    const justificationHeight = Math.max(justificationLines.length * 4 + 8, 16);
    pdf.roundedRect(margin, ctx.y, contentWidth, justificationHeight, 2, 2, 'F');

    ctx.y += 5;
    addText(ctx, 'Justificativa da IA:', margin + 5, ctx.y, { fontSize: 8, fontStyle: 'bold', color: [100, 100, 100] });
    ctx.y += 4;
    addText(ctx, data.recommendationText, margin + 5, ctx.y, { fontSize: 8, color: [60, 60, 60], maxWidth: contentWidth - 10 });
    ctx.y += justificationHeight - 5;
  }

  ctx.y += 8;
}

// ============ DSD ANALYSIS ============
export function renderDSDAnalysis(ctx: PDFRenderContext, data: PDFData) {
  if (!data.dsdAnalysis) return;

  const { pdf, margin, contentWidth } = ctx;

  checkPageBreak(ctx, 60);

  addText(ctx, 'PLANEJAMENTO DIGITAL DO SORRISO (DSD)', margin, ctx.y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 7;

  // Scores section
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, ctx.y, contentWidth, 22, 2, 2, 'F');

  const scoreCol1 = margin + 5;
  const scoreCol2 = margin + contentWidth / 2 + 5;

  ctx.y += 6;

  // Golden Ratio
  if (data.dsdAnalysis.golden_ratio_compliance !== undefined) {
    addText(ctx, 'Proporcao Dourada', scoreCol1, ctx.y, { fontSize: 8, color: [100, 100, 100] });
    const grScore = data.dsdAnalysis.golden_ratio_compliance;
    const grColor: [number, number, number] = grScore >= 80 ? [22, 163, 74] : grScore >= 60 ? [202, 138, 4] : [220, 38, 38];
    drawProgressBar(ctx, scoreCol1 + 40, ctx.y - 2, 40, grScore, grColor);
    addText(ctx, `${grScore}%`, scoreCol1 + 85, ctx.y, { fontSize: 9, fontStyle: 'bold', color: grColor });
  }

  // Symmetry
  if (data.dsdAnalysis.symmetry_score !== undefined) {
    addText(ctx, 'Simetria', scoreCol2, ctx.y, { fontSize: 8, color: [100, 100, 100] });
    const symScore = data.dsdAnalysis.symmetry_score;
    const symColor: [number, number, number] = symScore >= 80 ? [22, 163, 74] : symScore >= 60 ? [202, 138, 4] : [220, 38, 38];
    drawProgressBar(ctx, scoreCol2 + 25, ctx.y - 2, 40, symScore, symColor);
    addText(ctx, `${symScore}%`, scoreCol2 + 70, ctx.y, { fontSize: 9, fontStyle: 'bold', color: symColor });
  }

  ctx.y += 10;

  // DSD Parameters grid
  const dsdParams = [
    { label: 'Linha Media Facial', value: data.dsdAnalysis.facial_midline },
    { label: 'Linha Media Dental', value: data.dsdAnalysis.dental_midline },
    { label: 'Linha do Sorriso', value: data.dsdAnalysis.smile_line },
    { label: 'Corredor Bucal', value: data.dsdAnalysis.buccal_corridor },
  ].filter(p => p.value);

  if (dsdParams.length > 0) {
    let paramX = margin + 5;

    dsdParams.forEach((param, i) => {
      if (i === 2) {
        paramX = margin + 5;
        ctx.y += 5;
      }
      addText(ctx, `${param.label}: `, paramX, ctx.y, { fontSize: 8, color: [100, 100, 100] });
      addText(ctx, param.value || '-', paramX + 38, ctx.y, { fontSize: 8, fontStyle: 'bold' });
      if (i % 2 === 0) paramX = scoreCol2;
    });
  }

  ctx.y += 10;
}

// ============ PROTOCOL LAYERS TABLE ============
export function renderProtocolTable(ctx: PDFRenderContext, data: PDFData) {
  if (data.layers.length === 0) return;

  const { pdf, margin, contentWidth } = ctx;

  checkPageBreak(ctx, 50);

  addText(ctx, 'PROTOCOLO DE CAMADAS', margin, ctx.y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 6;

  // Table header
  pdf.setFillColor(37, 99, 235);
  pdf.roundedRect(margin, ctx.y, contentWidth, 8, 1, 1, 'F');

  const colWidths = [32, 42, 20, 22, contentWidth - 116];
  const cols = [margin + 2, margin + 34, margin + 76, margin + 96, margin + 118];

  ctx.y += 5;
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Camada', cols[0], ctx.y);
  pdf.text('Resina', cols[1], ctx.y);
  pdf.text('Cor', cols[2], ctx.y);
  pdf.text('Espessura', cols[3], ctx.y);
  pdf.text('Tecnica', cols[4], ctx.y);

  ctx.y += 5;

  // Table rows
  data.layers.forEach((layer, index) => {
    checkPageBreak(ctx, 14);

    pdf.setFontSize(7);
    const layerName = `${layer.order}. ${layer.name}`;
    const layerLines = pdf.splitTextToSize(layerName, colWidths[0] - 2);
    const techniqueLines = pdf.splitTextToSize(layer.technique || '-', colWidths[4] - 2);

    const maxLines = Math.max(layerLines.length, techniqueLines.length);
    const rowHeight = Math.max(8, maxLines * 3.5 + 3);

    // Zebra striping with layer-type colors
    let bgColor: [number, number, number] = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    const layerLower = layer.name.toLowerCase();
    if (layerLower.includes('opaco') || layerLower.includes('opaquer')) {
      bgColor = [254, 243, 199]; // Amber light
    } else if (layerLower.includes('dentina') || layerLower.includes('dentin')) {
      bgColor = [254, 226, 226]; // Red light
    } else if (layerLower.includes('esmalte') || layerLower.includes('enamel')) {
      bgColor = [219, 234, 254]; // Blue light
    }

    pdf.setFillColor(...bgColor);
    pdf.rect(margin, ctx.y - 2, contentWidth, rowHeight, 'F');

    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);

    pdf.text(layerLines, cols[0], ctx.y + 1);
    pdf.text(pdf.splitTextToSize(layer.resin_brand || '-', colWidths[1] - 2), cols[1], ctx.y + 1);
    pdf.text(layer.shade || '-', cols[2], ctx.y + 1);
    pdf.text(layer.thickness || '-', cols[3], ctx.y + 1);
    pdf.text(techniqueLines, cols[4], ctx.y + 1);

    ctx.y += rowHeight;
  });

  ctx.y += 8;
}

// ============ SIMPLIFIED ALTERNATIVE ============
export function renderAlternative(ctx: PDFRenderContext, data: PDFData) {
  if (!data.alternative) return;

  const { pdf, margin, contentWidth } = ctx;

  checkPageBreak(ctx, 28);

  addText(ctx, 'ALTERNATIVA SIMPLIFICADA', margin, ctx.y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 6;

  pdf.setFillColor(254, 249, 195); // Amber light
  pdf.roundedRect(margin, ctx.y, contentWidth, 20, 2, 2, 'F');

  // Left accent
  pdf.setFillColor(245, 158, 11);
  pdf.rect(margin, ctx.y, 3, 20);

  ctx.y += 6;
  addText(ctx, `${data.alternative.resin} - ${data.alternative.shade}`, margin + 8, ctx.y, { fontSize: 10, fontStyle: 'bold', color: [146, 64, 14] });
  ctx.y += 5;
  addText(ctx, `Tecnica: ${data.alternative.technique}`, margin + 8, ctx.y, { fontSize: 8, color: [133, 77, 14] });
  ctx.y += 5;
  addText(ctx, `Trade-off: ${data.alternative.tradeoff}`, margin + 8, ctx.y, { fontSize: 7, color: [120, 80, 40], maxWidth: contentWidth - 15 });

  ctx.y += 12;
}

// ============ CHECKLIST ============
export function renderChecklist(ctx: PDFRenderContext, data: PDFData) {
  if (data.checklist.length === 0) return;

  const { pdf, margin, contentWidth } = ctx;

  checkPageBreak(ctx, 40);

  addText(ctx, 'PASSO A PASSO', margin, ctx.y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 6;

  pdf.setFillColor(248, 250, 252);
  const checklistHeight = Math.min(data.checklist.length * 7 + 6, 80);
  pdf.roundedRect(margin, ctx.y, contentWidth, checklistHeight, 2, 2, 'F');

  ctx.y += 5;

  data.checklist.forEach((item, index) => {
    checkPageBreak(ctx, 8);

    drawCheckbox(ctx, margin + 4, ctx.y);
    addText(ctx, `${index + 1}. ${item}`, margin + 12, ctx.y, { fontSize: 8, color: [60, 60, 60], maxWidth: contentWidth - 20 });
    ctx.y += 6;
  });

  ctx.y += 6;
}

// ============ CEMENTATION PROTOCOL (for porcelain) ============
export function renderCementationProtocol(ctx: PDFRenderContext, data: PDFData) {
  if (data.treatmentType !== 'porcelana' || !data.cementationProtocol) return;

  const { pdf, margin, contentWidth } = ctx;
  const cementProtocol = data.cementationProtocol;

  checkPageBreak(ctx, 30);
  addText(ctx, 'PROTOCOLO DE CIMENTACAO DE FACETAS', margin, ctx.y, { fontSize: 11, fontStyle: 'bold', color: [202, 138, 4] });
  ctx.y += 7;

  // Ceramic Treatment
  if (cementProtocol.ceramic_treatment && cementProtocol.ceramic_treatment.length > 0) {
    checkPageBreak(ctx, 25);
    addText(ctx, 'Tratamento da Ceramica', margin, ctx.y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
    ctx.y += 5;

    pdf.setFillColor(254, 243, 199);
    const ceramicHeight = cementProtocol.ceramic_treatment.length * 7 + 4;
    pdf.roundedRect(margin, ctx.y, contentWidth, ceramicHeight, 2, 2, 'F');
    ctx.y += 4;

    cementProtocol.ceramic_treatment.sort((a, b) => a.order - b.order).forEach((step) => {
      addText(ctx, `${step.order}. ${step.step}`, margin + 4, ctx.y, { fontSize: 8, fontStyle: 'bold' });
      addText(ctx, `(${step.material}${step.time ? ` - ${step.time}` : ''})`, margin + 80, ctx.y, { fontSize: 7, color: [100, 100, 100] });
      ctx.y += 6;
    });
    ctx.y += 6;
  }

  // Tooth Treatment
  if (cementProtocol.tooth_treatment && cementProtocol.tooth_treatment.length > 0) {
    checkPageBreak(ctx, 25);
    addText(ctx, 'Tratamento do Dente', margin, ctx.y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
    ctx.y += 5;

    pdf.setFillColor(219, 234, 254);
    const toothHeight = cementProtocol.tooth_treatment.length * 7 + 4;
    pdf.roundedRect(margin, ctx.y, contentWidth, toothHeight, 2, 2, 'F');
    ctx.y += 4;

    cementProtocol.tooth_treatment.sort((a, b) => a.order - b.order).forEach((step) => {
      addText(ctx, `${step.order}. ${step.step}`, margin + 4, ctx.y, { fontSize: 8, fontStyle: 'bold' });
      addText(ctx, `(${step.material}${step.time ? ` - ${step.time}` : ''})`, margin + 80, ctx.y, { fontSize: 7, color: [100, 100, 100] });
      ctx.y += 6;
    });
    ctx.y += 6;
  }

  // Cementation details
  checkPageBreak(ctx, 30);
  addText(ctx, 'Cimentacao', margin, ctx.y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 5;

  pdf.setFillColor(220, 252, 231);
  pdf.roundedRect(margin, ctx.y, contentWidth, 24, 2, 2, 'F');

  ctx.y += 6;
  const cementCol1 = margin + 5;
  const cementCol2 = margin + contentWidth / 2;

  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Cimento', cementCol1, ctx.y);
  pdf.text('Cor', cementCol2, ctx.y);
  ctx.y += 4;
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(cementProtocol.cementation.cement_brand, cementCol1, ctx.y);
  pdf.text(cementProtocol.cementation.shade, cementCol2, ctx.y);

  ctx.y += 6;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Fotopolimerizacao', cementCol1, ctx.y);
  pdf.text('Tipo', cementCol2, ctx.y);
  ctx.y += 4;
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(cementProtocol.cementation.light_curing_time, cementCol1, ctx.y);
  pdf.text(cementProtocol.cementation.cement_type, cementCol2, ctx.y);

  ctx.y += 10;

  // Finishing
  if (cementProtocol.finishing && cementProtocol.finishing.length > 0) {
    checkPageBreak(ctx, 20);
    addText(ctx, 'Acabamento e Polimento', margin, ctx.y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
    ctx.y += 5;

    cementProtocol.finishing.sort((a, b) => a.order - b.order).forEach((step) => {
      addText(ctx, `${step.order}. ${step.step} - ${step.material}`, margin + 4, ctx.y, { fontSize: 8 });
      ctx.y += 5;
    });
    ctx.y += 4;
  }

  // Post-operative
  if (cementProtocol.post_operative && cementProtocol.post_operative.length > 0) {
    checkPageBreak(ctx, 20);
    addText(ctx, 'Orientacoes Pos-operatorias', margin, ctx.y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
    ctx.y += 5;

    cementProtocol.post_operative.forEach((item) => {
      addText(ctx, `\u2022 ${item}`, margin + 4, ctx.y, { fontSize: 7, color: [60, 60, 60], maxWidth: contentWidth - 10 });
      ctx.y += 5;
    });
    ctx.y += 4;
  }
}

// ============ ALERTS & WARNINGS ============
export function renderAlertsWarnings(ctx: PDFRenderContext, data: PDFData) {
  if (data.alerts.length === 0 && data.warnings.length === 0) return;

  const { pdf, margin, contentWidth } = ctx;

  checkPageBreak(ctx, 35);

  const halfWidth = (contentWidth - 6) / 2;
  const startY = ctx.y;

  // Alerts (left side)
  if (data.alerts.length > 0) {
    addText(ctx, 'ALERTAS', margin, ctx.y, { fontSize: 9, fontStyle: 'bold', color: [202, 138, 4] });

    let alertY = ctx.y + 5;
    pdf.setFillColor(254, 249, 195);
    const alertHeight = Math.min(data.alerts.length * 8 + 6, 40);
    pdf.roundedRect(margin, alertY, halfWidth, alertHeight, 2, 2, 'F');

    alertY += 4;
    data.alerts.forEach((alert) => {
      const alertLines = pdf.splitTextToSize(`\u2022 ${alert}`, halfWidth - 6);
      addText(ctx, alertLines[0], margin + 3, alertY, { fontSize: 7, color: [133, 77, 14] });
      alertY += 7;
    });
  }

  // Warnings (right side)
  if (data.warnings.length > 0) {
    addText(ctx, 'O QUE NAO FAZER', margin + halfWidth + 6, startY, { fontSize: 9, fontStyle: 'bold', color: [220, 38, 38] });

    let warningY = startY + 5;
    pdf.setFillColor(254, 226, 226);
    const warningHeight = Math.min(data.warnings.length * 8 + 6, 40);
    pdf.roundedRect(margin + halfWidth + 6, warningY, halfWidth, warningHeight, 2, 2, 'F');

    warningY += 4;
    data.warnings.forEach((warning) => {
      const warningLines = pdf.splitTextToSize(`\u2022 ${warning}`, halfWidth - 6);
      addText(ctx, warningLines[0], margin + halfWidth + 9, warningY, { fontSize: 7, color: [153, 27, 27] });
      warningY += 7;
    });
  }

  ctx.y += Math.max(data.alerts.length, data.warnings.length) * 8 + 20;
}

// ============ IDEAL RESIN (when different) ============
export function renderIdealResin(ctx: PDFRenderContext, data: PDFData) {
  if (!data.idealResin || !data.resin || data.idealResin.name === data.resin.name) return;

  const { pdf, margin, contentWidth, pageWidth } = ctx;

  checkPageBreak(ctx, 25);

  addText(ctx, 'OPCAO IDEAL (fora do estoque)', margin, ctx.y, { fontSize: 10, fontStyle: 'bold', color: [100, 100, 100] });
  ctx.y += 5;

  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(margin, ctx.y, contentWidth, 16, 2, 2, 'F');

  ctx.y += 5;
  addText(ctx, data.idealResin.name, margin + 5, ctx.y, { fontSize: 9, fontStyle: 'bold' });
  addText(ctx, data.idealResin.manufacturer, pageWidth - margin - 5, ctx.y, { fontSize: 8, color: [100, 100, 100], align: 'right' });

  if (data.idealReason) {
    ctx.y += 5;
    addText(ctx, data.idealReason, margin + 5, ctx.y, { fontSize: 7, color: [100, 100, 100], maxWidth: contentWidth - 10 });
  }

  ctx.y += 14;
}

// ============ CONFIDENCE INDICATOR ============
export function renderConfidence(ctx: PDFRenderContext, data: PDFData) {
  if (!data.confidence) return;

  const { pdf, margin } = ctx;

  checkPageBreak(ctx, 15);

  const conf = getConfidenceConfig(data.confidence);

  pdf.setFillColor(...conf.pdfBgColor);
  pdf.roundedRect(margin, ctx.y, 60, 10, 2, 2, 'F');
  addText(ctx, `Confianca: ${conf.pdfLabel}`, margin + 5, ctx.y + 6, { fontSize: 9, fontStyle: 'bold', color: conf.pdfColor });

  ctx.y += 18;
}

// ============ SIGNATURE AREA ============
export function renderSignature(ctx: PDFRenderContext, data: PDFData) {
  const { pdf, margin, contentWidth } = ctx;

  checkPageBreak(ctx, 40);

  addText(ctx, 'VALIDACAO PROFISSIONAL', margin, ctx.y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 8;

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, ctx.y, contentWidth, 32, 2, 2, 'F');

  const sigCol1 = margin + 15;
  const sigCol2 = margin + contentWidth / 2 + 15;

  ctx.y += 18;

  // Signature lines
  addLine(ctx, ctx.y, [180, 180, 180]);
  pdf.line(sigCol1, ctx.y, sigCol1 + 60, ctx.y);
  pdf.line(sigCol2, ctx.y, sigCol2 + 60, ctx.y);

  ctx.y += 5;
  addText(ctx, 'Assinatura do Profissional', sigCol1 + 10, ctx.y, { fontSize: 7, color: [120, 120, 120] });
  addText(ctx, 'Data de Execucao', sigCol2 + 15, ctx.y, { fontSize: 7, color: [120, 120, 120] });

  if (data.dentistName) {
    ctx.y += 4;
    addText(ctx, data.dentistName, sigCol1 + 10, ctx.y, { fontSize: 8, color: [80, 80, 80] });
  }

  ctx.y += 15;
}

// ============ FOOTER ============
export function renderFooter(ctx: PDFRenderContext, _data: PDFData) {
  const { pdf, pageWidth, pageHeight, contentWidth } = ctx;

  const footerY = pageHeight - 18;

  addLine(ctx, footerY - 8, [200, 200, 200]);

  pdf.setFontSize(6);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont('helvetica', 'italic');
  const disclaimer = 'Este planejamento foi gerado por Inteligencia Artificial e serve como ferramenta de apoio a decisao clinica. Nao substitui uma avaliacao clinica criteriosa realizada por Cirurgiao-Dentista.';
  const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth);
  pdf.text(disclaimerLines, pageWidth / 2, footerY - 4, { align: 'center' });

  // Generated by
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Gerado por ToSmile.ai', pageWidth / 2, footerY + 2, { align: 'center' });

  // Page number
  pdf.text(`Pagina ${ctx.currentPage}`, pageWidth / 2, footerY + 6, { align: 'center' });
}
