import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry
const mockSetMeasurement = vi.fn();
const mockAddBreadcrumb = vi.fn();

vi.mock('@sentry/react', () => ({
  setMeasurement: (...args: unknown[]) => mockSetMeasurement(...args),
  addBreadcrumb: (...args: unknown[]) => mockAddBreadcrumb(...args),
}));

// Capture the callbacks passed to web-vitals
const mockOnLCP = vi.fn();
const mockOnINP = vi.fn();
const mockOnCLS = vi.fn();
const mockOnFCP = vi.fn();
const mockOnTTFB = vi.fn();

vi.mock('web-vitals', () => ({
  onLCP: (...args: unknown[]) => mockOnLCP(...args),
  onINP: (...args: unknown[]) => mockOnINP(...args),
  onCLS: (...args: unknown[]) => mockOnCLS(...args),
  onFCP: (...args: unknown[]) => mockOnFCP(...args),
  onTTFB: (...args: unknown[]) => mockOnTTFB(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), log: vi.fn(), info: vi.fn() },
}));

describe('webVitals - additional coverage', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initWebVitals', () => {
    it('should register all 5 web-vital handlers in production', async () => {
      // Simulate production mode
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      const { initWebVitals } = await import('../webVitals');
      initWebVitals();

      expect(mockOnLCP).toHaveBeenCalledOnce();
      expect(mockOnINP).toHaveBeenCalledOnce();
      expect(mockOnCLS).toHaveBeenCalledOnce();
      expect(mockOnFCP).toHaveBeenCalledOnce();
      expect(mockOnTTFB).toHaveBeenCalledOnce();
    });

    it('should register handlers when VITE_ENABLE_VITALS is set', async () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('DEV', false);
      vi.stubEnv('VITE_ENABLE_VITALS', 'true');

      const { initWebVitals } = await import('../webVitals');
      initWebVitals();

      expect(mockOnLCP).toHaveBeenCalledOnce();
    });

    it('should skip registration in dev without VITE_ENABLE_VITALS', async () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('DEV', true);
      vi.stubEnv('VITE_ENABLE_VITALS', '');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { initWebVitals } = await import('../webVitals');
      initWebVitals();

      expect(mockOnLCP).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Disabled in development'));
    });

    it('should catch and log errors during initialization', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      mockOnLCP.mockImplementation(() => { throw new Error('web-vitals init failed'); });

      const { initWebVitals } = await import('../webVitals');
      const { logger } = await import('@/lib/logger');

      initWebVitals();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize'),
        expect.any(Error),
      );
    });
  });

  describe('sendToSentry (via metric callbacks)', () => {
    it('should send LCP metric with millisecond unit', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      const { initWebVitals } = await import('../webVitals');
      initWebVitals();

      // Get the callback passed to onLCP
      const lcpCallback = mockOnLCP.mock.calls[0][0];
      lcpCallback({ name: 'LCP', value: 2000, id: 'v1', navigationType: 'navigate' });

      expect(mockSetMeasurement).toHaveBeenCalledWith('LCP', 2000, 'millisecond');
      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'web-vital',
          level: 'info',
          data: expect.objectContaining({ name: 'LCP', value: 2000, rating: 'good' }),
        }),
      );
    });

    it('should send CLS metric with empty unit', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      const { initWebVitals } = await import('../webVitals');
      initWebVitals();

      const clsCallback = mockOnCLS.mock.calls[0][0];
      clsCallback({ name: 'CLS', value: 0.05, id: 'v1', navigationType: 'navigate' });

      expect(mockSetMeasurement).toHaveBeenCalledWith('CLS', 0.05, '');
    });

    it('should rate poor LCP (>4000ms) with warning level', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      const { initWebVitals } = await import('../webVitals');
      initWebVitals();

      const lcpCallback = mockOnLCP.mock.calls[0][0];
      lcpCallback({ name: 'LCP', value: 5000, id: 'v1', navigationType: 'navigate' });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warning',
          data: expect.objectContaining({ rating: 'poor' }),
        }),
      );
    });

    it('should rate needs-improvement for intermediate values', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      const { initWebVitals } = await import('../webVitals');
      initWebVitals();

      const inpCallback = mockOnINP.mock.calls[0][0];
      inpCallback({ name: 'INP', value: 300, id: 'v1', navigationType: 'navigate' });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rating: 'needs-improvement' }),
        }),
      );
    });

    it('should log poor metrics in dev mode', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', true);

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { initWebVitals } = await import('../webVitals');
      initWebVitals();

      const fcpCallback = mockOnFCP.mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 4000, id: 'v1', navigationType: 'navigate' });

      expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('Poor FCP'));
    });

    it('should handle unknown metric name gracefully', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      const { initWebVitals } = await import('../webVitals');
      initWebVitals();

      const ttfbCallback = mockOnTTFB.mock.calls[0][0];
      // Send a metric with unknown name to test getRating fallback
      ttfbCallback({ name: 'UNKNOWN', value: 100, id: 'v1', navigationType: 'navigate' });

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rating: 'needs-improvement' }),
        }),
      );
    });
  });

  describe('measureFlow - Sentry integration', () => {
    it('should send measurement to Sentry on success', async () => {
      const { measureFlow } = await import('../webVitals');

      await measureFlow('sentry-test', async () => 'result');

      expect(mockSetMeasurement).toHaveBeenCalledWith(
        'flow-sentry-test',
        expect.any(Number),
        'millisecond',
      );
      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance',
          message: expect.stringContaining('sentry-test completed'),
        }),
      );
    });
  });

  describe('trackTiming', () => {
    it('should send timing measurement and breadcrumb', async () => {
      const { trackTiming } = await import('../webVitals');

      trackTiming('upload-time', 456.78);

      expect(mockSetMeasurement).toHaveBeenCalledWith('upload-time', 456.78, 'millisecond');
      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'timing',
          message: 'upload-time: 457ms',
          data: { name: 'upload-time', duration: 456.78 },
        }),
      );
    });
  });
});
