import type jsPDF from 'jspdf';

// ============ CONTEXT INTERFACE ============
export interface PDFRenderContext {
  pdf: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  y: number;
  currentPage: number;
}

// ============ HELPER FUNCTIONS ============

// Helper to sanitize text for PDF (remove accents for helvetica font compatibility)
export const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  const charMap: Record<string, string> = {
    '\u00e1': 'a', '\u00e0': 'a', '\u00e3': 'a', '\u00e2': 'a', '\u00e4': 'a',
    '\u00e9': 'e', '\u00e8': 'e', '\u00ea': 'e', '\u00eb': 'e',
    '\u00ed': 'i', '\u00ec': 'i', '\u00ee': 'i', '\u00ef': 'i',
    '\u00f3': 'o', '\u00f2': 'o', '\u00f5': 'o', '\u00f4': 'o', '\u00f6': 'o',
    '\u00fa': 'u', '\u00f9': 'u', '\u00fb': 'u', '\u00fc': 'u',
    '\u00e7': 'c', '\u00f1': 'n',
    '\u00c1': 'A', '\u00c0': 'A', '\u00c3': 'A', '\u00c2': 'A', '\u00c4': 'A',
    '\u00c9': 'E', '\u00c8': 'E', '\u00ca': 'E', '\u00cb': 'E',
    '\u00cd': 'I', '\u00cc': 'I', '\u00ce': 'I', '\u00cf': 'I',
    '\u00d3': 'O', '\u00d2': 'O', '\u00d5': 'O', '\u00d4': 'O', '\u00d6': 'O',
    '\u00da': 'U', '\u00d9': 'U', '\u00db': 'U', '\u00dc': 'U',
    '\u00c7': 'C', '\u00d1': 'N',
  };
  return text.split('').map(char => charMap[char] || char).join('');
};

export const addText = (ctx: PDFRenderContext, text: string, x: number, currentY: number, options?: {
  fontSize?: number;
  fontStyle?: 'normal' | 'bold' | 'italic';
  color?: [number, number, number];
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
}) => {
  const { fontSize = 10, fontStyle = 'normal', color = [0, 0, 0], maxWidth, align = 'left' } = options || {};
  ctx.pdf.setFontSize(fontSize);
  ctx.pdf.setFont('helvetica', fontStyle);
  ctx.pdf.setTextColor(...color);

  if (maxWidth) {
    const lines = ctx.pdf.splitTextToSize(text, maxWidth);
    if (align === 'center') {
      lines.forEach((line: string, i: number) => {
        ctx.pdf.text(line, x, currentY + (i * fontSize * 0.4), { align: 'center' });
      });
    } else {
      ctx.pdf.text(lines, x, currentY);
    }
    return currentY + (lines.length * fontSize * 0.4);
  }

  ctx.pdf.text(text, x, currentY, { align });
  return currentY + fontSize * 0.4;
};

export const addLine = (ctx: PDFRenderContext, y1: number, color: [number, number, number] = [220, 220, 220]) => {
  ctx.pdf.setDrawColor(...color);
  ctx.pdf.setLineWidth(0.3);
  ctx.pdf.line(ctx.margin, y1, ctx.pageWidth - ctx.margin, y1);
};

export const addPageFooter = (ctx: PDFRenderContext) => {
  ctx.pdf.setFontSize(7);
  ctx.pdf.setTextColor(120, 120, 120);
  ctx.pdf.setFont('helvetica', 'italic');
  ctx.pdf.text(`Pagina ${ctx.currentPage}`, ctx.pageWidth / 2, ctx.pageHeight - 8, { align: 'center' });
};

export const checkPageBreak = (ctx: PDFRenderContext, requiredSpace: number) => {
  if (ctx.y + requiredSpace > ctx.pageHeight - 30) {
    addPageFooter(ctx);
    ctx.pdf.addPage();
    ctx.currentPage++;
    ctx.y = ctx.margin + 5;
    return true;
  }
  return false;
};

export const drawCheckbox = (ctx: PDFRenderContext, x: number, currentY: number) => {
  ctx.pdf.setDrawColor(100, 100, 100);
  ctx.pdf.setLineWidth(0.3);
  ctx.pdf.rect(x, currentY - 3, 4, 4);
};

export const drawProgressBar = (ctx: PDFRenderContext, x: number, currentY: number, width: number, value: number, color: [number, number, number]) => {
  // Background
  ctx.pdf.setFillColor(230, 230, 230);
  ctx.pdf.roundedRect(x, currentY, width, 4, 2, 2, 'F');
  // Filled portion
  const fillWidth = Math.min((value / 100) * width, width);
  ctx.pdf.setFillColor(...color);
  ctx.pdf.roundedRect(x, currentY, fillWidth, 4, 2, 2, 'F');
};
