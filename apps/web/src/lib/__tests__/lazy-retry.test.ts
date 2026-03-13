import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

describe('lazyRetry', () => {
  const originalReload = window.location.reload;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/test-page', reload: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a lazy component that resolves on successful import', async () => {
    const { lazyRetry } = await import('../lazy-retry');

    const MockComponent = () => React.createElement('div', null, 'Hello');
    const importFn = vi.fn().mockResolvedValue({ default: MockComponent });

    const LazyComponent = lazyRetry(importFn);

    // LazyComponent is a React.lazy wrapper — it has $$typeof for lazy
    expect(LazyComponent).toBeDefined();
    expect(LazyComponent.$$typeof).toBe(Symbol.for('react.lazy'));
  });

  it('should call import function and return module on success', async () => {
    const { lazyRetry } = await import('../lazy-retry');

    const MockComponent = () => React.createElement('div', null, 'Success');
    const mod = { default: MockComponent };
    const importFn = vi.fn().mockResolvedValue(mod);

    const LazyComponent = lazyRetry(importFn);

    // Access _payload to trigger the lazy init (React internals)
    const payload = (LazyComponent as any)._payload;
    if (payload && typeof payload._result === 'function') {
      const result = await payload._result();
      expect(result).toEqual(mod);
    }
    expect(importFn).toHaveBeenCalled();
  });

  it('should reload page on chunk loading error (first attempt)', async () => {
    const { lazyRetry } = await import('../lazy-retry');

    const chunkError = new TypeError('Failed to fetch dynamically imported module');
    const importFn = vi.fn().mockRejectedValue(chunkError);

    const LazyComponent = lazyRetry(importFn);

    // Trigger the lazy loader
    const payload = (LazyComponent as any)._payload;
    if (payload && typeof payload._result === 'function') {
      // This should set sessionStorage and call reload
      const promise = payload._result();
      // The promise should never resolve (window.location.reload takes over)
      // We verify sessionStorage was set and reload was called
      // Wait a tick for the catch handler
      await new Promise(r => setTimeout(r, 10));

      expect(sessionStorage.getItem('chunk-retry-/test-page')).toBe('1');
      expect(window.location.reload).toHaveBeenCalled();
    }
  });

  it('should rethrow chunk error on second attempt (after retry key exists)', async () => {
    const { lazyRetry } = await import('../lazy-retry');

    // Simulate previous retry
    sessionStorage.setItem('chunk-retry-/test-page', '1');

    const chunkError = new TypeError('Failed to fetch dynamically imported module');
    const importFn = vi.fn().mockRejectedValue(chunkError);

    const LazyComponent = lazyRetry(importFn);

    const payload = (LazyComponent as any)._payload;
    if (payload && typeof payload._result === 'function') {
      await expect(payload._result()).rejects.toThrow('dynamically imported module');
      // Should have cleaned up the session storage key
      expect(sessionStorage.getItem('chunk-retry-/test-page')).toBeNull();
    }
  });

  it('should rethrow non-chunk errors without retry', async () => {
    const { lazyRetry } = await import('../lazy-retry');

    const genericError = new Error('Network error');
    const importFn = vi.fn().mockRejectedValue(genericError);

    const LazyComponent = lazyRetry(importFn);

    const payload = (LazyComponent as any)._payload;
    if (payload && typeof payload._result === 'function') {
      await expect(payload._result()).rejects.toThrow('Network error');
      expect(window.location.reload).not.toHaveBeenCalled();
    }
  });

  it('should not trigger retry for TypeError without chunk message', async () => {
    const { lazyRetry } = await import('../lazy-retry');

    const typeError = new TypeError('Cannot read properties of undefined');
    const importFn = vi.fn().mockRejectedValue(typeError);

    const LazyComponent = lazyRetry(importFn);

    const payload = (LazyComponent as any)._payload;
    if (payload && typeof payload._result === 'function') {
      await expect(payload._result()).rejects.toThrow('Cannot read properties');
      expect(window.location.reload).not.toHaveBeenCalled();
    }
  });
});
