/* eslint-disable no-console */
// Production-safe logger that only logs in development
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Errors are always logged (for monitoring)
    console.error(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  // Verbose debug logging — dev-only, prefixed with [DEBUG] for easy filtering.
  // (Originally named edgeDebug; renamed to debug for clarity in the web logger.)
  verboseDebug: (...args: unknown[]) => {
    if (isDev) console.log('[DEBUG]', ...args);
  },
};

export default logger;
