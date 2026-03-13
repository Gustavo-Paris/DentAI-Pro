import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewAnalysisStep } from '../wizard/ReviewAnalysisStep';
import type { PhotoAnalysisResult, ReviewFormData } from '../wizard/ReviewAnalysisStep';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    },
    i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
  withTranslation: () => (Component: any) => Component,
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

// Mock PatientAutocomplete
vi.mock('@/components/PatientAutocomplete', () => ({
  PatientAutocomplete: ({ value, onChange, label, patients }: any) => (
    <div data-testid="patient-autocomplete">
      <label>{label}</label>
      <input
        data-testid="patient-input"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
      />
    </div>
  ),
}));

// Mock useSpeechToText
vi.mock('@/hooks/useSpeechToText', () => ({
  useSpeechToText: () => ({
    isSupported: false,
    isListening: false,
    transcript: '',
    toggle: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock calculateComplexity
vi.mock('@/lib/complexity-score', () => ({
  calculateComplexity: () => ({ level: 'simples', score: 0 }),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock PillToggle
vi.mock('@/components/pill-toggle', () => ({
  PillToggle: ({ options, value, onChange }: any) => (
    <div data-testid="pill-toggle" data-value={value}>
      {options.map((opt: any) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}>{opt.label}</button>
      ))}
    </div>
  ),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: (date: Date, fmt: string) => '01/01/2000',
}));

vi.mock('date-fns/locale', () => ({
  ptBR: {},
}));

// calculateAge mock moved below with @/lib/date-utils

vi.mock('@/components/calendar', () => ({
  Calendar: () => <div data-testid="calendar" />,
}));

// Mock UI components — consolidated into single pageshell/primitives mock
vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
  Input: (props: any) => <input {...props} />,
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  Textarea: (props: any) => <textarea {...props} />,
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e: any) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>{children}</div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: (props: any) => <span>{props.placeholder || ''}</span>,
  Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children, value }: any) => <div data-testid={`accordion-item-${value}`}>{children}</div>,
  AccordionTrigger: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  toI18nKeySuffix: (value: string) => {
    const stripped = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  },
}));

// Mock skeletons (used in Suspense fallback for lazy-loaded ToothSelectionCard)
vi.mock('@/components/skeletons', () => ({
  ComponentSkeleton: ({ height }: any) => <div data-testid="component-skeleton" style={{ height }} />,
}));

// Mock date-utils (note: NOT dateUtils — the import path changed)
vi.mock('@/lib/date-utils', () => ({
  calculateAge: () => 30,
}));

