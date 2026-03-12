import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // i18n initialization (must be before App)
import { initWebVitals } from "./lib/webVitals";
import { env } from "./lib/env";
import { logger } from "./lib/logger";

// PHI field keys that must never be sent to Sentry (LGPD compliance).
// Covers patient-identifiable and clinical data captured in forms/state.
const PHI_KEYS = new Set([
  // Patient identity
  "name", "nome", "full_name", "patient_name", "paciente", "cpf", "rg",
  "phone", "telefone", "celular", "email", "data_nascimento", "birth_date",
  "address", "endereco", "cep",
  // Clinical / dental data
  "chief_complaint", "queixa_principal", "anamnesis", "anamnese",
  "clinical_notes", "notas_clinicas", "notes", "observations", "observacoes",
  "aesthetic_goals", "objetivos_esteticos", "treatment_notes",
  "medical_history", "historico_medico", "medications", "medicacoes",
  "allergies", "alergias",
  // AI-generated text that may echo patient data
  "prompt", "analysis_text", "protocol_text", "recommendation_text",
]);

// Regex patterns for inline PHI values that may appear anywhere in a string.
const PHI_PATTERNS: RegExp[] = [
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,          // CPF
  /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,  // CNPJ
  /\(\d{2}\)\s?\d{4,5}-?\d{4}/g,                  // BR phone
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // email
];

/** Recursively scrub PHI from any plain object / array / string. */
function scrubPHI(value: unknown, depth = 0): unknown {
  if (depth > 10) return "[pruned]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    let result = value;
    for (const re of PHI_PATTERNS) result = result.replace(re, "[PHI]");
    return result;
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrubPHI(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = PHI_KEYS.has(k.toLowerCase()) ? "[PHI]" : scrubPHI(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** Strip PHI from a Sentry event's breadcrumbs, request body, extra data, exceptions and tags. Mutates the event in-place. */
function sanitizeSentryEvent<T extends Sentry.Event>(event: T): T {
  if (event.breadcrumbs?.values) {
    event.breadcrumbs.values = event.breadcrumbs.values.map((b) => ({
      ...b,
      message: b.message ? String(scrubPHI(b.message)) : b.message,
      data: b.data ? (scrubPHI(b.data) as typeof b.data) : b.data,
    }));
  }
  if (event.request?.data) {
    event.request.data = scrubPHI(event.request.data);
  }
  if (event.extra) {
    event.extra = scrubPHI(event.extra) as typeof event.extra;
  }
  if (event.contexts) {
    event.contexts = scrubPHI(event.contexts) as typeof event.contexts;
  }
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((ex) => ({
      ...ex,
      value: ex.value ? String(scrubPHI(ex.value)) : ex.value,
    }));
  }
  if (event.tags) {
    event.tags = scrubPHI(event.tags) as typeof event.tags;
  }
  return event;
}

// Initialize Sentry for error monitoring (only in production)
Sentry.init({
  dsn: env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD && !!env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  // Performance monitoring
  tracesSampleRate: 0.1,
  // Session replay (configured after lazy-load below)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // LGPD: scrub PHI from error events before transmission
  beforeSend(event) {
    return sanitizeSentryEvent(event);
  },
  // LGPD: scrub PHI from performance transaction breadcrumbs
  beforeSendTransaction(event) {
    return sanitizeSentryEvent(event);
  },
});

// Lazy-load Sentry Replay integration (~30KB gzip savings)
if (import.meta.env.PROD && env.VITE_SENTRY_DSN) {
  Sentry.lazyLoadIntegration('replayIntegration').then(replay => {
    Sentry.addIntegration(replay({
      // LGPD: mask all rendered text and block media in Session Replay.
      // This prevents patient names, clinical notes and images from being
      // captured in the recording sent to Sentry servers.
      maskAllText: true,
      blockAllMedia: true,
      // Additional safeguard: drop any replay recording event whose
      // stringified payload contains a known PHI pattern.
      beforeAddRecordingEvent(event) {
        if (!event.data) return event;
        const payload = JSON.stringify(event.data);
        if (PHI_PATTERNS.some((re) => new RegExp(re.source, re.flags).test(payload))) {
          return null; // drop this recording frame
        }
        return event;
      },
    }));
  });
}

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

// Register service worker for PWA support (autoUpdate — reloads automatically on new version)
if ("serviceWorker" in navigator) {
  registerSW({
    onOfflineReady() {
      logger.log("App ready to work offline");
    },
  });
}
