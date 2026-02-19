// Production-safe logger for Edge Functions
const isDev = Deno.env.get("ENVIRONMENT") !== "production";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    // Warnings are always logged
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Errors are always logged
    console.error(...args);
  },
  info: (...args: unknown[]) => {
    // Always log info (includes token usage for cost monitoring)
    console.info(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[DEBUG]', ...args);
  },
  // Always log important operations even in production
  important: (...args: unknown[]) => {
    console.log('[IMPORTANT]', ...args);
  },
};

export default logger;
