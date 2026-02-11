import { vi } from 'vitest';

/**
 * Shared mock factory for react-i18next.
 *
 * Usage:
 *   vi.mock('react-i18next', () => mockI18n());
 */
export function mockI18n() {
  return {
    useTranslation: () => ({
      t: (key: string, params?: Record<string, unknown>) => {
        if (params) return `${key}:${JSON.stringify(params)}`;
        return key;
      },
      i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
    }),
    Trans: ({ children }: { children: unknown }) => children,
  };
}
