import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingProgress } from '../onboarding/OnboardingProgress';

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

// Mock useOnboardingProgress
const mockSteps = [
  {
    id: 'first-case',
    label: 'Criar primeiro caso',
    description: 'Tire uma foto e gere um protocolo',
    href: '/evaluations/new',
    completed: true,
  },
  {
    id: 'first-patient',
    label: 'Cadastrar paciente',
    description: 'Adicione seu primeiro paciente',
    href: '/patients',
    completed: false,
  },
  {
    id: 'inventory',
    label: 'Configurar inventario',
    description: 'Adicione suas resinas favoritas',
    href: '/inventory',
    completed: false,
  },
];

let mockOnboardingState = {
  steps: mockSteps,
  completionPercentage: 33,
  allComplete: false,
  nextStep: mockSteps[1],
  loading: false,
};

vi.mock('@/hooks/domain/useOnboardingProgress', () => ({
  useOnboardingProgress: () => mockOnboardingState,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('OnboardingProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnboardingState = {
      steps: mockSteps,
      completionPercentage: 33,
      allComplete: false,
      nextStep: mockSteps[1],
      loading: false,
    };
  });

  it('should render the progress header', () => {
    render(<OnboardingProgress />);
    expect(screen.getByText('components.onboarding.progress.firstSteps')).toBeInTheDocument();
  });

  it('should render completion count', () => {
    render(<OnboardingProgress />);
    expect(screen.getByText(
      /components\.onboarding\.progress\.completedOf/
    )).toBeInTheDocument();
  });

  it('should render all step labels', () => {
    render(<OnboardingProgress />);
    expect(screen.getByText('Criar primeiro caso')).toBeInTheDocument();
    expect(screen.getByText('Cadastrar paciente')).toBeInTheDocument();
    expect(screen.getByText('Configurar inventario')).toBeInTheDocument();
  });

  it('should render all step descriptions', () => {
    render(<OnboardingProgress />);
    expect(screen.getByText('Tire uma foto e gere um protocolo')).toBeInTheDocument();
    expect(screen.getByText('Adicione seu primeiro paciente')).toBeInTheDocument();
    expect(screen.getByText('Adicione suas resinas favoritas')).toBeInTheDocument();
  });

  it('should render step links with correct hrefs', () => {
    render(<OnboardingProgress />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/evaluations/new');
    expect(links[1]).toHaveAttribute('href', '/patients');
    expect(links[2]).toHaveAttribute('href', '/inventory');
  });

  it('should return null when loading', () => {
    mockOnboardingState = { ...mockOnboardingState, loading: true };
    const { container } = render(<OnboardingProgress />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null when all steps are complete', () => {
    mockOnboardingState = { ...mockOnboardingState, allComplete: true };
    const { container } = render(<OnboardingProgress />);
    expect(container.firstChild).toBeNull();
  });

  it('should render progress bar', () => {
    const { container } = render(<OnboardingProgress />);
    const progressBar = container.querySelector('.bg-primary.rounded-full');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '33%' });
  });
});
