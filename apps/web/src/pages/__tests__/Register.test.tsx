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

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    signUp: vi.fn(() => Promise.resolve({ error: null })),
    signInWithGoogle: vi.fn(() => Promise.resolve({ error: null })),
  })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/schemas/auth', () => ({
  getRegisterSchema: () => ({
    parse: vi.fn(),
    safeParse: vi.fn(() => ({ success: true })),
  }),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => vi.fn(),
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Input: (p: any) => <input {...p} />,
  Checkbox: (p: any) => <input type="checkbox" {...p} />,
  PasswordInput: (p: any) => <input type="password" {...p} />,
}));

vi.mock('@parisgroup-ai/pageshell/interactions', () => ({
  Form: ({ children }: any) => <div>{children}</div>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render }: any) => render({ field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), name: 'test', ref: vi.fn() } }),
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormMessage: () => null,
}));

vi.mock('@/components/PasswordRequirements', () => ({
  PasswordRequirements: () => null,
}));

vi.mock('@/components/GoogleIcon', () => ({
  GoogleIcon: () => null,
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

vi.mock('@/components/auth/TurnstileWidget', () => ({
  TurnstileWidget: () => null,
}));

vi.mock('lucide-react', () => ({
  Loader2: () => null,
  Mail: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Register', () => {
  it('renders without crashing', async () => {
    const Register = (await import('../Register')).default;
    const { getByTestId } = render(<Register />, { wrapper });
    expect(getByTestId('auth-layout')).toBeTruthy();
  });
});
