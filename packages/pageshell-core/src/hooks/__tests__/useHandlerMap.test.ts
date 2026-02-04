import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHandlerMap } from '../useHandlerMap';

describe('useHandlerMap', () => {
  describe('stable references', () => {
    it('should return the same handler reference for the same ID', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const handler1 = result.current.getHandler('id-1');
      const handler2 = result.current.getHandler('id-1');
      const handler3 = result.current.getHandler('id-1');

      expect(handler1).toBe(handler2);
      expect(handler2).toBe(handler3);
    });

    it('should return different handler references for different IDs', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const handlerA = result.current.getHandler('id-a');
      const handlerB = result.current.getHandler('id-b');
      const handlerC = result.current.getHandler('id-c');

      expect(handlerA).not.toBe(handlerB);
      expect(handlerB).not.toBe(handlerC);
      expect(handlerA).not.toBe(handlerC);
    });

    it('should maintain stable references across renders', () => {
      const { result, rerender } = renderHook(
        ({ handler }) => useHandlerMap(handler),
        { initialProps: { handler: () => 'first' } }
      );

      const firstHandler = result.current.getHandler('test-id');

      rerender({ handler: () => 'second' });
      const secondHandler = result.current.getHandler('test-id');

      rerender({ handler: () => 'third' });
      const thirdHandler = result.current.getHandler('test-id');

      expect(firstHandler).toBe(secondHandler);
      expect(secondHandler).toBe(thirdHandler);
    });

    it('should maintain stable references when component state changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useHandlerMap((id: string) => `${id}-${value}`),
        { initialProps: { value: 1 } }
      );

      const firstHandler = result.current.getHandler('test');

      rerender({ value: 2 });
      const secondHandler = result.current.getHandler('test');

      rerender({ value: 100 });
      const thirdHandler = result.current.getHandler('test');

      expect(firstHandler).toBe(secondHandler);
      expect(secondHandler).toBe(thirdHandler);
    });

    it('should return stable getHandler function across renders', () => {
      const handler = vi.fn();
      const { result, rerender } = renderHook(() => useHandlerMap(handler));

      const firstGetHandler = result.current.getHandler;
      rerender();
      const secondGetHandler = result.current.getHandler;
      rerender();
      const thirdGetHandler = result.current.getHandler;

      expect(firstGetHandler).toBe(secondGetHandler);
      expect(secondGetHandler).toBe(thirdGetHandler);
    });
  });

  describe('handler execution', () => {
    it('should call the handler with the correct ID', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const itemHandler = result.current.getHandler('item-123');

      act(() => {
        itemHandler();
      });

      expect(handler).toHaveBeenCalledWith('item-123');
    });

    it('should pass additional arguments to the handler', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const itemHandler = result.current.getHandler('item-456');

      const mockEvent = { type: 'click' };
      act(() => {
        itemHandler(mockEvent, 'extra-arg');
      });

      expect(handler).toHaveBeenCalledWith('item-456', mockEvent, 'extra-arg');
    });

    it('should return the handler return value', () => {
      const handler = vi.fn((id: string) => `processed-${id}`);
      const { result } = renderHook(() => useHandlerMap(handler));

      const itemHandler = result.current.getHandler('test-id');

      let returnValue: string | undefined;
      act(() => {
        returnValue = itemHandler();
      });

      expect(returnValue).toBe('processed-test-id');
    });

    it('should always call the latest handler', () => {
      const results: string[] = [];
      const { result, rerender } = renderHook(
        ({ suffix }) =>
          useHandlerMap((id: string) => {
            const value = `${id}-${suffix}`;
            results.push(value);
            return value;
          }),
        { initialProps: { suffix: 'v1' } }
      );

      const itemHandler = result.current.getHandler('item');

      act(() => {
        itemHandler();
      });
      expect(results).toEqual(['item-v1']);

      rerender({ suffix: 'v2' });
      act(() => {
        itemHandler();
      });
      expect(results).toEqual(['item-v1', 'item-v2']);

      rerender({ suffix: 'v3' });
      act(() => {
        itemHandler();
      });
      expect(results).toEqual(['item-v1', 'item-v2', 'item-v3']);
    });
  });

  describe('ID type support', () => {
    it('should support string IDs', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const handlerA = result.current.getHandler('string-id-a');
      const handlerB = result.current.getHandler('string-id-a');

      expect(handlerA).toBe(handlerB);

      act(() => {
        handlerA();
      });

      expect(handler).toHaveBeenCalledWith('string-id-a');
    });

    it('should support number IDs', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap<number>(handler));

      const handler1 = result.current.getHandler(1);
      const handler2 = result.current.getHandler(2);
      const handler1Again = result.current.getHandler(1);

      expect(handler1).toBe(handler1Again);
      expect(handler1).not.toBe(handler2);

      act(() => {
        handler1();
        handler2();
      });

      expect(handler).toHaveBeenCalledWith(1);
      expect(handler).toHaveBeenCalledWith(2);
    });

    it('should support object IDs (by reference)', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap<object>(handler));

      const objId = { id: 1 };
      const otherObjId = { id: 1 }; // Same value, different reference

      const handlerA = result.current.getHandler(objId);
      const handlerB = result.current.getHandler(objId);
      const handlerC = result.current.getHandler(otherObjId);

      expect(handlerA).toBe(handlerB);
      expect(handlerA).not.toBe(handlerC); // Different object references
    });

    it('should support symbol IDs', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap<symbol>(handler));

      const sym1 = Symbol('id-1');
      const sym2 = Symbol('id-2');

      const handlerA = result.current.getHandler(sym1);
      const handlerB = result.current.getHandler(sym1);
      const handlerC = result.current.getHandler(sym2);

      expect(handlerA).toBe(handlerB);
      expect(handlerA).not.toBe(handlerC);
    });

    it('should support tuple/array IDs (by reference)', () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useHandlerMap<[string, number]>(handler)
      );

      const tupleId: [string, number] = ['item', 1];

      const handlerA = result.current.getHandler(tupleId);
      const handlerB = result.current.getHandler(tupleId);

      expect(handlerA).toBe(handlerB);

      act(() => {
        handlerA();
      });

      expect(handler).toHaveBeenCalledWith(tupleId);
    });
  });

  describe('cleanup', () => {
    it('should clear a specific handler with clearHandler', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const originalHandler = result.current.getHandler('item-1');

      act(() => {
        result.current.clearHandler('item-1');
      });

      const newHandler = result.current.getHandler('item-1');

      expect(originalHandler).not.toBe(newHandler);
    });

    it('should not affect other handlers when clearing one', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const handler1 = result.current.getHandler('item-1');
      const handler2 = result.current.getHandler('item-2');
      const handler3 = result.current.getHandler('item-3');

      act(() => {
        result.current.clearHandler('item-2');
      });

      const handler1After = result.current.getHandler('item-1');
      const handler2After = result.current.getHandler('item-2');
      const handler3After = result.current.getHandler('item-3');

      expect(handler1).toBe(handler1After);
      expect(handler2).not.toBe(handler2After);
      expect(handler3).toBe(handler3After);
    });

    it('should clear all handlers with clearAllHandlers', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const handler1 = result.current.getHandler('item-1');
      const handler2 = result.current.getHandler('item-2');
      const handler3 = result.current.getHandler('item-3');

      act(() => {
        result.current.clearAllHandlers();
      });

      const handler1After = result.current.getHandler('item-1');
      const handler2After = result.current.getHandler('item-2');
      const handler3After = result.current.getHandler('item-3');

      expect(handler1).not.toBe(handler1After);
      expect(handler2).not.toBe(handler2After);
      expect(handler3).not.toBe(handler3After);
    });

    it('should provide stable clearHandler function across renders', () => {
      const handler = vi.fn();
      const { result, rerender } = renderHook(() => useHandlerMap(handler));

      const firstClearHandler = result.current.clearHandler;
      rerender();
      const secondClearHandler = result.current.clearHandler;

      expect(firstClearHandler).toBe(secondClearHandler);
    });

    it('should provide stable clearAllHandlers function across renders', () => {
      const handler = vi.fn();
      const { result, rerender } = renderHook(() => useHandlerMap(handler));

      const firstClearAll = result.current.clearAllHandlers;
      rerender();
      const secondClearAll = result.current.clearAllHandlers;

      expect(firstClearAll).toBe(secondClearAll);
    });

    it('should handle clearing non-existent handler gracefully', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      // Should not throw
      act(() => {
        result.current.clearHandler('non-existent');
      });

      // Can still create handlers normally after
      const newHandler = result.current.getHandler('new-item');
      expect(typeof newHandler).toBe('function');
    });

    it('should handle clearing all when empty gracefully', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      // Should not throw
      act(() => {
        result.current.clearAllHandlers();
      });

      // Can still create handlers normally after
      const newHandler = result.current.getHandler('new-item');
      expect(typeof newHandler).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle handlers that throw errors', () => {
      const error = new Error('Test error');
      const handler = vi.fn(() => {
        throw error;
      });
      const { result } = renderHook(() => useHandlerMap(handler));

      const itemHandler = result.current.getHandler('item');

      expect(() => {
        act(() => {
          itemHandler();
        });
      }).toThrow(error);
    });

    it('should handle async handlers', async () => {
      const handler = vi.fn(async (id: string) => {
        return `async-${id}`;
      });
      const { result } = renderHook(() => useHandlerMap(handler));

      const itemHandler = result.current.getHandler('test');

      let promise: Promise<string>;
      act(() => {
        promise = itemHandler();
      });

      await expect(promise!).resolves.toBe('async-test');
    });

    it('should handle many IDs efficiently', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const handlers: Array<() => void> = [];

      // Create handlers for many IDs
      for (let i = 0; i < 1000; i++) {
        handlers.push(result.current.getHandler(`item-${i}`));
      }

      // Verify same references are returned
      for (let i = 0; i < 1000; i++) {
        expect(result.current.getHandler(`item-${i}`)).toBe(handlers[i]);
      }
    });

    it('should handle null and undefined IDs', () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useHandlerMap<string | null | undefined>(handler)
      );

      const nullHandler1 = result.current.getHandler(null);
      const nullHandler2 = result.current.getHandler(null);
      const undefinedHandler1 = result.current.getHandler(undefined);
      const undefinedHandler2 = result.current.getHandler(undefined);

      expect(nullHandler1).toBe(nullHandler2);
      expect(undefinedHandler1).toBe(undefinedHandler2);
      expect(nullHandler1).not.toBe(undefinedHandler1);

      act(() => {
        nullHandler1();
        undefinedHandler1();
      });

      expect(handler).toHaveBeenCalledWith(null);
      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it('should handle empty string ID', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap(handler));

      const emptyHandler1 = result.current.getHandler('');
      const emptyHandler2 = result.current.getHandler('');

      expect(emptyHandler1).toBe(emptyHandler2);

      act(() => {
        emptyHandler1();
      });

      expect(handler).toHaveBeenCalledWith('');
    });

    it('should handle zero as ID', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useHandlerMap<number>(handler));

      const zeroHandler1 = result.current.getHandler(0);
      const zeroHandler2 = result.current.getHandler(0);

      expect(zeroHandler1).toBe(zeroHandler2);

      act(() => {
        zeroHandler1();
      });

      expect(handler).toHaveBeenCalledWith(0);
    });
  });

  describe('integration with list patterns', () => {
    it('should work with typical list item click pattern', () => {
      const onSelect = vi.fn();
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];

      const { result } = renderHook(() =>
        useHandlerMap((id: string) => {
          onSelect(id);
        })
      );

      // Simulate rendering a list and getting handlers for each item
      const handlers = items.map((item) => result.current.getHandler(item.id));

      // Simulate clicking on item 2
      act(() => {
        handlers[1]!();
      });

      expect(onSelect).toHaveBeenCalledWith('2');
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('should provide stable handlers for memoized children', () => {
      const onSelect = vi.fn();
      const { result, rerender } = renderHook(
        ({ items, selectedId }) =>
          useHandlerMap((id: string) => {
            onSelect(id, selectedId);
          }),
        {
          initialProps: {
            items: ['a', 'b', 'c'],
            selectedId: 'a',
          },
        }
      );

      // Get handlers initially
      const handlerA = result.current.getHandler('a');
      const handlerB = result.current.getHandler('b');
      const handlerC = result.current.getHandler('c');

      // Simulate parent re-render with changed selection
      rerender({ items: ['a', 'b', 'c'], selectedId: 'b' });

      // Handlers should be stable (same references)
      expect(result.current.getHandler('a')).toBe(handlerA);
      expect(result.current.getHandler('b')).toBe(handlerB);
      expect(result.current.getHandler('c')).toBe(handlerC);

      // But they should use the updated selectedId
      act(() => {
        handlerA();
      });

      expect(onSelect).toHaveBeenCalledWith('a', 'b');
    });

    it('should work with event handlers receiving event objects', () => {
      const onClick = vi.fn();

      const { result } = renderHook(() =>
        useHandlerMap((id: string, event: { type: string }) => {
          onClick(id, event.type);
        })
      );

      const itemHandler = result.current.getHandler('item-1');

      act(() => {
        itemHandler({ type: 'click' });
      });

      expect(onClick).toHaveBeenCalledWith('item-1', 'click');
    });
  });
});
