import { useRef, useCallback, createContext, useContext } from 'react';
import type { ReactNode, FC, ComponentType } from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * A render counter instance that tracks render counts for components.
 */
export interface RenderCounter {
  /**
   * Get the current render count for a component identified by key.
   * @param key - Unique identifier for the component instance
   * @returns The number of times the component has rendered
   */
  get: (key: string) => number;

  /**
   * Increment the render count for a component identified by key.
   * Should be called once per render (typically in useRenderCount hook).
   * @param key - Unique identifier for the component instance
   * @returns The new render count after incrementing
   */
  increment: (key: string) => number;

  /**
   * Reset the render count for a specific component.
   * @param key - Unique identifier for the component instance
   */
  reset: (key: string) => void;

  /**
   * Reset all render counts tracked by this counter.
   */
  resetAll: () => void;

  /**
   * Get all tracked component keys and their render counts.
   * @returns A map of component keys to their render counts
   */
  getAll: () => Map<string, number>;
}

/**
 * Options for the useRenderCount hook.
 */
export interface UseRenderCountOptions {
  /**
   * Unique key to identify this component instance.
   * If not provided, a default key will be used.
   */
  key?: string;
}

/**
 * Return type for the useRenderCount hook.
 */
export interface UseRenderCountReturn {
  /**
   * The current render count for this component.
   */
  renderCount: number;

  /**
   * Reset the render count for this component to 0.
   */
  reset: () => void;
}

/**
 * Configuration for asserting render counts.
 */
export interface RenderCountAssertion {
  /**
   * The component key to check.
   */
  key: string;

  /**
   * Expected render count or maximum render count.
   */
  expected: number;

  /**
   * Assertion mode:
   * - 'exact': render count must equal expected
   * - 'max': render count must be <= expected
   * - 'min': render count must be >= expected
   * @default 'exact'
   */
  mode?: 'exact' | 'max' | 'min';
}

// =============================================================================
// Render Counter Factory
// =============================================================================

/**
 * Creates a render counter instance for tracking component renders in tests.
 *
 * @example
 * ```tsx
 * const counter = createRenderCounter();
 *
 * function MyComponent({ id }: { id: string }) {
 *   useRenderCount({ key: `MyComponent-${id}`, counter });
 *   return <div>{id}</div>;
 * }
 *
 * // In your test:
 * expect(counter.get('MyComponent-1')).toBe(1);
 * ```
 */
export function createRenderCounter(): RenderCounter {
  const counts = new Map<string, number>();

  return {
    get: (key: string): number => {
      return counts.get(key) ?? 0;
    },

    increment: (key: string): number => {
      const current = counts.get(key) ?? 0;
      const next = current + 1;
      counts.set(key, next);
      return next;
    },

    reset: (key: string): void => {
      counts.delete(key);
    },

    resetAll: (): void => {
      counts.clear();
    },

    getAll: (): Map<string, number> => {
      return new Map(counts);
    },
  };
}

// =============================================================================
// Context-based Render Counting
// =============================================================================

const RenderCounterContext = createContext<RenderCounter | null>(null);

/**
 * Props for the RenderCounterProvider component.
 */
export interface RenderCounterProviderProps {
  /**
   * The render counter instance to provide to child components.
   */
  counter: RenderCounter;

  /**
   * Child components that will have access to the render counter.
   */
  children: ReactNode;
}

/**
 * Provider component that makes a render counter available to child components
 * via context. Use this when you want to track renders across a component tree
 * without prop drilling.
 *
 * @example
 * ```tsx
 * const counter = createRenderCounter();
 *
 * render(
 *   <RenderCounterProvider counter={counter}>
 *     <MyComponentTree />
 *   </RenderCounterProvider>
 * );
 *
 * // Components can use useRenderCount() without passing counter
 * ```
 */
export function RenderCounterProvider({
  counter,
  children,
}: RenderCounterProviderProps): ReactNode {
  return (
    <RenderCounterContext.Provider value={counter}>
      {children}
    </RenderCounterContext.Provider>
  );
}

/**
 * Hook to access the render counter from context.
 * Returns null if not within a RenderCounterProvider.
 */
export function useRenderCounterContext(): RenderCounter | null {
  return useContext(RenderCounterContext);
}

// =============================================================================
// useRenderCount Hook
// =============================================================================

/**
 * Hook that tracks how many times a component has rendered.
 * Can be used with a counter passed directly or from context.
 *
 * @param options - Configuration options
 * @param counter - Optional render counter instance. If not provided, uses context.
 * @returns Object containing the current render count and a reset function
 *
 * @example
 * ```tsx
 * // With explicit counter
 * const counter = createRenderCounter();
 *
 * function MyComponent() {
 *   const { renderCount } = useRenderCount({ key: 'MyComponent' }, counter);
 *   return <div>Rendered {renderCount} times</div>;
 * }
 *
 * // With context
 * function MyComponent() {
 *   const { renderCount } = useRenderCount({ key: 'MyComponent' });
 *   // Counter must be provided via RenderCounterProvider
 *   return <div>Rendered {renderCount} times</div>;
 * }
 * ```
 */
