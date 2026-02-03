import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "./lib/webVitals";
import { env } from "./lib/env";

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

// Initialize Web Vitals monitoring (LCP, FID, CLS, etc.)
initWebVitals();

createRoot(document.getElementById("root")!).render(<App />);
