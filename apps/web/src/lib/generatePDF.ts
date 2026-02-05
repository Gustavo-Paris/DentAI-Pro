import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PDFData } from '@/types/protocol';

export type { PDFData };

// Helper to sanitize text for PDF (remove accents for helvetica font compatibility)
const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  const charMap: Record<string, string> = {
    'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c', 'ñ': 'n',
    'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
    'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
    'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
    'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
    'Ç': 'C', 'Ñ': 'N',
  };
  return text.split('').map(char => charMap[char] || char).join('');
};


export async function generateProtocolPDF(data: PDFData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let currentPage = 1;

  // ============ HELPER FUNCTIONS ============
  const addText = (text: string, x: number, currentY: number, options?: { 
    fontSize?: number; 
    fontStyle?: 'normal' | 'bold' | 'italic';
    color?: [number, number, number];
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  }) => {
    const { fontSize = 10, fontStyle = 'normal', color = [0, 0, 0], maxWidth, align = 'left' } = options || {};
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(...color);
    
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text, maxWidth);
      if (align === 'center') {
        lines.forEach((line: string, i: number) => {
          pdf.text(line, x, currentY + (i * fontSize * 0.4), { align: 'center' });
        });
      } else {
        pdf.text(lines, x, currentY);
      }
      return currentY + (lines.length * fontSize * 0.4);
    }
    
    pdf.text(text, x, currentY, { align });
    return currentY + fontSize * 0.4;
  };

  const addLine = (y1: number, color: [number, number, number] = [220, 220, 220]) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y1, pageWidth - margin, y1);
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 30) {
      addPageFooter();
      pdf.addPage();
      currentPage++;
      y = margin + 5;
      return true;
    }
    return false;
  };

  const addPageFooter = () => {
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Pagina ${currentPage}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  };

  const drawCheckbox = (x: number, currentY: number) => {
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(0.3);
    pdf.rect(x, currentY - 3, 4, 4);
  };

  const drawProgressBar = (x: number, currentY: number, width: number, value: number, color: [number, number, number]) => {
    // Background
    pdf.setFillColor(230, 230, 230);
    pdf.roundedRect(x, currentY, width, 4, 2, 2, 'F');
    // Filled portion
    const fillWidth = Math.min((value / 100) * width, width);
    pdf.setFillColor(...color);
    pdf.roundedRect(x, currentY, fillWidth, 4, 2, 2, 'F');
  };

  // ============ PAGE 1: HEADER ============
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
      console.warn('Could not add clinic logo to PDF:', e);
    }
  }
  
  // Title and subtitle (adjusted for logo)
  if (data.clinicName) {
    addText(sanitizeText(data.clinicName), headerTextStartX, 12, { fontSize: 14, fontStyle: 'bold', color: [255, 255, 255] });
    addText('AURIA - Protocolo de Restauracao Estetica', headerTextStartX, 20, { fontSize: 9, color: [212, 175, 92] });
  } else {
    addText('AURIA', headerTextStartX, 14, { fontSize: 20, fontStyle: 'bold', color: [255, 255, 255] });
    addText('Protocolo de Restauracao Estetica', headerTextStartX, 22, { fontSize: 11, color: [191, 219, 254] });
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

  y = 48;

  // ============ PATIENT IDENTIFICATION ============
  if (data.patientName) {
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
    addText('Paciente:', margin + 4, y + 7, { fontSize: 9, color: [100, 100, 100] });
    addText(data.patientName, margin + 28, y + 7, { fontSize: 10, fontStyle: 'bold' });
    y += 18;
  }

  // ============ CASE SUMMARY GRID ============
  addText('RESUMO DO CASO', margin, y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
  y += 6;
  
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, contentWidth, 34, 2, 2, 'F');
  
  const col1 = margin + 5;
  const col2 = margin + contentWidth / 3;
  const col3 = margin + (contentWidth / 3) * 2;
  
  y += 7;
  
  // Row 1
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Idade', col1, y);
  pdf.text('Dente', col2, y);
  pdf.text('Regiao', col3, y);
  
  y += 4;
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.patientAge} anos`, col1, y);
  pdf.text(data.tooth, col2, y);
  pdf.text(data.region, col3, y);
  
  y += 8;
  
  // Row 2
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Classe', col1, y);
  pdf.text('Tamanho', col2, y);
  pdf.text('Cor', col3, y);
  
  y += 4;
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.cavityClass, col1, y);
  pdf.text(data.restorationSize, col2, y);
  pdf.text(data.toothColor, col3, y);
  
  y += 8;
  
  // Row 3 - Badges
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  
  let badgeX = col1;
  
  // Aesthetic level badge
  pdf.setFillColor(219, 234, 254);
  pdf.roundedRect(badgeX, y - 3, 28, 6, 1, 1, 'F');
  pdf.setTextColor(30, 64, 175);
  pdf.text(data.aestheticLevel, badgeX + 2, y);
  badgeX += 32;
  
  // Bruxism badge
  if (data.bruxism) {
    pdf.setFillColor(254, 226, 226);
    pdf.roundedRect(badgeX, y - 3, 18, 6, 1, 1, 'F');
    pdf.setTextColor(185, 28, 28);
    pdf.text('Bruxismo', badgeX + 2, y);
    badgeX += 22;
  }
  
  // Stratification badge
  if (data.stratificationNeeded) {
    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(badgeX, y - 3, 25, 6, 1, 1, 'F');
    pdf.setTextColor(22, 101, 52);
    pdf.text('Estratificacao', badgeX + 2, y);
  }
  
  // From inventory badge
  if (data.isFromInventory) {
    pdf.setFillColor(254, 249, 195);
    pdf.roundedRect(badgeX + 30, y - 3, 22, 6, 1, 1, 'F');
    pdf.setTextColor(133, 77, 14);
    pdf.text('No Estoque', badgeX + 32, y);
  }
  
  y += 15;

  // ============ MAIN RECOMMENDATION ============
  if (data.resin) {
    checkPageBreak(45);
    
    addText('RESINA RECOMENDADA', margin, y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
    y += 6;
    
    // Main card with gradient effect
    pdf.setFillColor(22, 163, 74); // Green
    pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');
    
    // Lighter accent stripe
    pdf.setFillColor(34, 197, 94);
    pdf.rect(margin, y, 4, 28);
    
    y += 8;
    addText(data.resin.name, margin + 8, y, { fontSize: 14, fontStyle: 'bold', color: [255, 255, 255] });
    
    // Manufacturer on right
    pdf.setFontSize(10);
    pdf.setTextColor(187, 247, 208);
    pdf.text(data.resin.manufacturer, pageWidth - margin - 5, y, { align: 'right' });
    
    y += 6;
    
    // Technical specs inline
    const specs = [
      `Tipo: ${data.resin.type}`,
      `Opacidade: ${data.resin.opacity}`,
      `Resistencia: ${data.resin.resistance}`,
    ].join('  •  ');
    addText(specs, margin + 8, y, { fontSize: 8, color: [187, 247, 208] });
    
    y += 5;
    const specs2 = [
      `Polimento: ${data.resin.polishing}`,
      `Estetica: ${data.resin.aesthetics}`,
    ].join('  •  ');
    addText(specs2, margin + 8, y, { fontSize: 8, color: [187, 247, 208] });
    
    y += 12;
    
    // Justification
    if (data.recommendationText) {
      pdf.setFillColor(248, 250, 252);
      const justificationLines = pdf.splitTextToSize(data.recommendationText, contentWidth - 10);
      const justificationHeight = Math.max(justificationLines.length * 4 + 8, 16);
      pdf.roundedRect(margin, y, contentWidth, justificationHeight, 2, 2, 'F');
      
      y += 5;
      addText('Justificativa da IA:', margin + 5, y, { fontSize: 8, fontStyle: 'bold', color: [100, 100, 100] });
      y += 4;
      addText(data.recommendationText, margin + 5, y, { fontSize: 8, color: [60, 60, 60], maxWidth: contentWidth - 10 });
      y += justificationHeight - 5;
    }
    
    y += 8;
  }

  // ============ DSD ANALYSIS ============
  if (data.dsdAnalysis) {
    checkPageBreak(60);
    
    addText('PLANEJAMENTO DIGITAL DO SORRISO (DSD)', margin, y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
    y += 7;
    
    // Scores section
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
    
    const scoreCol1 = margin + 5;
    const scoreCol2 = margin + contentWidth / 2 + 5;
    
    y += 6;
    
    // Golden Ratio
    if (data.dsdAnalysis.golden_ratio_compliance !== undefined) {
      addText('Proporcao Dourada', scoreCol1, y, { fontSize: 8, color: [100, 100, 100] });
      const grScore = data.dsdAnalysis.golden_ratio_compliance;
      const grColor: [number, number, number] = grScore >= 80 ? [22, 163, 74] : grScore >= 60 ? [202, 138, 4] : [220, 38, 38];
      drawProgressBar(scoreCol1 + 40, y - 2, 40, grScore, grColor);
      addText(`${grScore}%`, scoreCol1 + 85, y, { fontSize: 9, fontStyle: 'bold', color: grColor });
    }
    
    // Symmetry
    if (data.dsdAnalysis.symmetry_score !== undefined) {
      addText('Simetria', scoreCol2, y, { fontSize: 8, color: [100, 100, 100] });
      const symScore = data.dsdAnalysis.symmetry_score;
      const symColor: [number, number, number] = symScore >= 80 ? [22, 163, 74] : symScore >= 60 ? [202, 138, 4] : [220, 38, 38];
      drawProgressBar(scoreCol2 + 25, y - 2, 40, symScore, symColor);
      addText(`${symScore}%`, scoreCol2 + 70, y, { fontSize: 9, fontStyle: 'bold', color: symColor });
    }
    
    y += 10;
    
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
          y += 5;
        }
        addText(`${param.label}: `, paramX, y, { fontSize: 8, color: [100, 100, 100] });
        addText(param.value || '-', paramX + 38, y, { fontSize: 8, fontStyle: 'bold' });
        if (i % 2 === 0) paramX = scoreCol2;
      });
    }
    
    y += 10;
  }

  // ============ PROTOCOL LAYERS TABLE ============
  if (data.layers.length > 0) {
    checkPageBreak(50);
    
    addText('PROTOCOLO DE CAMADAS', margin, y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
    y += 6;
    
    // Table header
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
    
    const colWidths = [32, 42, 20, 22, contentWidth - 116];
    const cols = [margin + 2, margin + 34, margin + 76, margin + 96, margin + 118];
    
    y += 5;
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Camada', cols[0], y);
    pdf.text('Resina', cols[1], y);
    pdf.text('Cor', cols[2], y);
    pdf.text('Espessura', cols[3], y);
    pdf.text('Tecnica', cols[4], y);
    
    y += 5;
    
    // Table rows
    data.layers.forEach((layer, index) => {
      checkPageBreak(14);
      
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
      pdf.rect(margin, y - 2, contentWidth, rowHeight, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      pdf.text(layerLines, cols[0], y + 1);
      pdf.text(pdf.splitTextToSize(layer.resin_brand || '-', colWidths[1] - 2), cols[1], y + 1);
      pdf.text(layer.shade || '-', cols[2], y + 1);
      pdf.text(layer.thickness || '-', cols[3], y + 1);
      pdf.text(techniqueLines, cols[4], y + 1);
      
      y += rowHeight;
    });
    
    y += 8;
  }

  // ============ SIMPLIFIED ALTERNATIVE ============
  if (data.alternative) {
    checkPageBreak(28);
    
    addText('ALTERNATIVA SIMPLIFICADA', margin, y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
    y += 6;
    
    pdf.setFillColor(254, 249, 195); // Amber light
    pdf.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
    
    // Left accent
    pdf.setFillColor(245, 158, 11);
    pdf.rect(margin, y, 3, 20);
    
    y += 6;
    addText(`${data.alternative.resin} - ${data.alternative.shade}`, margin + 8, y, { fontSize: 10, fontStyle: 'bold', color: [146, 64, 14] });
    y += 5;
    addText(`Tecnica: ${data.alternative.technique}`, margin + 8, y, { fontSize: 8, color: [133, 77, 14] });
    y += 5;
    addText(`Trade-off: ${data.alternative.tradeoff}`, margin + 8, y, { fontSize: 7, color: [120, 80, 40], maxWidth: contentWidth - 15 });
    
    y += 12;
  }

  // ============ CHECKLIST ============
  if (data.checklist.length > 0) {
    checkPageBreak(40);
    
    addText('PASSO A PASSO', margin, y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
    y += 6;
    
    pdf.setFillColor(248, 250, 252);
    const checklistHeight = Math.min(data.checklist.length * 7 + 6, 80);
    pdf.roundedRect(margin, y, contentWidth, checklistHeight, 2, 2, 'F');
    
    y += 5;
    
    data.checklist.forEach((item, index) => {
      checkPageBreak(8);
      
      drawCheckbox(margin + 4, y);
      addText(`${index + 1}. ${item}`, margin + 12, y, { fontSize: 8, color: [60, 60, 60], maxWidth: contentWidth - 20 });
      y += 6;
    });
    
    y += 6;
  }

  // ============ CEMENTATION PROTOCOL (for porcelain) ============
  if (data.treatmentType === 'porcelana' && data.cementationProtocol) {
    const cementProtocol = data.cementationProtocol;
    
    checkPageBreak(30);
    addText('PROTOCOLO DE CIMENTACAO DE FACETAS', margin, y, { fontSize: 11, fontStyle: 'bold', color: [202, 138, 4] });
    y += 7;
    
    // Ceramic Treatment
    if (cementProtocol.ceramic_treatment && cementProtocol.ceramic_treatment.length > 0) {
      checkPageBreak(25);
      addText('Tratamento da Ceramica', margin, y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
      y += 5;
      
      pdf.setFillColor(254, 243, 199);
      const ceramicHeight = cementProtocol.ceramic_treatment.length * 7 + 4;
      pdf.roundedRect(margin, y, contentWidth, ceramicHeight, 2, 2, 'F');
      y += 4;
      
      cementProtocol.ceramic_treatment.sort((a, b) => a.order - b.order).forEach((step) => {
        addText(`${step.order}. ${step.step}`, margin + 4, y, { fontSize: 8, fontStyle: 'bold' });
        addText(`(${step.material}${step.time ? ` - ${step.time}` : ''})`, margin + 80, y, { fontSize: 7, color: [100, 100, 100] });
        y += 6;
      });
      y += 6;
    }
    
    // Tooth Treatment
    if (cementProtocol.tooth_treatment && cementProtocol.tooth_treatment.length > 0) {
      checkPageBreak(25);
      addText('Tratamento do Dente', margin, y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
      y += 5;
      
      pdf.setFillColor(219, 234, 254);
      const toothHeight = cementProtocol.tooth_treatment.length * 7 + 4;
      pdf.roundedRect(margin, y, contentWidth, toothHeight, 2, 2, 'F');
      y += 4;
      
      cementProtocol.tooth_treatment.sort((a, b) => a.order - b.order).forEach((step) => {
        addText(`${step.order}. ${step.step}`, margin + 4, y, { fontSize: 8, fontStyle: 'bold' });
        addText(`(${step.material}${step.time ? ` - ${step.time}` : ''})`, margin + 80, y, { fontSize: 7, color: [100, 100, 100] });
        y += 6;
      });
      y += 6;
    }
    
    // Cementation details
    checkPageBreak(30);
    addText('Cimentacao', margin, y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
    y += 5;
    
    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
    
    y += 6;
    const cementCol1 = margin + 5;
    const cementCol2 = margin + contentWidth / 2;
    
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Cimento', cementCol1, y);
    pdf.text('Cor', cementCol2, y);
    y += 4;
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(cementProtocol.cementation.cement_brand, cementCol1, y);
    pdf.text(cementProtocol.cementation.shade, cementCol2, y);
    
    y += 6;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Fotopolimerizacao', cementCol1, y);
    pdf.text('Tipo', cementCol2, y);
    y += 4;
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(cementProtocol.cementation.light_curing_time, cementCol1, y);
    pdf.text(cementProtocol.cementation.cement_type, cementCol2, y);
    
    y += 10;
    
    // Finishing
    if (cementProtocol.finishing && cementProtocol.finishing.length > 0) {
      checkPageBreak(20);
      addText('Acabamento e Polimento', margin, y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
      y += 5;
      
      cementProtocol.finishing.sort((a, b) => a.order - b.order).forEach((step) => {
        addText(`${step.order}. ${step.step} - ${step.material}`, margin + 4, y, { fontSize: 8 });
        y += 5;
      });
      y += 4;
    }
    
    // Post-operative
    if (cementProtocol.post_operative && cementProtocol.post_operative.length > 0) {
      checkPageBreak(20);
      addText('Orientacoes Pos-operatorias', margin, y, { fontSize: 9, fontStyle: 'bold', color: [37, 99, 235] });
      y += 5;
      
      cementProtocol.post_operative.forEach((item) => {
        addText(`• ${item}`, margin + 4, y, { fontSize: 7, color: [60, 60, 60], maxWidth: contentWidth - 10 });
        y += 5;
      });
      y += 4;
    }
  }

  // ============ ALERTS & WARNINGS ============
  if (data.alerts.length > 0 || data.warnings.length > 0) {
    checkPageBreak(35);
    
    const halfWidth = (contentWidth - 6) / 2;
    const startY = y;
    
    // Alerts (left side)
    if (data.alerts.length > 0) {
      addText('ALERTAS', margin, y, { fontSize: 9, fontStyle: 'bold', color: [202, 138, 4] });
      
      let alertY = y + 5;
      pdf.setFillColor(254, 249, 195);
      const alertHeight = Math.min(data.alerts.length * 8 + 6, 40);
      pdf.roundedRect(margin, alertY, halfWidth, alertHeight, 2, 2, 'F');
      
      alertY += 4;
      data.alerts.forEach((alert) => {
        const alertLines = pdf.splitTextToSize(`• ${alert}`, halfWidth - 6);
        addText(alertLines[0], margin + 3, alertY, { fontSize: 7, color: [133, 77, 14] });
        alertY += 7;
      });
    }
    
    // Warnings (right side)
    if (data.warnings.length > 0) {
      addText('O QUE NAO FAZER', margin + halfWidth + 6, startY, { fontSize: 9, fontStyle: 'bold', color: [220, 38, 38] });
      
      let warningY = startY + 5;
      pdf.setFillColor(254, 226, 226);
      const warningHeight = Math.min(data.warnings.length * 8 + 6, 40);
      pdf.roundedRect(margin + halfWidth + 6, warningY, halfWidth, warningHeight, 2, 2, 'F');
      
      warningY += 4;
      data.warnings.forEach((warning) => {
        const warningLines = pdf.splitTextToSize(`• ${warning}`, halfWidth - 6);
        addText(warningLines[0], margin + halfWidth + 9, warningY, { fontSize: 7, color: [153, 27, 27] });
        warningY += 7;
      });
    }
    
    y += Math.max(data.alerts.length, data.warnings.length) * 8 + 20;
  }

  // ============ IDEAL RESIN (when different) ============
  if (data.idealResin && data.resin && data.idealResin.name !== data.resin.name) {
    checkPageBreak(25);
    
    addText('OPCAO IDEAL (fora do estoque)', margin, y, { fontSize: 10, fontStyle: 'bold', color: [100, 100, 100] });
    y += 5;
    
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
    
    y += 5;
    addText(data.idealResin.name, margin + 5, y, { fontSize: 9, fontStyle: 'bold' });
    addText(data.idealResin.manufacturer, pageWidth - margin - 5, y, { fontSize: 8, color: [100, 100, 100], align: 'right' });
    
    if (data.idealReason) {
      y += 5;
      addText(data.idealReason, margin + 5, y, { fontSize: 7, color: [100, 100, 100], maxWidth: contentWidth - 10 });
    }
    
    y += 14;
  }

  // ============ CONFIDENCE INDICATOR ============
  if (data.confidence) {
    checkPageBreak(15);
    
    const confidenceConfig: Record<string, { color: [number, number, number]; bgColor: [number, number, number]; label: string }> = {
      'alta': { color: [22, 163, 74], bgColor: [220, 252, 231], label: 'ALTA' },
      'media': { color: [202, 138, 4], bgColor: [254, 249, 195], label: 'MEDIA' },
      'baixa': { color: [220, 38, 38], bgColor: [254, 226, 226], label: 'BAIXA' },
    };
    
    const conf = confidenceConfig[data.confidence.toLowerCase().replace('é', 'e')] || confidenceConfig['media'];
    
    pdf.setFillColor(...conf.bgColor);
    pdf.roundedRect(margin, y, 60, 10, 2, 2, 'F');
    addText(`Confianca: ${conf.label}`, margin + 5, y + 6, { fontSize: 9, fontStyle: 'bold', color: conf.color });
    
    y += 18;
  }

  // ============ SIGNATURE AREA ============
  checkPageBreak(40);
  
  addText('VALIDACAO PROFISSIONAL', margin, y, { fontSize: 11, fontStyle: 'bold', color: [37, 99, 235] });
  y += 8;
  
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');
  
  const sigCol1 = margin + 15;
  const sigCol2 = margin + contentWidth / 2 + 15;
  
  y += 18;
  
  // Signature lines
  addLine(y, [180, 180, 180]);
  pdf.line(sigCol1, y, sigCol1 + 60, y);
  pdf.line(sigCol2, y, sigCol2 + 60, y);
  
  y += 5;
  addText('Assinatura do Profissional', sigCol1 + 10, y, { fontSize: 7, color: [120, 120, 120] });
  addText('Data de Execucao', sigCol2 + 15, y, { fontSize: 7, color: [120, 120, 120] });
  
  if (data.dentistName) {
    y += 4;
    addText(data.dentistName, sigCol1 + 10, y, { fontSize: 8, color: [80, 80, 80] });
  }
  
  y += 15;

  // ============ FOOTER ============
  const footerY = pageHeight - 18;
  
  addLine(footerY - 8, [200, 200, 200]);
  
  pdf.setFontSize(6);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont('helvetica', 'italic');
  const disclaimer = 'Esta e uma ferramenta de apoio a decisao clinica. A escolha final do material restaurador e de responsabilidade exclusiva do profissional.';
  const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth);
  pdf.text(disclaimerLines, pageWidth / 2, footerY - 4, { align: 'center' });
  
  // Generated by
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Gerado por AURIA', pageWidth / 2, footerY + 2, { align: 'center' });
  
  // Page number
  pdf.text(`Pagina ${currentPage}`, pageWidth / 2, footerY + 6, { align: 'center' });

  // Save the PDF
  const fileName = `protocolo-${data.tooth}-${format(new Date(data.createdAt), 'yyyy-MM-dd')}.pdf`;
  pdf.save(fileName);
}
