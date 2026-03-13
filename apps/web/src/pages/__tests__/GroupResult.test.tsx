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

vi.mock('@/hooks/domain/useGroupResult', () => ({
  useGroupResult: vi.fn(() => ({
    primaryEval: {
      id: 'eval-1',
      session_id: 'session-1',
      tooth: '11',
      treatment_type: 'resina',
      budget: 'padrão',
      stratification_protocol: null,
      checklist_progress: [],
    },
    sessionId: 'session-1',
    isLoading: false,
    isError: false,
    groupTeeth: ['11', '12', '13'],
    treatmentType: 'resina',
    currentTreatmentStyle: {
      label: 'Resina Composta',
      icon: () => null,
      bgClass: '',
      borderClass: '',
      iconClass: '',
    },
    resin: {
      name: 'Z350 XT',
      manufacturer: '3M',
      type: 'Nanoparticulada',
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
    dsdAnalysis: null,
    photoUrl: null,
    dsdSimulationUrl: null,
    dsdSimulationLayers: [],
    dsdLayerUrls: {},
    handleChecklistChange: vi.fn(),
    handleMarkAllCompleted: vi.fn(),
    handleRetryProtocol: vi.fn(),
    isRetrying: false,
  })),
}));

vi.mock('@/lib/treatment-config', () => ({
  formatToothLabel: (t: string) => `Dente ${t}`,
}));

vi.mock('@parisgroup-ai/pageshell/composites', () => ({
  DetailPage: ({ children, slots }: any) => (
    <div data-testid="detail-page">
      {slots?.beforeContent}
      {typeof children === 'function' ? children({
        id: 'eval-1',
        budget: 'padrão',
        stratification_protocol: null,
        checklist_progress: [],
      }) : children}
    </div>
  ),
  GenericErrorState: ({ title }: any) => <div data-testid="error-state">{title}</div>,
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
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

vi.mock('@/components/protocol/ProtocolSections', () => ({
  ProtocolSections: () => <div data-testid="protocol-sections" />,
}));

vi.mock('@/components/dsd/CollapsibleDSD', () => ({
  CollapsibleDSD: () => null,
}));

vi.mock('lucide-react', () => ({
  CheckCircle: () => null,
  RefreshCw: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('GroupResult', () => {
  it('renders without crashing', async () => {
    const GroupResult = (await import('../GroupResult')).default;
    const { getByTestId } = render(<GroupResult />, { wrapper });
    expect(getByTestId('detail-page')).toBeTruthy();
  });

  it('renders error state when no primaryEval', async () => {
    const mod = await import('@/hooks/domain/useGroupResult');
    (mod.useGroupResult as any).mockReturnValueOnce({
      primaryEval: null,
      isLoading: false,
      isError: false,
      groupTeeth: [],
      currentTreatmentStyle: { label: '', icon: () => null },
    });
    const GroupResult = (await import('../GroupResult')).default;
    const { getByTestId } = render(<GroupResult />, { wrapper });
    expect(getByTestId('error-state')).toBeTruthy();
  });
});
