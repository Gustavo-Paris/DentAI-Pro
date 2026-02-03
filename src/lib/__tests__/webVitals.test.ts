import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  setMeasurement: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

// Mock web-vitals
vi.mock('web-vitals', () => ({
  onLCP: vi.fn(),
  onINP: vi.fn(),
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

describe('webVitals', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('measureFlow', () => {
    it('should measure and return the result of an async function', async () => {
      const { measureFlow } = await import('../webVitals');

      const result = await measureFlow('test-flow', async () => {
        return 42;
      });

      expect(result).toBe(42);
    });

    it('should rethrow errors from the measured function', async () => {
      const { measureFlow } = await import('../webVitals');

      await expect(
        measureFlow('test-flow', async () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');
    });

    it('should clean up performance marks after success', async () => {
      const clearMarksSpy = vi.spyOn(performance, 'clearMarks');
      const clearMeasuresSpy = vi.spyOn(performance, 'clearMeasures');

      const { measureFlow } = await import('../webVitals');

      await measureFlow('cleanup-test', async () => 'done');

      expect(clearMarksSpy).toHaveBeenCalledWith('cleanup-test-start');
      expect(clearMarksSpy).toHaveBeenCalledWith('cleanup-test-end');
      expect(clearMeasuresSpy).toHaveBeenCalledWith('flow-cleanup-test');
    });

    it('should clean up performance marks after failure', async () => {
      const clearMarksSpy = vi.spyOn(performance, 'clearMarks');

      const { measureFlow } = await import('../webVitals');

      await measureFlow('fail-test', async () => {
        throw new Error('fail');
      }).catch(() => {});

      expect(clearMarksSpy).toHaveBeenCalledWith('fail-test-start');
      expect(clearMarksSpy).toHaveBeenCalledWith('fail-test-end');
    });
  });

  describe('trackTiming', () => {
    it('should send timing to Sentry', async () => {
      const Sentry = await import('@sentry/react');
      const { trackTiming } = await import('../webVitals');

      trackTiming('test-metric', 123.45);

      expect(Sentry.setMeasurement).toHaveBeenCalledWith('test-metric', 123.45, 'millisecond');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'timing',
          level: 'info',
        })
      );
    });
  });
});
