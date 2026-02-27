import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PDFData } from '@/types/protocol';

// ---------------------------------------------------------------------------
// Mock jspdf — return a fake document object that records method calls
// ---------------------------------------------------------------------------
const mockSave = vi.fn();
const mockAddPage = vi.fn();
const mockText = vi.fn();
const mockRect = vi.fn();
const mockRoundedRect = vi.fn();
const mockLine = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockSetLineWidth = vi.fn();
const mockSplitTextToSize = vi.fn((_text: string, _maxWidth: number) => ['mocked line']);
const mockAddImage = vi.fn();

const fakePdfInstance = {
  save: mockSave,
  addPage: mockAddPage,
  text: mockText,
  rect: mockRect,
  roundedRect: mockRoundedRect,
  line: mockLine,
  setFillColor: mockSetFillColor,
  setTextColor: mockSetTextColor,
  setDrawColor: mockSetDrawColor,
  setFontSize: mockSetFontSize,
  setFont: mockSetFont,
  setLineWidth: mockSetLineWidth,
  splitTextToSize: mockSplitTextToSize,
  addImage: mockAddImage,
  internal: {
    pageSize: {
      getWidth: () => 210,
      getHeight: () => 297,
    },
  },
};

vi.mock('jspdf', () => ({
  default: vi.fn(() => fakePdfInstance),
}));

// ---------------------------------------------------------------------------
// Mock date-fns format so we don't worry about locale imports in test env
// ---------------------------------------------------------------------------
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2026-02-26'),
}));

vi.mock('date-fns/locale', () => ({
  ptBR: {},
}));

// ---------------------------------------------------------------------------
// Minimal t() mock — returns the key itself
// ---------------------------------------------------------------------------
const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
  if (opts) {
    return `${key}:${JSON.stringify(opts)}`;
  }
  return key;
}) as unknown as import('i18next').TFunction;

