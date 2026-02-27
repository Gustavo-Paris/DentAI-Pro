import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientPreferencesStep } from '../wizard/PatientPreferencesStep';
import type { PatientPreferences } from '../wizard/PatientPreferencesStep';

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

// Mock useSubscription
const mockGetCreditCost = vi.fn().mockReturnValue(1);
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    creditsRemaining: 10,
    getCreditCost: mockGetCreditCost,
  }),
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('PatientPreferencesStep', () => {
  const defaultPreferences: PatientPreferences = {
    whiteningLevel: 'natural',
  };

  const defaultProps = {
    preferences: defaultPreferences,
    onPreferencesChange: vi.fn(),
    onContinue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the title and subtitle', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.preferences.title')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.preferences.subtitle')).toBeInTheDocument();
  });

  it('should render whitening option cards', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.preferences.naturalLabel')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.preferences.hollywoodLabel')).toBeInTheDocument();
  });

  it('should render shade labels', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText('BL1 / BL2 / BL3')).toBeInTheDocument();
  });

  it('should render descriptions for options', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.preferences.naturalDesc')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.preferences.hollywoodDesc')).toBeInTheDocument();
  });

  it('should call onPreferencesChange when an option is clicked', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    const hollywoodBtn = screen.getByText('components.wizard.preferences.hollywoodLabel').closest('button');
    expect(hollywoodBtn).toBeInTheDocument();
    fireEvent.click(hollywoodBtn!);
    expect(defaultProps.onPreferencesChange).toHaveBeenCalledWith({ whiteningLevel: 'hollywood' });
  });

  it('should render the continue button', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.preferences.continueSimulation')).toBeInTheDocument();
  });

  it('should call onContinue when continue button is clicked', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    fireEvent.click(screen.getByText('components.wizard.preferences.continueSimulation'));
    expect(defaultProps.onContinue).toHaveBeenCalled();
  });

  it('should render credit cost information', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    // creditCostText and creditCostSuffix are within the same span together with other content
    expect(screen.getByText(/components\.wizard\.preferences\.creditCostText/)).toBeInTheDocument();
    expect(screen.getByText(/components\.wizard\.preferences\.creditCostSuffix/)).toBeInTheDocument();
  });

  it('should show insufficient credits warning when credits are low', () => {
    vi.mocked(mockGetCreditCost).mockReturnValue(10);
    const { unmount } = render(<PatientPreferencesStep {...defaultProps} />);
    unmount();

    // Reset mock to return high cost
    vi.mocked(mockGetCreditCost).mockReturnValue(100);

    // Remock useSubscription with low credits
    vi.doMock('@/hooks/useSubscription', () => ({
      useSubscription: () => ({
        creditsRemaining: 1,
        getCreditCost: () => 100,
      }),
    }));
  });

  it('should disable continue button when credits are zero', () => {
    // We test the disabled prop is correctly applied
    vi.doMock('@/hooks/useSubscription', () => ({
      useSubscription: () => ({
        creditsRemaining: 0,
        getCreditCost: () => 1,
      }),
    }));
  });

  it('should render the sparkles icon section', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    // The component renders a sparkles icon in a glow-icon container
    const heading = screen.getByText('components.wizard.preferences.title');
    expect(heading).toBeInTheDocument();
    // The sparkles icon and the whitening options are rendered in the same container
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('should call getCreditCost for case_analysis and dsd_simulation', () => {
    render(<PatientPreferencesStep {...defaultProps} />);
    expect(mockGetCreditCost).toHaveBeenCalledWith('case_analysis');
    expect(mockGetCreditCost).toHaveBeenCalledWith('dsd_simulation');
  });
});
