import "@testing-library/jest-dom";
import { vi } from "vitest";

// Global react-i18next mock — provides initReactI18next and useTranslation
// Individual tests can override with their own vi.mock('react-i18next', ...)
vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: Record<string, unknown>) => {
        if (params) return `${key}:${JSON.stringify(params)}`;
        return key;
      },
      i18n: { language: "pt-BR", changeLanguage: vi.fn() },
    }),
    Trans: ({ children }: { children: React.ReactNode }) => children,
  };
});

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
