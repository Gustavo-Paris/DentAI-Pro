import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProtocolLayer {
  order: number;
  name: string;
  resin_brand: string;
  shade: string;
  thickness: string;
  purpose: string;
  technique: string;
}

interface ProtocolAlternative {
  resin: string;
  shade: string;
  technique: string;
  tradeoff: string;
}

interface Resin {
  name: string;
  manufacturer: string;
  type: string;
  opacity: string;
  resistance: string;
  polishing: string;
  aesthetics: string;
}

interface PDFData {
  createdAt: string;
  dentistName?: string;
  dentistCRO?: string;
  patientAge: number;
  tooth: string;
  region: string;
  cavityClass: string;
  restorationSize: string;
  toothColor: string;
  aestheticLevel: string;
  bruxism: boolean;
  stratificationNeeded: boolean;
  resin: Resin | null;
  recommendationText: string | null;
  layers: ProtocolLayer[];
  alternative?: ProtocolAlternative;
  checklist: string[];
  alerts: string[];
  warnings: string[];
  confidence: string;
}

export async function generateProtocolPDF(data: PDFData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper functions
  const addText = (text: string, x: number, currentY: number, options?: { 
    fontSize?: number; 
    fontStyle?: 'normal' | 'bold' | 'italic';
    color?: [number, number, number];
    maxWidth?: number;
  }) => {
    const { fontSize = 10, fontStyle = 'normal', color = [0, 0, 0], maxWidth } = options || {};
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(...color);
    
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, currentY);
      return currentY + (lines.length * fontSize * 0.4);
    }
    
    pdf.text(text, x, currentY);
    return currentY + fontSize * 0.4;
  };

  const addLine = (y1: number, color: [number, number, number] = [220, 220, 220]) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y1, pageWidth - margin, y1);
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 25) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const drawCheckbox = (x: number, currentY: number, checked: boolean = false) => {
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(0.3);
    pdf.rect(x, currentY - 3, 4, 4);
    if (checked) {
      pdf.setDrawColor(34, 139, 34);
      pdf.line(x + 0.8, currentY - 1, x + 1.6, currentY);
      pdf.line(x + 1.6, currentY, x + 3.2, currentY - 2.5);
    }
  };

  // ============ HEADER ============
  // Logo/Title
  pdf.setFillColor(59, 130, 246); // Primary blue
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  addText('ResinMatch AI', margin, 15, { fontSize: 18, fontStyle: 'bold', color: [255, 255, 255] });
  addText('Protocolo de Restauração', margin, 23, { fontSize: 12, color: [220, 230, 255] });
  
  // Date and CRO on the right
  const dateStr = format(new Date(data.createdAt), "dd/MM/yyyy", { locale: ptBR });
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(dateStr, pageWidth - margin, 15, { align: 'right' });
  
  if (data.dentistCRO) {
    pdf.text(`CRO: ${data.dentistCRO}`, pageWidth - margin, 22, { align: 'right' });
  }
  if (data.dentistName) {
    pdf.text(data.dentistName, pageWidth - margin, 29, { align: 'right' });
  }

  y = 45;

  // ============ CASE SUMMARY ============
  addText('RESUMO DO CASO', margin, y, { fontSize: 11, fontStyle: 'bold', color: [59, 130, 246] });
  y += 7;
  
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');
  
  const col1 = margin + 5;
  const col2 = margin + contentWidth / 3;
  const col3 = margin + (contentWidth / 3) * 2;
  
  y += 6;
  addText(`Idade: ${data.patientAge} anos`, col1, y, { fontSize: 9 });
  addText(`Dente: ${data.tooth}`, col2, y, { fontSize: 9 });
  addText(`Região: ${data.region}`, col3, y, { fontSize: 9 });
  
  y += 6;
  addText(`Classe: ${data.cavityClass}`, col1, y, { fontSize: 9 });
  addText(`Tamanho: ${data.restorationSize}`, col2, y, { fontSize: 9 });
  addText(`Cor: ${data.toothColor}`, col3, y, { fontSize: 9 });
  
  y += 6;
  addText(`Estética: ${data.aestheticLevel}`, col1, y, { fontSize: 9 });
  addText(`Bruxismo: ${data.bruxism ? 'Sim' : 'Não'}`, col2, y, { fontSize: 9 });
  addText(`Estratificação: ${data.stratificationNeeded ? 'Sim' : 'Não'}`, col3, y, { fontSize: 9 });
  
  y += 15;

  // ============ MAIN RECOMMENDATION ============
  if (data.resin) {
    addText('RESINA RECOMENDADA', margin, y, { fontSize: 11, fontStyle: 'bold', color: [59, 130, 246] });
    y += 7;
    
    pdf.setFillColor(34, 139, 34);
    pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
    
    y += 7;
    addText(data.resin.name, margin + 5, y, { fontSize: 12, fontStyle: 'bold', color: [255, 255, 255] });
    addText(data.resin.manufacturer, pageWidth - margin - 5, y, { fontSize: 10, color: [220, 255, 220] });
    pdf.text(data.resin.manufacturer, pageWidth - margin - 5, y, { align: 'right' });
    
    y += 7;
    addText(`${data.resin.type} • Opacidade: ${data.resin.opacity} • Resistência: ${data.resin.resistance}`, margin + 5, y, { fontSize: 9, color: [220, 255, 220] });
    
    y += 15;
    
    // Justification
    if (data.recommendationText) {
      addText('Justificativa:', margin, y, { fontSize: 9, fontStyle: 'bold' });
      y += 5;
      y = addText(data.recommendationText, margin, y, { fontSize: 9, color: [80, 80, 80], maxWidth: contentWidth });
      y += 8;
    }
  }

  // ============ PROTOCOL LAYERS TABLE ============
  if (data.layers.length > 0) {
    checkPageBreak(50);
    
    addText('PROTOCOLO DE CAMADAS', margin, y, { fontSize: 11, fontStyle: 'bold', color: [59, 130, 246] });
    y += 7;
    
    // Table header
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, y, contentWidth, 8, 'F');
    
    // Adjusted column widths for better text fitting
    const colWidths = [35, 45, 22, 22, contentWidth - 124];
    const cols = [margin + 2, margin + 37, margin + 82, margin + 104, margin + 126];
    
    y += 5;
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Camada', cols[0], y);
    pdf.text('Resina', cols[1], y);
    pdf.text('Cor', cols[2], y);
    pdf.text('Espessura', cols[3], y);
    pdf.text('Tecnica', cols[4], y);
    
    y += 6;
    
    // Table rows with text wrapping
    data.layers.forEach((layer, index) => {
      checkPageBreak(16);
      
      // Calculate wrapped text for each column
      pdf.setFontSize(8);
      const layerName = `${layer.order}. ${layer.name}`;
      const layerLines = pdf.splitTextToSize(layerName, colWidths[0] - 2);
      const resinLines = pdf.splitTextToSize(layer.resin_brand || '-', colWidths[1] - 2);
      const shadeLines = pdf.splitTextToSize(layer.shade || '-', colWidths[2] - 2);
      const thicknessLines = pdf.splitTextToSize(layer.thickness || '-', colWidths[3] - 2);
      const techniqueLines = pdf.splitTextToSize(layer.technique || '-', colWidths[4] - 2);
      
      // Calculate row height based on max lines
      const maxLines = Math.max(layerLines.length, resinLines.length, techniqueLines.length);
      const rowHeight = Math.max(10, maxLines * 4 + 4);
      
      const bgColor: [number, number, number] = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
      pdf.setFillColor(...bgColor);
      pdf.rect(margin, y - 4, contentWidth, rowHeight, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      // Print each column with wrapping
      pdf.text(layerLines, cols[0], y);
      pdf.text(resinLines, cols[1], y);
      pdf.text(shadeLines, cols[2], y);
      pdf.text(thicknessLines, cols[3], y);
      pdf.text(techniqueLines, cols[4], y);
      
      y += rowHeight;
    });
    
    y += 5;
  }

  // ============ SIMPLIFIED ALTERNATIVE ============
  if (data.alternative) {
    checkPageBreak(30);
    
    addText('ALTERNATIVA SIMPLIFICADA', margin, y, { fontSize: 11, fontStyle: 'bold', color: [59, 130, 246] });
    y += 7;
    
    pdf.setFillColor(254, 243, 199); // Amber light
    pdf.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
    
    y += 6;
    addText(`${data.alternative.resin} - ${data.alternative.shade}`, margin + 5, y, { fontSize: 10, fontStyle: 'bold', color: [146, 64, 14] });
    y += 5;
    addText(`Técnica: ${data.alternative.technique}`, margin + 5, y, { fontSize: 9, color: [146, 64, 14] });
    y += 5;
    addText(`Trade-off: ${data.alternative.tradeoff}`, margin + 5, y, { fontSize: 8, color: [120, 80, 40] });
    
    y += 12;
  }

  // ============ CHECKLIST ============
  if (data.checklist.length > 0) {
    checkPageBreak(40);
    
    addText('PASSO A PASSO', margin, y, { fontSize: 11, fontStyle: 'bold', color: [59, 130, 246] });
    y += 7;
    
    pdf.setFillColor(248, 250, 252);
    const checklistHeight = Math.min(data.checklist.length * 7 + 8, 80);
    pdf.roundedRect(margin, y, contentWidth, checklistHeight, 2, 2, 'F');
    
    y += 6;
    
    data.checklist.forEach((item, index) => {
      checkPageBreak(8);
      
      drawCheckbox(margin + 4, y, false); // Empty checkbox for printing
      addText(item, margin + 12, y, { fontSize: 8, color: [60, 60, 60] });
      y += 6;
    });
    
    y += 8;
  }

  // ============ ALERTS & WARNINGS ============
  if (data.alerts.length > 0 || data.warnings.length > 0) {
    checkPageBreak(35);
    
    const halfWidth = (contentWidth - 5) / 2;
    
    // Alerts (left side)
    if (data.alerts.length > 0) {
      addText('ALERTAS', margin, y, { fontSize: 10, fontStyle: 'bold', color: [202, 138, 4] });
      
      let alertY = y + 6;
      pdf.setFillColor(254, 249, 195); // Yellow light
      const alertHeight = data.alerts.length * 10 + 8;
      pdf.roundedRect(margin, alertY, halfWidth, alertHeight, 2, 2, 'F');
      
      alertY += 5;
      data.alerts.forEach((alert) => {
        const alertLines = pdf.splitTextToSize(`- ${alert}`, halfWidth - 8);
        addText(alertLines[0], margin + 3, alertY, { fontSize: 7, color: [133, 77, 14] });
        alertY += 10;
      });
    }
    
    // Warnings (right side)
    if (data.warnings.length > 0) {
      addText('O QUE NAO FAZER', margin + halfWidth + 5, y, { fontSize: 10, fontStyle: 'bold', color: [220, 38, 38] });
      
      let warningY = y + 6;
      pdf.setFillColor(254, 226, 226); // Red light
      const warningHeight = data.warnings.length * 10 + 8;
      pdf.roundedRect(margin + halfWidth + 5, warningY, halfWidth, warningHeight, 2, 2, 'F');
      
      warningY += 5;
      data.warnings.forEach((warning) => {
        const warningLines = pdf.splitTextToSize(`- ${warning}`, halfWidth - 8);
        addText(warningLines[0], margin + halfWidth + 8, warningY, { fontSize: 7, color: [153, 27, 27] });
        warningY += 10;
      });
    }
    
    y += Math.max(data.alerts.length, data.warnings.length) * 10 + 25;
  }

  // ============ CONFIDENCE ============
  if (data.confidence) {
    checkPageBreak(15);
    
    const confidenceColors: Record<string, [number, number, number]> = {
      'alta': [34, 139, 34],
      'média': [202, 138, 4],
      'baixa': [220, 38, 38],
    };
    
    const color = confidenceColors[data.confidence] || [100, 100, 100];
    addText(`Confiança da IA: ${data.confidence.toUpperCase()}`, margin, y, { fontSize: 10, fontStyle: 'bold', color });
    y += 10;
  }

  // ============ FOOTER ============
  const footerY = pageHeight - 15;
  addLine(footerY - 5, [200, 200, 200]);
  
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont('helvetica', 'italic');
  const disclaimer = 'Esta é uma ferramenta de apoio à decisão clínica. A escolha final do material restaurador é de responsabilidade exclusiva do profissional.';
  const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth);
  pdf.text(disclaimerLines, pageWidth / 2, footerY, { align: 'center' });
  
  // Generated by
  pdf.setFontSize(6);
  pdf.text('Gerado por ResinMatch AI • www.resinmatch.ai', pageWidth / 2, footerY + 6, { align: 'center' });

  // Save the PDF
  const fileName = `protocolo-${data.tooth}-${format(new Date(data.createdAt), 'yyyy-MM-dd')}.pdf`;
  pdf.save(fileName);
}
