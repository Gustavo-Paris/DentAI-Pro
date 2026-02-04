import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback, useDebouncedValue } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 300));
      expect(result.current).toBe('initial');
    });

    it('should return initial value for objects', () => {
      const obj = { foo: 'bar' };
      const { result } = renderHook(() => useDebounce(obj, 300));
      expect(result.current).toEqual(obj);
    });
  });

  describe('debounce behavior', () => {
    it('should not update value immediately', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });
      expect(result.current).toBe('initial');
    });

    it('should update value after delay', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid changes', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'first' });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      rerender({ value: 'second' });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      rerender({ value: 'third' });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Still initial because timer keeps resetting
      expect(result.current).toBe('initial');

      // After full delay from last change
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current).toBe('third');
    });
  });

  describe('delay variations', () => {
    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 0), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(result.current).toBe('updated');
    });

    it('should handle long delay', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 1000), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: 'initial' as string | null },
      });

      rerender({ value: null });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBeNull();
    });

    it('should handle undefined values', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: 'initial' as string | undefined },
      });

      rerender({ value: undefined });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBeUndefined();
    });

    it('should cleanup timer on unmount', () => {
      const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });
      unmount();

      // Should not throw or cause issues
      act(() => {
        vi.advanceTimersByTime(300);
      });
    });
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call callback immediately', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('arg1');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should call callback after delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('arg1');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledWith('arg1');
  });

  it('should pass all arguments to callback', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('arg1', 'arg2', 123);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should only call callback once for rapid calls', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('first');
    result.current('second');
    result.current('third');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');
  });

  it('should use latest callback reference', () => {
    let callbackVersion = 1;
    const { result, rerender } = renderHook(
      ({ version }) =>
        useDebouncedCallback(() => {
          callbackVersion = version;
        }, 300),
      { initialProps: { version: 1 } }
    );

    result.current();
    rerender({ version: 2 });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(callbackVersion).toBe(2);
  });

  it('should cleanup on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('arg');
    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be an alias for useDebounce', () => {
    expect(useDebouncedValue).toBe(useDebounce);
  });

  it('should work identically to useDebounce', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });
});
