import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeText,
  addText,
  addLine,
  addPageFooter,
  checkPageBreak,
  drawCheckbox,
  drawProgressBar,
} from '../pdf/pdfHelpers';
import type { PDFRenderContext } from '../pdf/pdfHelpers';

function makePDF() {
  return {
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    setFillColor: vi.fn(),
    setLineWidth: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
    text: vi.fn(),
    line: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    addPage: vi.fn(),
  };
}

function makeCtx(overrides?: Partial<PDFRenderContext>): PDFRenderContext {
  return {
    pdf: makePDF() as any,
    pageWidth: 210,
    pageHeight: 297,
    margin: 20,
    contentWidth: 170,
    y: 50,
    currentPage: 1,
    t: (k: string, opts?: any) => k,
    ...overrides,
  };
}

describe('sanitizeText', () => {
  it('returns empty string for null', () => {
    expect(sanitizeText(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeText(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('removes lowercase accents', () => {
    expect(sanitizeText('áàãâä')).toBe('aaaaa');
    expect(sanitizeText('éèêë')).toBe('eeee');
    expect(sanitizeText('íìîï')).toBe('iiii');
    expect(sanitizeText('óòõôö')).toBe('ooooo');
    expect(sanitizeText('úùûü')).toBe('uuuu');
    expect(sanitizeText('ç')).toBe('c');
    expect(sanitizeText('ñ')).toBe('n');
  });

  it('removes uppercase accents', () => {
    expect(sanitizeText('ÁÀÃÂÄ')).toBe('AAAAA');
    expect(sanitizeText('ÉÈÊË')).toBe('EEEE');
    expect(sanitizeText('ÍÌÎÏ')).toBe('IIII');
    expect(sanitizeText('ÓÒÕÔÖ')).toBe('OOOOO');
    expect(sanitizeText('ÚÙÛÜ')).toBe('UUUU');
    expect(sanitizeText('Ç')).toBe('C');
    expect(sanitizeText('Ñ')).toBe('N');
  });

  it('keeps non-accented characters', () => {
    expect(sanitizeText('Hello World 123')).toBe('Hello World 123');
  });

  it('handles mixed text', () => {
    expect(sanitizeText('Análise clínica')).toBe('Analise clinica');
  });
});

describe('addText', () => {
  it('renders text with defaults', () => {
    const ctx = makeCtx();
    const result = addText(ctx, 'Hello', 20, 50);
    expect(ctx.pdf.setFontSize).toHaveBeenCalledWith(10);
    expect(ctx.pdf.setFont).toHaveBeenCalledWith('helvetica', 'normal');
    expect(ctx.pdf.setTextColor).toHaveBeenCalledWith(0, 0, 0);
    expect(ctx.pdf.text).toHaveBeenCalledWith('Hello', 20, 50, { align: 'left' });
    expect(result).toBe(54); // 50 + 10 * 0.4
  });

  it('renders with custom options', () => {
    const ctx = makeCtx();
    addText(ctx, 'Bold', 10, 30, {
      fontSize: 14,
      fontStyle: 'bold',
      color: [255, 0, 0],
      align: 'right',
    });
    expect(ctx.pdf.setFontSize).toHaveBeenCalledWith(14);
    expect(ctx.pdf.setFont).toHaveBeenCalledWith('helvetica', 'bold');
    expect(ctx.pdf.setTextColor).toHaveBeenCalledWith(255, 0, 0);
    expect(ctx.pdf.text).toHaveBeenCalledWith('Bold', 10, 30, { align: 'right' });
  });

  it('splits text with maxWidth', () => {
    const ctx = makeCtx();
    (ctx.pdf.splitTextToSize as any).mockReturnValue(['Line 1', 'Line 2']);
    const result = addText(ctx, 'Long text', 20, 50, { maxWidth: 100 });
    expect(ctx.pdf.splitTextToSize).toHaveBeenCalledWith('Long text', 100);
    expect(ctx.pdf.text).toHaveBeenCalledWith(['Line 1', 'Line 2'], 20, 50);
    expect(result).toBe(58); // 50 + (2 * 10 * 0.4)
  });

  it('centers text with maxWidth and align=center', () => {
    const ctx = makeCtx();
    (ctx.pdf.splitTextToSize as any).mockReturnValue(['Line 1', 'Line 2']);
    addText(ctx, 'Centered', 100, 50, { maxWidth: 100, align: 'center' });
    expect(ctx.pdf.text).toHaveBeenCalledWith('Line 1', 100, 50, { align: 'center' });
    expect(ctx.pdf.text).toHaveBeenCalledWith('Line 2', 100, 54, { align: 'center' });
  });
});

describe('addLine', () => {
  it('draws a line with default color', () => {
    const ctx = makeCtx();
    addLine(ctx, 100);
    expect(ctx.pdf.setDrawColor).toHaveBeenCalledWith(220, 220, 220);
    expect(ctx.pdf.line).toHaveBeenCalledWith(20, 100, 190, 100);
  });

  it('draws a line with custom color', () => {
    const ctx = makeCtx();
    addLine(ctx, 100, [255, 0, 0]);
    expect(ctx.pdf.setDrawColor).toHaveBeenCalledWith(255, 0, 0);
  });
});

describe('addPageFooter', () => {
  it('adds footer text', () => {
    const ctx = makeCtx();
    addPageFooter(ctx);
    expect(ctx.pdf.setFontSize).toHaveBeenCalledWith(7);
    expect(ctx.pdf.text).toHaveBeenCalledWith(
      'pdf.footer.page',
      105, // pageWidth / 2
      289, // pageHeight - 8
      { align: 'center' },
    );
  });
});

describe('checkPageBreak', () => {
  it('returns false when enough space', () => {
    const ctx = makeCtx({ y: 50 });
    const result = checkPageBreak(ctx, 10);
    expect(result).toBe(false);
    expect(ctx.pdf.addPage).not.toHaveBeenCalled();
  });

  it('adds new page when not enough space', () => {
    const ctx = makeCtx({ y: 270 }); // 270 + 30 = 300 > 297 - 30 = 267
    const result = checkPageBreak(ctx, 30);
    expect(result).toBe(true);
    expect(ctx.pdf.addPage).toHaveBeenCalled();
    expect(ctx.currentPage).toBe(2);
    expect(ctx.y).toBe(25); // margin + 5
  });

  it('adds page when exactly at boundary', () => {
    const ctx = makeCtx({ y: 240 }); // 240 + 28 = 268 > 297 - 30 = 267
    const result = checkPageBreak(ctx, 28);
    expect(result).toBe(true);
  });
});

describe('drawCheckbox', () => {
  it('draws a rectangle', () => {
    const ctx = makeCtx();
    drawCheckbox(ctx, 20, 50);
    expect(ctx.pdf.rect).toHaveBeenCalledWith(20, 47, 4, 4);
  });
});

describe('drawProgressBar', () => {
  it('draws background and filled portion', () => {
    const ctx = makeCtx();
    drawProgressBar(ctx, 20, 50, 100, 75, [0, 128, 0]);
    // Background
    expect(ctx.pdf.setFillColor).toHaveBeenCalledWith(230, 230, 230);
    expect(ctx.pdf.roundedRect).toHaveBeenCalledWith(20, 50, 100, 4, 2, 2, 'F');
    // Fill
    expect(ctx.pdf.setFillColor).toHaveBeenCalledWith(0, 128, 0);
    expect(ctx.pdf.roundedRect).toHaveBeenCalledWith(20, 50, 75, 4, 2, 2, 'F');
  });

  it('caps fill width at bar width', () => {
    const ctx = makeCtx();
    drawProgressBar(ctx, 20, 50, 100, 150, [0, 0, 255]); // 150% should cap at 100
    // The filled portion should be Math.min(150, 100) = 100
    expect(ctx.pdf.roundedRect).toHaveBeenCalledWith(20, 50, 100, 4, 2, 2, 'F');
  });

  it('handles zero value', () => {
    const ctx = makeCtx();
    drawProgressBar(ctx, 20, 50, 100, 0, [0, 0, 0]);
    // Filled portion width = 0
    expect(ctx.pdf.roundedRect).toHaveBeenCalledWith(20, 50, 0, 4, 2, 2, 'F');
  });
});
