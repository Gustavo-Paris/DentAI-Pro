import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  const originalEnv = import.meta.env.DEV;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should always log errors regardless of environment', async () => {
    // Re-import to get fresh module
    const { logger } = await import('../logger');
    logger.error('test error');
    expect(console.error).toHaveBeenCalledWith('test error');
  });

  it('should export all log methods', async () => {
    const { logger } = await import('../logger');
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.edgeDebug).toBe('function');
  });

  it('should not throw when called with multiple arguments', async () => {
    const { logger } = await import('../logger');
    expect(() => logger.error('error', { details: 'test' }, 123)).not.toThrow();
    expect(() => logger.log('log', 'extra')).not.toThrow();
  });
});
