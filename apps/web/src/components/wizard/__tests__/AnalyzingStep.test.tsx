import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyzingStep } from '../AnalyzingStep';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return {
    Sparkles: S, RefreshCw: S, ArrowRight: S, ArrowLeft: S,
    Lightbulb: S, AlertCircle: S, X: S, Check: S,
  };
});

vi.mock('@/components/ProgressRing', () => ({
  ProgressRing: ({ progress }: any) => <div data-testid="progress-ring">{progress}%</div>,
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('AnalyzingStep', () => {
  const defaultProps = {
    imageBase64: 'data:image/jpeg;base64,abc123',
    isAnalyzing: true,
    analysisError: null,
    onRetry: vi.fn(),
    onSkipToReview: vi.fn(),
  };

  it('renders analyzing state with progress', () => {
    render(<AnalyzingStep {...defaultProps} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.analyzing.analyzingTitle')).toBeInTheDocument();
    expect(screen.getByTestId('progress-ring')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders step checklist', () => {
    render(<AnalyzingStep {...defaultProps} />);
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(6);
  });

  it('renders error state with retry and skip buttons', () => {
    render(
      <AnalyzingStep
        {...defaultProps}
        isAnalyzing={false}
        analysisError="Photo quality too low"
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Photo quality too low')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.analyzing.retry')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.analyzing.skipToManual')).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', () => {
    const onRetry = vi.fn();
    render(
      <AnalyzingStep
        {...defaultProps}
        isAnalyzing={false}
        analysisError="Error"
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByText('components.wizard.analyzing.retry'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders back button when onBack provided', () => {
    const onBack = vi.fn();
    render(
      <AnalyzingStep
        {...defaultProps}
        isAnalyzing={false}
        analysisError="Error"
        onBack={onBack}
      />,
    );
    fireEvent.click(screen.getByText('common.back'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders cancel button when onCancel provided', () => {
    const onCancel = vi.fn();
    render(
      <AnalyzingStep
        {...defaultProps}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('components.wizard.analyzing.cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders without image', () => {
    render(
      <AnalyzingStep
        {...defaultProps}
        imageBase64={null}
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows error state photo when imageBase64 provided', () => {
    render(
      <AnalyzingStep
        {...defaultProps}
        isAnalyzing={false}
        analysisError="Error"
      />,
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
