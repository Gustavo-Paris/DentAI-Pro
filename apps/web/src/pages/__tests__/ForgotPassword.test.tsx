import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@/data/auth', () => ({
  resetPasswordForEmail: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Input: (p: any) => <input {...p} />,
  Label: ({ children }: any) => <label>{children}</label>,
}));

vi.mock('@/components/auth/AuthLayout', () => ({
  AuthLayout: ({ children, title }: any) => (
    <div data-testid="auth-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('@/components/shared/IconCircle', () => ({
  IconCircle: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Loader2: () => null,
  Mail: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('ForgotPassword', () => {
  it('renders without crashing', async () => {
    const ForgotPassword = (await import('../ForgotPassword')).default;
    const { getByTestId } = render(<ForgotPassword />, { wrapper });
    expect(getByTestId('auth-layout')).toBeTruthy();
  });

  it('renders form with email input', async () => {
    const ForgotPassword = (await import('../ForgotPassword')).default;
    render(<ForgotPassword />, { wrapper });
    expect(screen.getByPlaceholderText('auth.emailPlaceholder')).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    const { toast } = await import('sonner');
    const ForgotPassword = (await import('../ForgotPassword')).default;
    render(<ForgotPassword />, { wrapper });

    const emailInput = screen.getByPlaceholderText('auth.emailPlaceholder');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    // After submission, the "send again" button should appear
    expect(screen.getByText('auth.sendAgain')).toBeInTheDocument();
  });

  it('handles submission error', async () => {
    const { resetPasswordForEmail } = await import('@/data/auth');
    (resetPasswordForEmail as any).mockResolvedValueOnce({ error: { message: 'Error occurred' } });
    const { toast } = await import('sonner');
    const ForgotPassword = (await import('../ForgotPassword')).default;
    render(<ForgotPassword />, { wrapper });

    const emailInput = screen.getByPlaceholderText('auth.emailPlaceholder');
    fireEvent.change(emailInput, { target: { value: 'bad@example.com' } });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('allows resending email after success', async () => {
    const ForgotPassword = (await import('../ForgotPassword')).default;
    render(<ForgotPassword />, { wrapper });

    const emailInput = screen.getByPlaceholderText('auth.emailPlaceholder');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('auth.sendAgain')).toBeInTheDocument();
    });

    // Click "send again" to go back to the form
    fireEvent.click(screen.getByText('auth.sendAgain'));
    expect(screen.getByPlaceholderText('auth.emailPlaceholder')).toBeInTheDocument();
  });
});
