import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@/hooks/domain/useResult', () => ({
  useResult: vi.fn(() => ({
    evaluation: {
      id: 'eval-1',
      session_id: 'session-1',
      tooth: '11',
      region: 'anterior',
      treatment_type: 'resina',
      tooth_color: 'A2',
      aesthetic_level: 'alto',
      bruxism: false,
      budget: 'padrão',
      created_at: '2026-03-12T00:00:00Z',
      has_inventory_at_creation: true,
      stratification_needed: false,
      recommendation_text: 'Test recommendation',
      is_from_inventory: false,
      patient_aesthetic_goals: null,
      dsd_analysis: null,
      cavity_class: 'III',
      restoration_size: 'medio',
      patient_age: 30,
      ai_indication_reason: null,
      checklist_progress: [],
      stratification_protocol: null,
    },
    isLoading: false,
    isError: false,
    treatmentType: 'resina',
    currentTreatmentStyle: {
      label: 'Resina Composta',
      icon: () => null,
      bgClass: '',
      borderClass: '',
      iconClass: '',
      badgeVariant: 'secondary',
    },
    resin: {
      name: 'Z350 XT',
      manufacturer: '3M',
      type: 'Nanoparticulada',
      opacity: 'Translúcido',
      resistance: 'Alta',
      polishing: 'Excelente',
      aesthetics: 'Alto',
    },
    hasProtocol: true,
    layers: [],
    genericProtocol: null,
    cementationProtocol: null,
    protocolAlternative: null,
    checklist: [],
    alerts: [],
    warnings: [],
    confidence: 0.9,
    isPorcelain: false,
    isSpecialTreatment: false,
    idealResin: null,
    showIdealResin: false,
    alternatives: [],
    generatingPDF: false,
    handleExportPDF: vi.fn(),
    handlePdfButtonClick: vi.fn(),
    handleChecklistChange: vi.fn(),
    showPdfConfirmDialog: false,
    setShowPdfConfirmDialog: vi.fn(),
    photoUrls: { frontal: null, angle45: null, face: null },
    dsdSimulationUrl: null,
    dsdSimulationLayers: [],
    dsdLayerUrls: {},
  })),
}));

vi.mock('@/lib/branding', () => ({
  BRAND_NAME: 'ToSmile.ai',
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/lib/treatment-config', () => ({
  formatToothLabel: (t: string) => `Dente ${t}`,
}));

vi.mock('date-fns', () => ({
  format: () => '12/03/2026',
}));

vi.mock('@/lib/date-utils', () => ({
  getDateLocale: () => ({}),
  getDateFormat: () => 'dd/MM/yyyy',
}));

vi.mock('@parisgroup-ai/pageshell/composites', () => ({
  DetailPage: ({ children, slots }: any) => (
    <div data-testid="detail-page">
      {slots?.beforeContent}
      {typeof children === 'function' ? children({
        id: 'eval-1',
        session_id: 'session-1',
        tooth: '11',
        region: 'anterior',
        treatment_type: 'resina',
        budget: 'padrão',
        created_at: '2026-03-12T00:00:00Z',
        has_inventory_at_creation: true,
        recommendation_text: 'Test',
        is_from_inventory: false,
        patient_aesthetic_goals: null,
        dsd_analysis: null,
        tooth_color: 'A2',
        aesthetic_level: 'alto',
        bruxism: false,
        stratification_needed: false,
        cavity_class: 'III',
        restoration_size: 'medio',
        patient_age: 30,
        ai_indication_reason: null,
        checklist_progress: [],
        stratification_protocol: null,
      }) : children}
    </div>
  ),
  GenericErrorState: ({ title }: any) => <div data-testid="error-state">{title}</div>,
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Card: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@parisgroup-ai/pageshell/interactions', () => ({
  PageConfirmDialog: () => null,
}));

vi.mock('@/components/ProtocolUnavailableAlert', () => ({
  ProtocolUnavailableAlert: () => null,
}));

vi.mock('@/components/protocol/CaseSummaryBox', () => ({
  default: () => <div data-testid="case-summary" />,
}));

vi.mock('@/components/protocol/WhiteningPreferenceAlert', () => ({
  default: () => null,
}));

vi.mock('@/components/protocol/BruxismAlert', () => ({
  BruxismAlert: () => null,
}));

vi.mock('@/components/protocol/ProtocolSections', () => ({
  ProtocolSections: () => <div data-testid="protocol-sections" />,
}));

vi.mock('@/components/dsd/CollapsibleDSD', () => ({
  CollapsibleDSD: () => null,
}));

vi.mock('@/components/LoadingOverlay', () => ({
  LoadingOverlay: () => null,
}));

vi.mock('lucide-react', () => ({
  Download: () => null,
  Plus: () => null,
  CheckCircle: () => null,
  Package: () => null,
  Sparkles: () => null,
  Loader2: () => null,
  Heart: () => null,
  AlertTriangle: () => null,
  RefreshCw: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Result', () => {
  it('renders without crashing', async () => {
    const Result = (await import('../Result')).default;
    const { getByTestId } = render(<Result />, { wrapper });
    expect(getByTestId('detail-page')).toBeTruthy();
  });

  it('renders error state when no evaluation', async () => {
    const mod = await import('@/hooks/domain/useResult');
    (mod.useResult as any).mockReturnValueOnce({
      evaluation: null,
      isLoading: false,
      isError: false,
      currentTreatmentStyle: { label: '', icon: () => null },
    });
    const Result = (await import('../Result')).default;
    const { getByTestId } = render(<Result />, { wrapper });
    expect(getByTestId('error-state')).toBeTruthy();
  });
});
