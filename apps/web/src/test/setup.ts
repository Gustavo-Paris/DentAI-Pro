import "@testing-library/jest-dom";
import { vi } from "vitest";

// Global react-i18next mock — provides initReactI18next and useTranslation
// Individual tests can override with their own vi.mock('react-i18next', ...)
// Global react-i18next mock — provides initReactI18next (no-op), useTranslation, Trans.
// IMPORTANT: Do NOT use importOriginal here — loading the real react-i18next module
// triggers side effects (React context setup, Suspense) that hang in test workers.
// Tests that need additional exports should add their own vi.mock override.
vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string, paramsOrDefault?: Record<string, unknown> | string) => {
      if (typeof paramsOrDefault === 'object' && paramsOrDefault !== null) {
        return `${key}:${JSON.stringify(paramsOrDefault)}`;
      }
      return key;
    },
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
  withTranslation: () => (Component: any) => Component,
}));

// Node 22+ ships a built-in localStorage that may lack .clear() when
// --localstorage-file is not properly configured. Provide a full polyfill
// so tests can rely on localStorage.clear() / getItem / setItem everywhere.
(() => {
  let store: Record<string, string> = {};
  const mock: Storage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', { value: mock, writable: true, configurable: true });
})();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList,
});
