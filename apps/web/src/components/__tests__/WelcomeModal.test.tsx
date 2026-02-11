import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeModal, WELCOME_STORAGE_KEY } from '../onboarding/WelcomeModal';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    },
    i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

// Mock branding
vi.mock('@/lib/branding', () => ({
  BRAND_NAME: 'ToSmile.ai',
  WELCOME_STORAGE_KEY: 'tosmile-welcome-dismissed',
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog" role="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('WelcomeModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onTrySample: vi.fn(),
    onCreateCase: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render when open is true', () => {
    render(<WelcomeModal {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<WelcomeModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('should render the first slide with welcome text', () => {
    render(<WelcomeModal {...defaultProps} />);
    expect(screen.getByText('components.onboarding.welcome.welcomeTo')).toBeInTheDocument();
    expect(screen.getByText('ToSmile.ai')).toBeInTheDocument();
  });

  it('should render the description on first slide', () => {
    render(<WelcomeModal {...defaultProps} />);
    expect(screen.getByText('components.onboarding.welcome.description')).toBeInTheDocument();
  });

  it('should render navigation dots', () => {
    render(<WelcomeModal {...defaultProps} />);
    const dots = screen.getAllByLabelText(/components\.onboarding\.welcome\.slideLabel/);
    expect(dots).toHaveLength(3);
  });

  it('should render next button on first slide', () => {
    render(<WelcomeModal {...defaultProps} />);
    expect(screen.getByText('components.onboarding.welcome.next')).toBeInTheDocument();
  });

  it('should navigate to second slide when next is clicked', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    expect(screen.getByText('components.onboarding.welcome.howItWorks')).toBeInTheDocument();
  });

  it('should navigate to third slide and show CTA buttons', () => {
    render(<WelcomeModal {...defaultProps} />);
    // Click next twice
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));

    // Third slide should show CTA buttons
    expect(screen.getByText('components.onboarding.welcome.trySample')).toBeInTheDocument();
    expect(screen.getByText('components.onboarding.welcome.createEvaluation')).toBeInTheDocument();
  });

  it('should call onTrySample and save to localStorage when try sample is clicked', () => {
    render(<WelcomeModal {...defaultProps} />);
    // Navigate to last slide
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));

    fireEvent.click(screen.getByText('components.onboarding.welcome.trySample'));
    expect(defaultProps.onTrySample).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(localStorage.getItem(WELCOME_STORAGE_KEY)).toBe('true');
  });

  it('should call onCreateCase and save to localStorage when create case is clicked', () => {
    render(<WelcomeModal {...defaultProps} />);
    // Navigate to last slide
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));

    fireEvent.click(screen.getByText('components.onboarding.welcome.createEvaluation'));
    expect(defaultProps.onCreateCase).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(localStorage.getItem(WELCOME_STORAGE_KEY)).toBe('true');
  });

  it('should render back button on second slide', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    expect(screen.getByText('components.onboarding.welcome.back')).toBeInTheDocument();
  });

  it('should go back when back button is clicked', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    expect(screen.getByText('components.onboarding.welcome.howItWorks')).toBeInTheDocument();

    fireEvent.click(screen.getByText('components.onboarding.welcome.back'));
    expect(screen.getByText('components.onboarding.welcome.description')).toBeInTheDocument();
  });

  it('should render skip button on last slide', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    expect(screen.getByText('components.onboarding.welcome.skip')).toBeInTheDocument();
  });

  it('should dismiss modal and save to localStorage when skip is clicked', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));

    fireEvent.click(screen.getByText('components.onboarding.welcome.skip'));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(localStorage.getItem(WELCOME_STORAGE_KEY)).toBe('true');
  });

  it('should navigate to specific slide when dot is clicked', () => {
    render(<WelcomeModal {...defaultProps} />);
    const dots = screen.getAllByLabelText(/components\.onboarding\.welcome\.slideLabel/);
    // Click third dot
    fireEvent.click(dots[2]);
    expect(screen.getByText('components.onboarding.welcome.getStarted')).toBeInTheDocument();
  });

  it('should render how-it-works step labels on second slide', () => {
    render(<WelcomeModal {...defaultProps} />);
    fireEvent.click(screen.getByText('components.onboarding.welcome.next'));
    expect(screen.getByText('components.onboarding.welcome.photoStep')).toBeInTheDocument();
    expect(screen.getByText('components.onboarding.welcome.aiStep')).toBeInTheDocument();
    expect(screen.getByText('components.onboarding.welcome.protocolStep')).toBeInTheDocument();
  });

  it('should export WELCOME_STORAGE_KEY', () => {
    expect(WELCOME_STORAGE_KEY).toBe('tosmile-welcome-dismissed');
  });
});