describe('ReviewAnalysisStep', () => {
  const defaultFormData: ReviewFormData = {
    patientName: '',
    patientAge: '',
    tooth: '11',
    toothRegion: 'mesial',
    cavityClass: 'II',
    restorationSize: 'media',
    vitaShade: 'A2',
    substrate: 'esmalte',
    substrateCondition: 'íntegro',
    enamelCondition: 'bom',
    depth: 'media',
    bruxism: false,
    aestheticLevel: 'estético',
    budget: 'padrão',
    longevityExpectation: '5-10',
    clinicalNotes: '',
    treatmentType: 'resina',
  };

  const singleToothAnalysis: PhotoAnalysisResult = {
    detected: true,
    confidence: 85,
    detected_teeth: [
      {
        tooth: '11',
        tooth_region: 'mesial',
        cavity_class: 'II',
        restoration_size: 'media',
        substrate: 'esmalte',
        substrate_condition: 'integro',
        enamel_condition: 'bom',
        depth: 'media',
        priority: 'alta',
        notes: 'Cavidade profunda',
        treatment_indication: 'resina',
        indication_reason: 'Restauracao direta indicada',
      },
    ],
    primary_tooth: '11',
    vita_shade: 'A2',
    observations: ['Observacao 1'],
    warnings: [],
  };

  const multiToothAnalysis: PhotoAnalysisResult = {
    ...singleToothAnalysis,
    detected_teeth: [
      ...singleToothAnalysis.detected_teeth,
      {
        tooth: '21',
        tooth_region: 'distal',
        cavity_class: 'III',
        restoration_size: 'pequena',
        substrate: 'esmalte',
        substrate_condition: 'integro',
        enamel_condition: 'bom',
        depth: 'rasa',
        priority: 'baixa',
        notes: null,
        treatment_indication: 'porcelana',
        indication_reason: 'Faceta indicada para estetica',
      },
    ],
  };

  const defaultProps = {
    analysisResult: singleToothAnalysis,
    formData: defaultFormData,
    onFormChange: vi.fn(),
    imageBase64: 'data:image/jpeg;base64,test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render title and subtitle', () => {
    render(<ReviewAnalysisStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.review.title')).toBeInTheDocument();
  });

  it('should render AI confidence banner', () => {
    render(<ReviewAnalysisStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.review.aiAnalysis')).toBeInTheDocument();
  });

  it('should render high confidence indicator for >= 80%', () => {
    render(<ReviewAnalysisStep {...defaultProps} />);
    const badge = screen.getByText(/85%/);
    expect(badge).toBeInTheDocument();
  });

  it('should render medium confidence for 60-79%', () => {
    const mediumAnalysis = { ...singleToothAnalysis, confidence: 65 };
    render(<ReviewAnalysisStep {...defaultProps} analysisResult={mediumAnalysis} />);
    expect(screen.getByText(/65%/)).toBeInTheDocument();
  });

  it('should render low confidence for < 60%', () => {
    const lowAnalysis = { ...singleToothAnalysis, confidence: 40 };
    render(<ReviewAnalysisStep {...defaultProps} analysisResult={lowAnalysis} />);
    expect(screen.getByText(/40%/)).toBeInTheDocument();
  });

  it('should render patient data section', () => {
    render(<ReviewAnalysisStep {...defaultProps} />);
    // Patient data is in the 'paciente' tab
    fireEvent.click(screen.getByText('components.wizard.review.tabs.patient'));
    expect(screen.getByText('components.wizard.review.patientData')).toBeInTheDocument();
  });

  it('should render observations when present', () => {
    render(<ReviewAnalysisStep {...defaultProps} />);
    // Observations are in the 'paciente' tab
    fireEvent.click(screen.getByText('components.wizard.review.tabs.patient'));
    expect(screen.getByText('components.wizard.review.aiObservations')).toBeInTheDocument();
    expect(screen.getByText(/Observacao 1/)).toBeInTheDocument();
  });

  it('should not render observations when empty', () => {
    const noObsAnalysis = { ...singleToothAnalysis, observations: [] };
    render(<ReviewAnalysisStep {...defaultProps} analysisResult={noObsAnalysis} />);
    // Switch to paciente tab where observations would appear
    fireEvent.click(screen.getByText('components.wizard.review.tabs.patient'));
    expect(screen.queryByText('components.wizard.review.aiObservations')).not.toBeInTheDocument();
  });

  it('should render warnings when present', () => {
    const warningAnalysis = { ...singleToothAnalysis, warnings: ['Cuidado com bruxismo'] };
    render(<ReviewAnalysisStep {...defaultProps} analysisResult={warningAnalysis} />);
    expect(screen.getByText('components.wizard.review.attentionPoints')).toBeInTheDocument();
    expect(screen.getByText(/Cuidado com bruxismo/)).toBeInTheDocument();
  });

  it('should render multi-tooth selection cards', async () => {
    render(
      <ReviewAnalysisStep
        {...defaultProps}
        analysisResult={multiToothAnalysis}
        selectedTeeth={['11']}
        onSelectedTeethChange={vi.fn()}
      />
    );
    expect(await screen.findByText('components.wizard.review.selectTeethTitle')).toBeInTheDocument();
  });

  it('should render reanalyze button when callback provided', () => {
    const onReanalyze = vi.fn();
    render(
      <ReviewAnalysisStep {...defaultProps} onReanalyze={onReanalyze} />
    );
    expect(screen.getByText('components.wizard.review.reanalyze')).toBeInTheDocument();
  });

  it('should call onReanalyze when button is clicked', () => {
    const onReanalyze = vi.fn();
    render(
      <ReviewAnalysisStep {...defaultProps} onReanalyze={onReanalyze} />
    );
    fireEvent.click(screen.getByText('components.wizard.review.reanalyze'));
    expect(onReanalyze).toHaveBeenCalled();
  });

  it('should render inventory warning when hasInventory is false', () => {
    render(
      <ReviewAnalysisStep {...defaultProps} hasInventory={false} />
    );
    expect(screen.getByText('components.wizard.review.noResins')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.review.registerResins')).toBeInTheDocument();
  });

  it('should not render inventory warning when hasInventory is true', () => {
    render(<ReviewAnalysisStep {...defaultProps} hasInventory={true} />);
    expect(screen.queryByText('components.wizard.review.noResins')).not.toBeInTheDocument();
  });

  it('should render tab bar with all sections', () => {
    render(<ReviewAnalysisStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.review.tabs.teeth')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.review.tabs.treatment')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.review.tabs.patient')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.review.tabs.summary')).toBeInTheDocument();
  });

  it('should render summary card when teeth are selected', () => {
    render(
      <ReviewAnalysisStep
        {...defaultProps}
        analysisResult={multiToothAnalysis}
        selectedTeeth={['11', '21']}
        onSelectedTeethChange={vi.fn()}
        toothTreatments={{ '11': 'resina', '21': 'porcelana' }}
      />
    );
    // Summary card is in the 'resumo' tab
    fireEvent.click(screen.getByText('components.wizard.review.tabs.summary'));
    expect(screen.getByText('components.wizard.review.caseSummary')).toBeInTheDocument();
  });

  it('should not render summary card when no teeth are selected', () => {
    render(
      <ReviewAnalysisStep
        {...defaultProps}
        analysisResult={multiToothAnalysis}
        selectedTeeth={[]}
        onSelectedTeethChange={vi.fn()}
      />
    );
    // Summary card is in the 'resumo' tab
    fireEvent.click(screen.getByText('components.wizard.review.tabs.summary'));
    expect(screen.queryByText('components.wizard.review.caseSummary')).not.toBeInTheDocument();
  });

  it('should render porcelain banner when treatment indication is porcelana', () => {
    const porcelainAnalysis = {
      ...singleToothAnalysis,
      treatment_indication: 'porcelana' as const,
      indication_reason: 'Indicado porcelana',
    };
    render(
      <ReviewAnalysisStep {...defaultProps} analysisResult={porcelainAnalysis} />
    );
    expect(screen.getByText('components.wizard.review.porcelainTitle')).toBeInTheDocument();
    expect(screen.getByText('Indicado porcelana')).toBeInTheDocument();
  });

  it('should render whitening badge when level is not natural', () => {
    render(
      <ReviewAnalysisStep {...defaultProps} whiteningLevel="hollywood" />
    );
    expect(screen.getByText('components.wizard.review.whiteningLevel')).toBeInTheDocument();
  });

  it('should not render whitening badge when level is natural', () => {
    render(
      <ReviewAnalysisStep {...defaultProps} whiteningLevel="natural" />
    );
    expect(screen.queryByText('components.wizard.review.whiteningLevel')).not.toBeInTheDocument();
  });

  it('should render DSD aesthetic notes when dsdSuggestions are provided', () => {
    render(
      <ReviewAnalysisStep
        {...defaultProps}
        dsdSuggestions={[{ tooth: '11', current_issue: 'Desgaste', proposed_change: 'Faceta' }]}
      />
    );
    // DSD aesthetic notes are in the 'resumo' tab
    fireEvent.click(screen.getByText('components.wizard.review.tabs.summary'));
    expect(screen.getByText('components.wizard.review.aestheticNotesDSD')).toBeInTheDocument();
  });
});
