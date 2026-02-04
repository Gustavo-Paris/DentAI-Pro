/* eslint-disable @typescript-eslint/no-explicit-any */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function createLogMethod(level: LogLevel) {
  return (...args: any[]) => {
    console[level](`[${level.toUpperCase()}]`, ...args);
  };
}

export const logger = {
  debug: createLogMethod('debug'),
  info: createLogMethod('info'),
  warn: createLogMethod('warn'),
  error: createLogMethod('error'),
  log: createLogMethod('info'),
};
