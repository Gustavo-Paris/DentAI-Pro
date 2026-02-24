// Production-safe logger for Edge Functions
const isDev = Deno.env.get("ENVIRONMENT") !== "production";

/** Redact email addresses from log messages (LGPD compliance). */
function sanitize(msg: string): string {
  return msg.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[REDACTED_EMAIL]',
  );
}

/** Sanitize string arguments, pass objects through unchanged. */
function sanitizeArgs(args: unknown[]): unknown[] {
  return args.map((a) => (typeof a === 'string' ? sanitize(a) : a));
}

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...sanitizeArgs(args));
  },
  warn: (...args: unknown[]) => {
    // Warnings are always logged
    console.warn(...sanitizeArgs(args));
  },
  error: (...args: unknown[]) => {
    // Errors are always logged
    console.error(...sanitizeArgs(args));
  },
  info: (...args: unknown[]) => {
    // Always log info (includes token usage for cost monitoring)
    console.info(...sanitizeArgs(args));
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[DEBUG]', ...sanitizeArgs(args));
  },
  // Always log important operations even in production
  important: (...args: unknown[]) => {
    console.log('[IMPORTANT]', ...sanitizeArgs(args));
  },
};

export default logger;
