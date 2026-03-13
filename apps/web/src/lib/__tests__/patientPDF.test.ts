import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PatientDocument } from '@/data/evaluations';

// Mock jsPDF
const mockSave = vi.fn();
const mockAddPage = vi.fn();
const mockText = vi.fn();
const mockLine = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockSetLineWidth = vi.fn();
const mockSetPage = vi.fn();
const mockSplitTextToSize = vi.fn((_text: string, _maxWidth: number) => ['mocked line']);
const mockGetNumberOfPages = vi.fn().mockReturnValue(1);

const fakePdfInstance = {
  save: mockSave,
  addPage: mockAddPage,
  text: mockText,
  line: mockLine,
  setFillColor: mockSetFillColor,
  setTextColor: mockSetTextColor,
  setDrawColor: mockSetDrawColor,
  setFontSize: mockSetFontSize,
  setFont: mockSetFont,
  setLineWidth: mockSetLineWidth,
  splitTextToSize: mockSplitTextToSize,
  setPage: mockSetPage,
  getNumberOfPages: mockGetNumberOfPages,
};

vi.mock('jspdf', () => ({
  default: vi.fn(() => fakePdfInstance),
}));

vi.mock('date-fns', () => ({
  format: vi.fn(() => '2026-03-12'),
}));

vi.mock('../pdf/pdfHelpers', () => ({
  sanitizeText: vi.fn((text: string) => text || ''),
}));

function makeDocument(overrides?: Partial<PatientDocument>): PatientDocument {
  return {
    treatment_explanation: 'Explanation of the treatment for your dental restoration.',
    post_operative: ['Avoid hard food', 'Brush gently'],
    dietary_guide: {
      duration_hours: 48,
      avoid: ['Coffee', 'Red wine'],
      prefer: ['Water', 'Soft foods'],
    },
    tcle: null,
    ...overrides,
  } as PatientDocument;
}

describe('generatePatientPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNumberOfPages.mockReturnValue(1);
  });

  it('should generate a PDF and save with correct filename', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument()];

    await generatePatientPDF(docs, 'João Silva');

    expect(mockSave).toHaveBeenCalledOnce();
    // Filename: orientacoes-jo-o-silva-2026-03-12.pdf (non-alphanum replaced)
    expect(mockSave).toHaveBeenCalledWith(expect.stringContaining('orientacoes-'));
    expect(mockSave).toHaveBeenCalledWith(expect.stringContaining('2026-03-12'));
  });

  it('should render clinic name when provided', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument()];

    await generatePatientPDF(docs, 'Patient', 'Clinic ABC');

    // Clinic name is rendered via doc.text
    expect(mockText).toHaveBeenCalled();
  });

  it('should render date header even without clinic name', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument()];

    await generatePatientPDF(docs, 'Patient');

    // Date is always rendered
    expect(mockText).toHaveBeenCalledWith('2026-03-12', expect.any(Number), expect.any(Number), expect.objectContaining({ align: 'right' }));
  });

  it('should render treatment explanation section', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument({ treatment_explanation: 'Custom explanation here' })];

    await generatePatientPDF(docs, 'Patient');

    // Section title "Sobre o seu tratamento" rendered via doc.text
    expect(mockText).toHaveBeenCalled();
    expect(mockSplitTextToSize).toHaveBeenCalled();
  });

  it('should render post-operative numbered list', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument({ post_operative: ['Step 1', 'Step 2', 'Step 3'] })];

    await generatePatientPDF(docs, 'Patient');

    // Should call setFont with 'bold' for first lines of numbered items
    expect(mockSetFont).toHaveBeenCalledWith('helvetica', 'bold');
  });

  it('should render dietary guide avoid and prefer sections', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument()];

    await generatePatientPDF(docs, 'Patient');

    // "Evitar:" and "Preferir:" labels
    expect(mockText).toHaveBeenCalledWith('Evitar:', expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Preferir:', expect.any(Number), expect.any(Number));

    // Red color for avoid (220, 38, 38)
    expect(mockSetTextColor).toHaveBeenCalledWith(220, 38, 38);
    // Green color for prefer (22, 163, 74)
    expect(mockSetTextColor).toHaveBeenCalledWith(22, 163, 74);
  });

  it('should render TCLE section when provided', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument({ tcle: 'Consent text here for the patient.' })];

    await generatePatientPDF(docs, 'Patient');

    // TCLE section renders "Termo de Consentimento" title
    // It's drawn via drawSectionTitle which uses teal color
    expect(mockSetTextColor).toHaveBeenCalledWith(42, 157, 143);
  });

  it('should skip TCLE section when null', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument({ tcle: null })];

    await generatePatientPDF(docs, 'Patient');

    // We still generate PDF successfully
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it('should handle multiple documents', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument(), makeDocument({ tcle: 'Another TCLE' })];

    await generatePatientPDF(docs, 'Patient');

    expect(mockSave).toHaveBeenCalledOnce();
    // Multiple section titles drawn (2 docs x sections each)
    const sectionTitleCalls = mockSetTextColor.mock.calls.filter(
      (c) => c[0] === 42 && c[1] === 157 && c[2] === 143,
    );
    // At least 4 section titles for 2 docs (treatment + post-op + dietary for each, + TCLE for second)
    expect(sectionTitleCalls.length).toBeGreaterThanOrEqual(4);
  });

  it('should add page numbers', async () => {
    mockGetNumberOfPages.mockReturnValue(2);
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument()];

    await generatePatientPDF(docs, 'Patient');

    // setPage should be called for each page
    expect(mockSetPage).toHaveBeenCalledWith(1);
    expect(mockSetPage).toHaveBeenCalledWith(2);
    // Page number text
    expect(mockText).toHaveBeenCalledWith('1/2', expect.any(Number), 292, expect.objectContaining({ align: 'center' }));
    expect(mockText).toHaveBeenCalledWith('2/2', expect.any(Number), 292, expect.objectContaining({ align: 'center' }));
  });

  it('should sanitize patient name in filename', async () => {
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument()];

    await generatePatientPDF(docs, 'Maria José & Carlos');

    // Non-alphanum chars (é, space, &) each become '-'
    expect(mockSave).toHaveBeenCalledWith(
      expect.stringMatching(/^orientacoes-maria-jos.*-carlos-2026-03-12\.pdf$/),
    );
  });

  it('should handle page break in drawWrappedText (large text)', async () => {
    // When splitTextToSize returns many lines, checkPageBreak should trigger addPage
    mockSplitTextToSize.mockReturnValue(
      Array(80).fill('A very long line of text that fills up the page'),
    );
    const { generatePatientPDF } = await import('../pdf/patientPDF');
    const docs = [makeDocument()];

    await generatePatientPDF(docs, 'Patient');

    // With 80 lines at 5.5mm each (~440mm), we'll need page breaks on a 280mm page
    expect(mockAddPage).toHaveBeenCalled();
  });
});
