import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // i18n initialization (must be before App)
import { initWebVitals } from "./lib/webVitals";
import { env } from "./lib/env";
import { logger } from "./lib/logger";

// Initialize Sentry for error monitoring (only in production)
Sentry.init({
  dsn: env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD && !!env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance monitoring
  tracesSampleRate: 0.1,
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Capture unhandled errors outside the React tree
window.addEventListener("unhandledrejection", (event) => {
  Sentry.captureException(event.reason ?? new Error("Unhandled promise rejection"), {
    tags: { mechanism: "unhandledrejection" },
  });
});

window.addEventListener("error", (event) => {
  // Only capture errors not already caught by React's ErrorBoundary
  if (event.error) {
    Sentry.captureException(event.error, {
      tags: { mechanism: "window.onerror" },
    });
  }
});

// Initialize Web Vitals monitoring (LCP, FID, CLS, etc.)
initWebVitals();

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast("Nova versão disponível", {
        description: "Atualize para obter as últimas melhorias.",
        duration: Infinity,
        action: {
          label: "Atualizar",
          onClick: () => updateSW(true),
        },
      });
    },
    onOfflineReady() {
      logger.log("App ready to work offline");
    },
  });
}
