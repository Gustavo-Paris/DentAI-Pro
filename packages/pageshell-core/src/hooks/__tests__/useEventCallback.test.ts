import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventCallback } from '../useEventCallback';
import { useState, useEffect } from 'react';

describe('useEventCallback', () => {
  describe('stable reference', () => {
    it('should return the same function reference across renders', () => {
      const callback = vi.fn();
      const { result, rerender } = renderHook(() => useEventCallback(callback));

      const firstReference = result.current;
      rerender();
      const secondReference = result.current;
      rerender();
      const thirdReference = result.current;

      expect(firstReference).toBe(secondReference);
      expect(secondReference).toBe(thirdReference);
    });

    it('should maintain stable reference when callback changes', () => {
      const { result, rerender } = renderHook(
        ({ callback }) => useEventCallback(callback),
        { initialProps: { callback: () => 'first' } }
      );

      const firstReference = result.current;

      rerender({ callback: () => 'second' });
      const secondReference = result.current;

      rerender({ callback: () => 'third' });
      const thirdReference = result.current;

      expect(firstReference).toBe(secondReference);
      expect(secondReference).toBe(thirdReference);
    });

    it('should maintain stable reference when dependencies in closure change', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useEventCallback(() => value),
        { initialProps: { value: 1 } }
      );

      const firstReference = result.current;

      rerender({ value: 2 });
      const secondReference = result.current;

      rerender({ value: 100 });
      const thirdReference = result.current;

      expect(firstReference).toBe(secondReference);
      expect(secondReference).toBe(thirdReference);
    });
  });

  describe('callback execution', () => {
    it('should call the callback when invoked', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useEventCallback(callback));

      act(() => {
        result.current();
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the callback', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useEventCallback(callback));

      act(() => {
        result.current('arg1', 'arg2', 123);
      });

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should return the callback return value', () => {
      const callback = vi.fn().mockReturnValue('returned-value');
      const { result } = renderHook(() => useEventCallback(callback));

      let returnValue: string | undefined;
      act(() => {
        returnValue = result.current();
      });

      expect(returnValue).toBe('returned-value');
    });

    it('should always call the latest callback', () => {
      const results: number[] = [];
      const { result, rerender } = renderHook(
        ({ value }) =>
          useEventCallback(() => {
            results.push(value);
            return value;
          }),
        { initialProps: { value: 1 } }
      );

      act(() => {
        result.current();
      });
      expect(results).toEqual([1]);

      rerender({ value: 2 });
      act(() => {
        result.current();
      });
      expect(results).toEqual([1, 2]);

      rerender({ value: 100 });
      act(() => {
        result.current();
      });
      expect(results).toEqual([1, 2, 100]);
    });

    it('should access latest closure values', () => {
      const results: number[] = [];

      const { result, rerender } = renderHook(({ count }) => {
        return useEventCallback(() => {
          results.push(count);
        });
      }, { initialProps: { count: 0 } });

      act(() => {
        result.current();
      });
      expect(results).toEqual([0]);

      rerender({ count: 5 });
      act(() => {
        result.current();
      });
      expect(results).toEqual([0, 5]);

      rerender({ count: 10 });
      act(() => {
        result.current();
      });
      expect(results).toEqual([0, 5, 10]);
    });
  });

  describe('type safety', () => {
    it('should preserve argument types', () => {
      const callback = (a: string, b: number, c: boolean) => `${a}-${b}-${c}`;
      const { result } = renderHook(() => useEventCallback(callback));

      let returnValue: string | undefined;
      act(() => {
        returnValue = result.current('hello', 42, true);
      });

      expect(returnValue).toBe('hello-42-true');
    });

    it('should preserve return type', () => {
      const callback = (): { id: number; name: string } => ({ id: 1, name: 'test' });
      const { result } = renderHook(() => useEventCallback(callback));

      let returnValue: { id: number; name: string } | undefined;
      act(() => {
        returnValue = result.current();
      });

      expect(returnValue).toEqual({ id: 1, name: 'test' });
    });

    it('should handle void return type', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useEventCallback(callback));

      let returnValue: void;
      act(() => {
        returnValue = result.current();
      });

      expect(returnValue).toBeUndefined();
    });

    it('should handle async callbacks', async () => {
      const callback = async (value: number): Promise<number> => {
        return value * 2;
      };
      const { result } = renderHook(() => useEventCallback(callback));

      let returnValue: Promise<number>;
      act(() => {
        returnValue = result.current(5);
      });

      await expect(returnValue!).resolves.toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle no arguments', () => {
      const callback = vi.fn(() => 'no-args');
      const { result } = renderHook(() => useEventCallback(callback));

      let returnValue: string | undefined;
      act(() => {
        returnValue = result.current();
      });

      expect(returnValue).toBe('no-args');
      expect(callback).toHaveBeenCalledWith();
    });

    it('should handle many arguments', () => {
      const callback = vi.fn((...args: unknown[]) => args.length);
      const { result } = renderHook(() => useEventCallback(callback));

      let returnValue: number | undefined;
      act(() => {
        returnValue = result.current(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
      });

      expect(returnValue).toBe(10);
    });

    it('should handle callbacks that throw', () => {
      const error = new Error('Test error');
      const callback = () => {
        throw error;
      };
      const { result } = renderHook(() => useEventCallback(callback));

      expect(() => {
        act(() => {
          result.current();
        });
      }).toThrow(error);
    });

    it('should work correctly when callback references external state', () => {
      const externalState = { value: 0 };
      const callback = () => externalState.value;
      const { result } = renderHook(() => useEventCallback(callback));

      let returnValue: number | undefined;
      act(() => {
        returnValue = result.current();
      });
      expect(returnValue).toBe(0);

      externalState.value = 100;
      act(() => {
        returnValue = result.current();
      });
      expect(returnValue).toBe(100);
    });
  });

  describe('integration with React patterns', () => {
    it('should work with useState setter', () => {
      const { result } = renderHook(() => {
        const [count, setCount] = useState(0);
        const increment = useEventCallback(() => {
          setCount((prev) => prev + 1);
        });
        return { count, increment };
      });

      expect(result.current.count).toBe(0);

      act(() => {
        result.current.increment();
      });
      expect(result.current.count).toBe(1);

      act(() => {
        result.current.increment();
        result.current.increment();
      });
      expect(result.current.count).toBe(3);
    });

    it('should be safe to use in useEffect dependencies', () => {
      const effectCallback = vi.fn();

      const { rerender } = renderHook(({ value }) => {
        const stableCallback = useEventCallback(() => value);

        useEffect(() => {
          effectCallback(stableCallback);
        }, [stableCallback]);

        return stableCallback;
      }, { initialProps: { value: 1 } });

      // Effect should run once on mount
      expect(effectCallback).toHaveBeenCalledTimes(1);

      // Rerender with different value - effect should NOT run again
      // because stableCallback reference hasn't changed
      rerender({ value: 2 });
      expect(effectCallback).toHaveBeenCalledTimes(1);

      rerender({ value: 3 });
      expect(effectCallback).toHaveBeenCalledTimes(1);
    });

    it('should work correctly when passed to child components', () => {
      const childCallback = vi.fn();

      const { result, rerender } = renderHook(({ parentValue }) => {
        const handleClick = useEventCallback((childArg: string) => {
          childCallback(parentValue, childArg);
        });
        return { handleClick };
      }, { initialProps: { parentValue: 'parent-1' } });

      act(() => {
        result.current.handleClick('child-1');
      });
      expect(childCallback).toHaveBeenCalledWith('parent-1', 'child-1');

      // Update parent value
      rerender({ parentValue: 'parent-2' });

      // Handler should use the new parent value
      act(() => {
        result.current.handleClick('child-2');
      });
      expect(childCallback).toHaveBeenCalledWith('parent-2', 'child-2');
    });
  });
});