export function useRenderCount(
  options: UseRenderCountOptions = {},
  counter?: RenderCounter
): UseRenderCountReturn {
  const contextCounter = useRenderCounterContext();
  const activeCounter = counter ?? contextCounter;

  const key = options.key ?? 'default';

  // Use a ref to track if this is the first render
  const isFirstRenderRef = useRef(true);
  const renderCountRef = useRef(0);

  // Only increment on render, not on every hook call
  if (activeCounter) {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      renderCountRef.current = activeCounter.increment(key);
    } else {
      // On subsequent renders (re-renders), increment again
      const lastCount = activeCounter.get(key);
      if (lastCount === renderCountRef.current) {
        // This is a re-render
        renderCountRef.current = activeCounter.increment(key);
      }
    }
  }

  const reset = useCallback(() => {
    if (activeCounter) {
      activeCounter.reset(key);
      renderCountRef.current = 0;
      isFirstRenderRef.current = true;
    }
  }, [activeCounter, key]);

  return {
    renderCount: renderCountRef.current,
    reset,
  };
}

// =============================================================================
// Assertion Utilities
// =============================================================================

/**
 * Asserts that a component's render count matches expectations.
 * Throws an error with a descriptive message if the assertion fails.
 *
 * @param counter - The render counter to check
 * @param assertions - One or more render count assertions
 *
 * @example
 * ```tsx
 * const counter = createRenderCounter();
 *
 * // After some renders...
 *
 * // Assert exact render counts
 * assertRenderCounts(counter, [
 *   { key: 'Parent', expected: 2 },
 *   { key: 'Child', expected: 1 },
 * ]);
 *
 * // Assert maximum render counts
 * assertRenderCounts(counter, [
 *   { key: 'ExpensiveComponent', expected: 1, mode: 'max' },
 * ]);
 * ```
 */
export function assertRenderCounts(
  counter: RenderCounter,
  assertions: RenderCountAssertion[]
): void {
  const failures: string[] = [];

  for (const { key, expected, mode = 'exact' } of assertions) {
    const actual = counter.get(key);

    switch (mode) {
      case 'exact':
        if (actual !== expected) {
          failures.push(
            `Component "${key}": expected ${expected} renders, but got ${actual}`
          );
        }
        break;

      case 'max':
        if (actual > expected) {
          failures.push(
            `Component "${key}": expected at most ${expected} renders, but got ${actual}`
          );
        }
        break;

      case 'min':
        if (actual < expected) {
          failures.push(
            `Component "${key}": expected at least ${expected} renders, but got ${actual}`
          );
        }
        break;
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Render count assertion failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`
    );
  }
}

/**
 * Returns a descriptive string of all render counts for debugging.
 *
 * @param counter - The render counter to describe
 * @returns A formatted string showing all component render counts
 *
 * @example
 * ```tsx
 * console.log(describeRenderCounts(counter));
 * // Output:
 * // Render counts:
 * //   - Parent: 2
 * //   - Child-1: 1
 * //   - Child-2: 1
 * ```
 */
export function describeRenderCounts(counter: RenderCounter): string {
  const counts = counter.getAll();

  if (counts.size === 0) {
    return 'Render counts: (no components tracked)';
  }

  const lines = Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `  - ${key}: ${count}`);

  return `Render counts:\n${lines.join('\n')}`;
}

// =============================================================================
// HOC for Render Count Tracking
// =============================================================================

/**
 * Options for the withRenderCount HOC.
 */
export interface WithRenderCountOptions {
  /**
   * Key to use for tracking this component.
   * If not provided, uses the component's displayName or 'Anonymous'.
   */
  key?: string;

  /**
   * The render counter to use.
   * If not provided, uses the counter from context.
   */
  counter?: RenderCounter;
}

/**
 * Higher-order component that wraps a component to track its render count.
 * Useful for wrapping components without modifying their source.
 *
 * @param Component - The component to wrap
 * @param options - Configuration options
 * @returns A wrapped component that tracks renders
 *
 * @example
 * ```tsx
 * const counter = createRenderCounter();
 *
 * const TrackedButton = withRenderCount(Button, {
 *   key: 'Button',
 *   counter,
 * });
 *
 * render(<TrackedButton onClick={handleClick}>Click me</TrackedButton>);
 *
 * expect(counter.get('Button')).toBe(1);
 * ```
 */
export function withRenderCount<P extends object>(
  Component: ComponentType<P>,
  options: WithRenderCountOptions = {}
): FC<P> {
  const key =
    options.key ??
    (Component as { displayName?: string }).displayName ??
    Component.name ??
    'Anonymous';

  const WrappedComponent: FC<P> = (props) => {
    useRenderCount({ key }, options.counter);
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withRenderCount(${key})`;

  return WrappedComponent;
}

// =============================================================================
// React Testing Library Integration
// =============================================================================

/**
 * Creates a test wrapper that includes a RenderCounterProvider.
 * Designed for use with React Testing Library's render function.
 *
 * @param counter - The render counter to use in the wrapper
 * @returns A wrapper component suitable for RTL's wrapper option
 *
 * @example
 * ```tsx
 * const counter = createRenderCounter();
 *
 * const { rerender } = render(<MyComponent />, {
 *   wrapper: createRenderCountWrapper(counter),
 * });
 *
 * expect(counter.get('MyComponent')).toBe(1);
 *
 * rerender(<MyComponent value="new" />);
 * expect(counter.get('MyComponent')).toBe(2);
 * ```
 */
export function createRenderCountWrapper(
  counter: RenderCounter
): FC<{ children: ReactNode }> {
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <RenderCounterProvider counter={counter}>{children}</RenderCounterProvider>
  );

  Wrapper.displayName = 'RenderCountWrapper';

  return Wrapper;
}

// =============================================================================
// Convenience Exports
// =============================================================================

export type {
  RenderCounter as RenderCounterType,
  UseRenderCountOptions as RenderCountOptions,
};
