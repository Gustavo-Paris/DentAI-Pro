import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { PatientDocument } from '@/data/evaluations';
import { sanitizeText } from './pdfHelpers';

const PAGE_MARGIN = 20;
const PAGE_WIDTH = 210; // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  y = checkPageBreak(doc, y, 15);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 157, 143); // Teal brand color
  doc.text(sanitizeText(title), PAGE_MARGIN, y);
  y += 2;
  doc.setDrawColor(42, 157, 143);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, y, PAGE_MARGIN + CONTENT_WIDTH, y);
  return y + 8;
}

function drawWrappedText(doc: jsPDF, text: string, y: number, fontSize: number = 11): number {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  const lines = doc.splitTextToSize(sanitizeText(text), CONTENT_WIDTH);
  for (const line of lines) {
    y = checkPageBreak(doc, y, 6);
    doc.text(line, PAGE_MARGIN, y);
    y += 5.5;
  }
  return y;
}

function drawNumberedList(doc: jsPDF, items: string[], y: number): number {
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  for (let i = 0; i < items.length; i++) {
    const prefix = `${i + 1}. `;
    const lines = doc.splitTextToSize(sanitizeText(items[i]), CONTENT_WIDTH - 10);
    for (let j = 0; j < lines.length; j++) {
      y = checkPageBreak(doc, y, 6);
      doc.setFont('helvetica', j === 0 ? 'bold' : 'normal');
      doc.text(j === 0 ? prefix : '   ', PAGE_MARGIN, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lines[j], PAGE_MARGIN + 10, y);
      y += 5.5;
    }
    y += 1;
  }
  return y;
}

function drawBulletList(
  doc: jsPDF,
  items: string[],
  y: number,
  color: [number, number, number] = [40, 40, 40],
): number {
  doc.setFontSize(11);
  doc.setTextColor(...color);
  for (const item of items) {
    const lines = doc.splitTextToSize(sanitizeText(item), CONTENT_WIDTH - 10);
    for (let j = 0; j < lines.length; j++) {
      y = checkPageBreak(doc, y, 6);
      doc.text(j === 0 ? `\u2022 ${lines[j]}` : `   ${lines[j]}`, PAGE_MARGIN + 5, y);
      y += 5.5;
    }
  }
  return y;
}

export async function generatePatientPDF(
  documents: PatientDocument[],
  patientName: string,
  clinicName?: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = PAGE_MARGIN;

  // Header
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  if (clinicName) {
    doc.text(sanitizeText(clinicName), PAGE_MARGIN, y);
  }
  doc.text(format(new Date(), 'dd/MM/yyyy'), PAGE_WIDTH - PAGE_MARGIN, y, { align: 'right' });
  y += 10;

  // Patient name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46); // Dark brand
  doc.text(sanitizeText(patientName), PAGE_MARGIN, y);
  y += 12;

  for (const docItem of documents) {
    // Treatment explanation
    y = drawSectionTitle(doc, 'Sobre o seu tratamento', y);
    y = drawWrappedText(doc, docItem.treatment_explanation, y);
    y += 6;

    // Post-operative
    y = drawSectionTitle(doc, 'Cuidados apos o procedimento', y);
    y = drawNumberedList(doc, docItem.post_operative, y);
    y += 6;

    // Dietary guide
    y = drawSectionTitle(
      doc,
      `Alimentacao (proximas ${docItem.dietary_guide.duration_hours}h)`,
      y,
    );

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Red
    y = checkPageBreak(doc, y, 6);
    doc.text('Evitar:', PAGE_MARGIN, y);
    y += 6;
    y = drawBulletList(doc, docItem.dietary_guide.avoid, y, [220, 38, 38]);
    y += 3;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74); // Green
    y = checkPageBreak(doc, y, 6);
    doc.text('Preferir:', PAGE_MARGIN, y);
    y += 6;
    y = drawBulletList(doc, docItem.dietary_guide.prefer, y, [22, 163, 74]);
    y += 6;

    // TCLE
    if (docItem.tcle) {
      y = drawSectionTitle(doc, 'Termo de Consentimento', y);
      y = drawWrappedText(doc, docItem.tcle, y, 9);
      y += 10;
    }
  }

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${i}/${pageCount}`, PAGE_WIDTH / 2, 292, { align: 'center' });
  }

  // Download
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const safeName = patientName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  doc.save(`orientacoes-${safeName}-${dateStr}.pdf`);
}