// ---------------------------------------------------------------------------
// Minimal valid PDFData fixture
// ---------------------------------------------------------------------------
function makeMinimalPDFData(overrides?: Partial<PDFData>): PDFData {
  return {
    createdAt: '2026-02-26T12:00:00Z',
    patientAge: 30,
    tooth: '11',
    region: 'anterior',
    cavityClass: 'IV',
    restorationSize: 'media',
    toothColor: 'A2',
    aestheticLevel: 'alto',
    bruxism: false,
    stratificationNeeded: true,
    resin: null,
    recommendationText: null,
    layers: [],
    checklist: [],
    alerts: [],
    warnings: [],
    confidence: 'alta',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('generateProtocolPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept minimal data + t function and not throw', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData();

    await expect(generateProtocolPDF(data, mockT)).resolves.not.toThrow();
  });

  it('should call pdf.save with correct filename', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({ tooth: '21' });

    await generateProtocolPDF(data, mockT);

    expect(mockSave).toHaveBeenCalledOnce();
    expect(mockSave).toHaveBeenCalledWith('protocolo-21-2026-02-26.pdf');
  });

  it('should render header section (setFillColor for header background)', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData();

    await generateProtocolPDF(data, mockT);

    // renderHeader draws a blue background rect
    expect(mockSetFillColor).toHaveBeenCalledWith(37, 99, 235);
  });

  it('should render case summary section (calls t with caseSummary keys)', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData();

    await generateProtocolPDF(data, mockT);

    expect(mockT).toHaveBeenCalledWith('pdf.caseSummary.title');
    expect(mockT).toHaveBeenCalledWith('pdf.caseSummary.tooth');
  });

  it('should render patient identification when patientName provided', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({ patientName: 'Test Patient' });

    await generateProtocolPDF(data, mockT);

    expect(mockT).toHaveBeenCalledWith('pdf.patient.label');
  });

  it('should skip patient identification when patientName is undefined', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({ patientName: undefined });

    await generateProtocolPDF(data, mockT);

    expect(mockT).not.toHaveBeenCalledWith('pdf.patient.label');
  });

  it('should render protocol layers table when layers are present', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({
      layers: [
        {
          order: 1,
          name: 'Esmalte Palatino',
          resin_brand: 'Z350 XT',
          shade: 'A2E',
          thickness: '0.5mm',
          purpose: 'Esmalte base',
          technique: 'Incremental oblíqua',
        },
      ],
    });

    await generateProtocolPDF(data, mockT);

    expect(mockT).toHaveBeenCalledWith('pdf.protocol.title');
    expect(mockT).toHaveBeenCalledWith('pdf.protocol.layer');
    expect(mockT).toHaveBeenCalledWith('pdf.protocol.resin');
  });

  it('should skip protocol table when layers is empty', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({ layers: [] });

    await generateProtocolPDF(data, mockT);

    expect(mockT).not.toHaveBeenCalledWith('pdf.protocol.title');
  });

  it('should render resin recommendation when resin is provided', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({
      resin: {
        name: 'Filtek Z350 XT',
        manufacturer: '3M',
        type: 'Nanoparticulada',
        opacity: 'Translúcida',
        resistance: 'Alta',
        polishing: 'Excelente',
        aesthetics: 'Excelente',
      },
      recommendationText: 'Resina indicada para anterior estético.',
    });

    await generateProtocolPDF(data, mockT);

    expect(mockT).toHaveBeenCalledWith('pdf.resin.title');
  });

  it('should render signature and footer sections', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData();

    await generateProtocolPDF(data, mockT);

    expect(mockT).toHaveBeenCalledWith('pdf.signature.title');
    expect(mockT).toHaveBeenCalledWith('pdf.footer.disclaimer');
    expect(mockT).toHaveBeenCalledWith('pdf.footer.generatedBy');
  });

  it('should render confidence indicator when confidence is provided', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({ confidence: 'alta' });

    await generateProtocolPDF(data, mockT);

    // Confidence section renders the i18n-resolved level (mockT returns the key itself)
    expect(mockT).toHaveBeenCalledWith('confidence.high.level');
    expect(mockT).toHaveBeenCalledWith('pdf.confidence.label', expect.objectContaining({ level: 'confidence.high.level' }));
  });

  it('should render alternative section when alternative is provided', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({
      alternative: {
        resin: 'Estelite Sigma Quick',
        shade: 'A2',
        technique: 'Bulk fill',
        tradeoff: 'Menor estética, mais rapidez',
      },
    });

    await generateProtocolPDF(data, mockT);

    expect(mockT).toHaveBeenCalledWith('pdf.alternative.title');
  });

  it('should render checklist section when checklist items are present', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({
      checklist: ['Isolamento absoluto', 'Condicionamento ácido 37%'],
    });

    await generateProtocolPDF(data, mockT);

    expect(mockT).toHaveBeenCalledWith('pdf.checklist.title');
  });

  it('should render alerts and warnings when present', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({
      alerts: ['Paciente com bruxismo'],
      warnings: ['Não usar resina fluida'],
    });

    await generateProtocolPDF(data, mockT);

    expect(mockT).toHaveBeenCalledWith('pdf.alerts.title');
    expect(mockT).toHaveBeenCalledWith('pdf.alerts.doNotTitle');
  });

  it('should render DSD analysis when dsdAnalysis is provided', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({
      dsdAnalysis: {
        golden_ratio_compliance: 85,
        symmetry_score: 90,
        smile_line: 'alta',
        buccal_corridor: 'normal',
      },
    });

    await generateProtocolPDF(data, mockT);

    expect(mockT).toHaveBeenCalledWith('pdf.dsd.title');
    expect(mockT).toHaveBeenCalledWith('pdf.dsd.goldenRatio');
    expect(mockT).toHaveBeenCalledWith('pdf.dsd.symmetry');
  });

  it('should render dentist info when provided', async () => {
    const { generateProtocolPDF } = await import('../generatePDF');
    const data = makeMinimalPDFData({
      dentistName: 'Dr. Silva',
      dentistCRO: 'CRO-SP 12345',
    });

    await generateProtocolPDF(data, mockT);

    // dentist name and CRO are rendered via pdf.text directly (not through t())
    expect(mockText).toHaveBeenCalled();
  });
});
