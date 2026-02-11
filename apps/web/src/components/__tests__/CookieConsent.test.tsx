import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CookieConsent from '../CookieConsent';
import translations from '@/locales/pt-BR.json';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  getClient: () => ({
    getIntegrationByName: () => null,
  }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const parts = key.split('.');
      let value: unknown = translations;
      for (const part of parts) {
        value = (value as Record<string, unknown>)?.[part];
      }
      return (value as string) ?? key;
    },
    i18n: { language: 'pt-BR' },
  }),
}));

// Mock the Button component to avoid shadcn dependency chain
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.ComponentPropsWithoutRef<'button'>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render banner when no consent stored', () => {
    render(<CookieConsent />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aceitar todos/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apenas essenciais/ })).toBeInTheDocument();
  });

  it('should not render when consent is already accepted', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    render(<CookieConsent />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should not render when consent is already essential', () => {
    localStorage.setItem('cookie-consent', 'essential');
    render(<CookieConsent />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should save "accepted" and hide on accept click', () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole('button', { name: /Aceitar todos/ }));
    expect(localStorage.getItem('cookie-consent')).toBe('accepted');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should save "essential" and hide on essential click', () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole('button', { name: /Apenas essenciais/ }));
    expect(localStorage.getItem('cookie-consent')).toBe('essential');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should mention LGPD in the banner text', () => {
    render(<CookieConsent />);
    expect(screen.getByText(/LGPD/)).toBeInTheDocument();
  });
});
