/**
 * Test utilities for verifying component render behavior.
 *
 * These utilities help detect unnecessary re-renders in React components,
 * which is especially useful for validating memoization strategies.
 *
 * @example
 * ```tsx
 * import { createRenderCounter, useRenderCount, assertRenderCounts } from '@pageshell/core/test-utils';
 *
 * // Create a counter for the test
 * const counter = createRenderCounter();
 *
 * // Track renders in a component
 * function MyComponent() {
 *   useRenderCount({ key: 'MyComponent' }, counter);
 *   return <div>Hello</div>;
 * }
 *
 * // In your test, assert render counts
 * assertRenderCounts(counter, [
 *   { key: 'MyComponent', expected: 1, mode: 'max' },
 * ]);
 * ```
 */

export {
  // Render counter factory
  createRenderCounter,

  // Hook for tracking renders
  useRenderCount,
  useRenderCounterContext,

  // Context provider
  RenderCounterProvider,

  // Assertion utilities
  assertRenderCounts,
  describeRenderCounts,

  // Higher-order component
  withRenderCount,

  // React Testing Library integration
  createRenderCountWrapper,

  // Types
  type RenderCounter,
  type RenderCounterProviderProps,
  type UseRenderCountOptions,
  type UseRenderCountReturn,
  type RenderCountAssertion,
  type WithRenderCountOptions,
  type RenderCounterType,
  type RenderCountOptions,
} from './renderCount';
