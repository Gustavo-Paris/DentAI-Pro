import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { PDFData } from '@/types/protocol';
import type { PDFRenderContext } from './pdf/pdfHelpers';
import {
  renderHeader,
  renderPatientId,
  renderCaseSummary,
  renderResinRecommendation,
  renderDSDAnalysis,
  renderProtocolTable,
  renderAlternative,
  renderChecklist,
  renderCementationProtocol,
  renderAlertsWarnings,
  renderIdealResin,
  renderConfidence,
  renderSignature,
  renderFooter,
} from './pdf/pdfSections';

export type { PDFData };

export async function generateProtocolPDF(data: PDFData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const ctx: PDFRenderContext = { pdf, pageWidth, pageHeight, margin, contentWidth, y: margin, currentPage: 1 };

  renderHeader(ctx, data);
  renderPatientId(ctx, data);
  renderCaseSummary(ctx, data);
  renderResinRecommendation(ctx, data);
  renderDSDAnalysis(ctx, data);
  renderProtocolTable(ctx, data);
  renderAlternative(ctx, data);
  renderChecklist(ctx, data);
  renderCementationProtocol(ctx, data);
  renderAlertsWarnings(ctx, data);
  renderIdealResin(ctx, data);
  renderConfidence(ctx, data);
  renderSignature(ctx, data);
  renderFooter(ctx, data);

  // Save the PDF
  const fileName = `protocolo-${data.tooth}-${format(new Date(data.createdAt), 'yyyy-MM-dd')}.pdf`;
  pdf.save(fileName);
}
