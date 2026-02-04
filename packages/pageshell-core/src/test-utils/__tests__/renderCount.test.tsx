import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, render, act, screen } from '@testing-library/react';
import React, { useState, memo, useCallback } from 'react';
import {
  createRenderCounter,
  useRenderCount,
  RenderCounterProvider,
  assertRenderCounts,
  describeRenderCounts,
  withRenderCount,
  createRenderCountWrapper,
  type RenderCounter,
} from '../renderCount';

describe('createRenderCounter', () => {
  let counter: RenderCounter;

  beforeEach(() => {
    counter = createRenderCounter();
  });

  describe('get', () => {
    it('should return 0 for untracked keys', () => {
      expect(counter.get('untracked')).toBe(0);
    });

    it('should return the current count for tracked keys', () => {
      counter.increment('test');
      counter.increment('test');
      expect(counter.get('test')).toBe(2);
    });
  });

  describe('increment', () => {
    it('should increment count from 0 to 1 for new keys', () => {
      const result = counter.increment('new-key');
      expect(result).toBe(1);
      expect(counter.get('new-key')).toBe(1);
    });

    it('should increment existing counts', () => {
      counter.increment('key');
      counter.increment('key');
      const result = counter.increment('key');
      expect(result).toBe(3);
    });

    it('should track multiple keys independently', () => {
      counter.increment('a');
      counter.increment('a');
      counter.increment('b');

      expect(counter.get('a')).toBe(2);
      expect(counter.get('b')).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset a specific key to 0', () => {
      counter.increment('key');
      counter.increment('key');
      counter.reset('key');
      expect(counter.get('key')).toBe(0);
    });

    it('should not affect other keys', () => {
      counter.increment('a');
      counter.increment('b');
      counter.reset('a');

      expect(counter.get('a')).toBe(0);
      expect(counter.get('b')).toBe(1);
    });

    it('should handle resetting non-existent keys gracefully', () => {
      expect(() => counter.reset('non-existent')).not.toThrow();
    });
  });

  describe('resetAll', () => {
    it('should reset all tracked keys', () => {
      counter.increment('a');
      counter.increment('b');
      counter.increment('c');
      counter.resetAll();

      expect(counter.get('a')).toBe(0);
      expect(counter.get('b')).toBe(0);
      expect(counter.get('c')).toBe(0);
    });

    it('should handle empty counter gracefully', () => {
      expect(() => counter.resetAll()).not.toThrow();
    });
  });

  describe('getAll', () => {
    it('should return empty map for new counter', () => {
      const all = counter.getAll();
      expect(all.size).toBe(0);
    });

    it('should return all tracked keys and counts', () => {
      counter.increment('a');
      counter.increment('a');
      counter.increment('b');

      const all = counter.getAll();
      expect(all.size).toBe(2);
      expect(all.get('a')).toBe(2);
      expect(all.get('b')).toBe(1);
    });

    it('should return a copy, not the internal map', () => {
      counter.increment('a');
      const all = counter.getAll();
      all.set('a', 999);

      expect(counter.get('a')).toBe(1);
    });
  });
});

describe('useRenderCount', () => {
  let counter: RenderCounter;

  beforeEach(() => {
    counter = createRenderCounter();
  });

  it('should track initial render', () => {
    const { result } = renderHook(
      () => useRenderCount({ key: 'TestComponent' }, counter)
    );

    expect(result.current.renderCount).toBe(1);
    expect(counter.get('TestComponent')).toBe(1);
  });

  it('should track re-renders', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useRenderCount({ key: 'TestComponent' }, counter),
      { initialProps: { value: 1 } }
    );

    expect(result.current.renderCount).toBe(1);

    rerender({ value: 2 });
    expect(result.current.renderCount).toBe(2);
    expect(counter.get('TestComponent')).toBe(2);

    rerender({ value: 3 });
    expect(result.current.renderCount).toBe(3);
    expect(counter.get('TestComponent')).toBe(3);
  });

  it('should use default key when not provided', () => {
    renderHook(() => useRenderCount({}, counter));

    expect(counter.get('default')).toBe(1);
  });

  it('should track different components independently', () => {
    renderHook(() => useRenderCount({ key: 'ComponentA' }, counter));
    renderHook(() => useRenderCount({ key: 'ComponentB' }, counter));

    expect(counter.get('ComponentA')).toBe(1);
    expect(counter.get('ComponentB')).toBe(1);
  });

  it('should provide reset function', () => {
    const { result, rerender } = renderHook(
      () => useRenderCount({ key: 'TestComponent' }, counter)
    );

    rerender();
    rerender();
    expect(counter.get('TestComponent')).toBe(3);

    act(() => {
      result.current.reset();
    });

    expect(counter.get('TestComponent')).toBe(0);
  });
});

describe('useRenderCount with Context', () => {
  let counter: RenderCounter;

  beforeEach(() => {
    counter = createRenderCounter();
  });

  it('should use counter from context when not provided directly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RenderCounterProvider counter={counter}>
        {children}
      </RenderCounterProvider>
    );

    renderHook(() => useRenderCount({ key: 'ContextComponent' }), { wrapper });

    expect(counter.get('ContextComponent')).toBe(1);
  });

  it('should prefer explicit counter over context', () => {
    const contextCounter = createRenderCounter();
    const explicitCounter = createRenderCounter();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RenderCounterProvider counter={contextCounter}>
        {children}
      </RenderCounterProvider>
    );

    renderHook(
      () => useRenderCount({ key: 'TestComponent' }, explicitCounter),
      { wrapper }
    );

    expect(explicitCounter.get('TestComponent')).toBe(1);
    expect(contextCounter.get('TestComponent')).toBe(0);
  });
});

describe('assertRenderCounts', () => {
  let counter: RenderCounter;

  beforeEach(() => {
    counter = createRenderCounter();
    counter.increment('Component1');
    counter.increment('Component1');
    counter.increment('Component2');
  });

  describe('exact mode', () => {
    it('should pass when counts match exactly', () => {
      expect(() =>
        assertRenderCounts(counter, [
          { key: 'Component1', expected: 2 },
          { key: 'Component2', expected: 1 },
        ])
      ).not.toThrow();
    });

    it('should fail when counts do not match', () => {
      expect(() =>
        assertRenderCounts(counter, [{ key: 'Component1', expected: 1 }])
      ).toThrow('expected 1 renders, but got 2');
    });
  });

  describe('max mode', () => {
    it('should pass when count is at or below max', () => {
      expect(() =>
        assertRenderCounts(counter, [
          { key: 'Component1', expected: 2, mode: 'max' },
          { key: 'Component1', expected: 5, mode: 'max' },
        ])
      ).not.toThrow();
    });

    it('should fail when count exceeds max', () => {
      expect(() =>
        assertRenderCounts(counter, [
          { key: 'Component1', expected: 1, mode: 'max' },
        ])
      ).toThrow('expected at most 1 renders, but got 2');
    });
  });

  describe('min mode', () => {
    it('should pass when count is at or above min', () => {
      expect(() =>
        assertRenderCounts(counter, [
          { key: 'Component1', expected: 2, mode: 'min' },
          { key: 'Component1', expected: 1, mode: 'min' },
        ])
      ).not.toThrow();
    });

    it('should fail when count is below min', () => {
      expect(() =>
        assertRenderCounts(counter, [
          { key: 'Component1', expected: 5, mode: 'min' },
        ])
      ).toThrow('expected at least 5 renders, but got 2');
    });
  });

  it('should report multiple failures', () => {
    expect(() =>
      assertRenderCounts(counter, [
        { key: 'Component1', expected: 1 },
        { key: 'Component2', expected: 5 },
      ])
    ).toThrow(/Component1.*Component2/s);
  });
});

describe('describeRenderCounts', () => {
  it('should return message for empty counter', () => {
    const counter = createRenderCounter();
    const result = describeRenderCounts(counter);
    expect(result).toContain('no components tracked');
  });

  it('should list all tracked components', () => {
    const counter = createRenderCounter();
    counter.increment('Alpha');
    counter.increment('Alpha');
    counter.increment('Beta');

    const result = describeRenderCounts(counter);
    expect(result).toContain('Alpha: 2');
    expect(result).toContain('Beta: 1');
  });

  it('should sort components alphabetically', () => {
    const counter = createRenderCounter();
    counter.increment('Zebra');
    counter.increment('Alpha');
    counter.increment('Mango');

    const result = describeRenderCounts(counter);
    const alphaIndex = result.indexOf('Alpha');
    const mangoIndex = result.indexOf('Mango');
    const zebraIndex = result.indexOf('Zebra');

    expect(alphaIndex).toBeLessThan(mangoIndex);
    expect(mangoIndex).toBeLessThan(zebraIndex);
  });
});

describe('withRenderCount', () => {
  let counter: RenderCounter;

  beforeEach(() => {
    counter = createRenderCounter();
  });

  it('should track renders of wrapped component', () => {
    const BaseComponent: React.FC<{ value: number }> = ({ value }) => (
      <div>{value}</div>
    );

    const TrackedComponent = withRenderCount(BaseComponent, {
      key: 'BaseComponent',
      counter,
    });

    const { rerender } = render(<TrackedComponent value={1} />);
    expect(counter.get('BaseComponent')).toBe(1);

    rerender(<TrackedComponent value={2} />);
    expect(counter.get('BaseComponent')).toBe(2);
  });

  it('should use displayName as default key', () => {
    const NamedComponent: React.FC = () => <div>test</div>;
    NamedComponent.displayName = 'MyNamedComponent';

    const TrackedComponent = withRenderCount(NamedComponent, { counter });
    render(<TrackedComponent />);

    expect(counter.get('MyNamedComponent')).toBe(1);
  });

  it('should use function name if no displayName', () => {
    function FunctionComponent() {
      return <div>test</div>;
    }

    const TrackedComponent = withRenderCount(FunctionComponent, { counter });
    render(<TrackedComponent />);

    expect(counter.get('FunctionComponent')).toBe(1);
  });

  it('should set displayName on wrapped component', () => {
    const BaseComponent: React.FC = () => <div>test</div>;
    const TrackedComponent = withRenderCount(BaseComponent, {
      key: 'MyComponent',
      counter,
    });

    expect(TrackedComponent.displayName).toBe('withRenderCount(MyComponent)');
  });
});

describe('createRenderCountWrapper', () => {
  it('should create a wrapper for React Testing Library', () => {
    const counter = createRenderCounter();
    const Wrapper = createRenderCountWrapper(counter);

    const TestComponent: React.FC = () => {
      useRenderCount({ key: 'TestComponent' });
      return <div>Test</div>;
    };

    const { rerender } = render(<TestComponent />, { wrapper: Wrapper });
    expect(counter.get('TestComponent')).toBe(1);

    rerender(<TestComponent />);
    expect(counter.get('TestComponent')).toBe(2);
  });

  it('should set displayName on wrapper', () => {
    const counter = createRenderCounter();
    const Wrapper = createRenderCountWrapper(counter);
    expect(Wrapper.displayName).toBe('RenderCountWrapper');
  });
});

describe('Integration: Verifying Memoization', () => {
  let counter: RenderCounter;

  beforeEach(() => {
    counter = createRenderCounter();
  });

  it('should detect unnecessary re-renders in non-memoized components', () => {
    const Child: React.FC<{ onClick: () => void }> = ({ onClick }) => {
      useRenderCount({ key: 'Child' }, counter);
      return <button onClick={onClick}>Click</button>;
    };

    const Parent: React.FC = () => {
      const [count, setCount] = useState(0);
      useRenderCount({ key: 'Parent' }, counter);

      // Non-memoized handler - creates new function on every render
      const handleClick = () => setCount((c) => c + 1);

      return (
        <div>
          <span>{count}</span>
          <Child onClick={handleClick} />
        </div>
      );
    };

    const { rerender } = render(<Parent />);
    expect(counter.get('Parent')).toBe(1);
    expect(counter.get('Child')).toBe(1);

    // Force parent re-render
    rerender(<Parent />);

    // Both should re-render since Child is not memoized
    expect(counter.get('Parent')).toBe(2);
    expect(counter.get('Child')).toBe(2);
  });

  it('should verify memoized children do not re-render when handlers are stable', () => {
    const MemoizedChild = memo(function MemoizedChild({
      onClick,
    }: {
      onClick: () => void;
    }) {
      useRenderCount({ key: 'MemoizedChild' }, counter);
      return <button onClick={onClick}>Click</button>;
    });

    const Parent: React.FC = () => {
      const [count, setCount] = useState(0);
      useRenderCount({ key: 'Parent' }, counter);

      // Memoized handler - stable reference
      const handleClick = useCallback(() => {
        setCount((c) => c + 1);
      }, []);

      return (
        <div>
          <span data-testid="count">{count}</span>
          <MemoizedChild onClick={handleClick} />
        </div>
      );
    };

    render(<Parent />);
    expect(counter.get('Parent')).toBe(1);
    expect(counter.get('MemoizedChild')).toBe(1);

    // Trigger state update
    act(() => {
      screen.getByRole('button').click();
    });

    // Parent should re-render, but MemoizedChild should NOT
    // because onClick reference is stable
    expect(counter.get('Parent')).toBe(2);
    expect(counter.get('MemoizedChild')).toBe(1);

    // Use assertRenderCounts for cleaner test assertions
    assertRenderCounts(counter, [
      { key: 'Parent', expected: 2 },
      { key: 'MemoizedChild', expected: 1, mode: 'max' },
    ]);
  });

  it('should detect when memoization breaks due to unstable handlers', () => {
    const MemoizedChild = memo(function MemoizedChild({
      onClick,
    }: {
      onClick: () => void;
    }) {
      useRenderCount({ key: 'MemoizedChild' }, counter);
      return <button onClick={onClick}>Click</button>;
    });

    const Parent: React.FC = () => {
      const [count, setCount] = useState(0);
      useRenderCount({ key: 'Parent' }, counter);

      // Unstable handler - new function every render, breaks memoization
      const handleClick = () => setCount((c) => c + 1);

      return (
        <div>
          <span data-testid="count">{count}</span>
          <MemoizedChild onClick={handleClick} />
        </div>
      );
    };

    render(<Parent />);

    // Trigger state update
    act(() => {
      screen.getByRole('button').click();
    });

    // Both should re-render because handler reference changes
    expect(counter.get('Parent')).toBe(2);
    expect(counter.get('MemoizedChild')).toBe(2);

    // This assertion should FAIL, proving we can detect the problem
    expect(() =>
      assertRenderCounts(counter, [
        { key: 'MemoizedChild', expected: 1, mode: 'max' },
      ])
    ).toThrow('expected at most 1 renders');
  });

  it('should work with list item components', () => {
    const MemoizedListItem = memo(function ListItem({
      id,
      onClick,
    }: {
      id: string;
      onClick: (id: string) => void;
    }) {
      useRenderCount({ key: `ListItem-${id}` }, counter);
      return <button onClick={() => onClick(id)}>{id}</button>;
    });

    const List: React.FC<{ onSelect: (id: string) => void }> = ({
      onSelect,
    }) => {
      const [selected, setSelected] = useState<string | null>(null);
      useRenderCount({ key: 'List' }, counter);

      // Stable handler using useCallback
      const handleClick = useCallback(
        (id: string) => {
          setSelected(id);
          onSelect(id);
        },
        [onSelect]
      );

      return (
        <div>
          <span data-testid="selected">{selected}</span>
          <MemoizedListItem id="item-1" onClick={handleClick} />
          <MemoizedListItem id="item-2" onClick={handleClick} />
          <MemoizedListItem id="item-3" onClick={handleClick} />
        </div>
      );
    };

    const onSelect = vi.fn();
    render(<List onSelect={onSelect} />);

    // Initial render
    expect(counter.get('List')).toBe(1);
    expect(counter.get('ListItem-item-1')).toBe(1);
    expect(counter.get('ListItem-item-2')).toBe(1);
    expect(counter.get('ListItem-item-3')).toBe(1);

    // Click item 1
    act(() => {
      screen.getAllByRole('button')[0]?.click();
    });

    // List re-renders, but items should not (stable handler)
    expect(counter.get('List')).toBe(2);
    assertRenderCounts(counter, [
      { key: 'ListItem-item-1', expected: 1, mode: 'max' },
      { key: 'ListItem-item-2', expected: 1, mode: 'max' },
      { key: 'ListItem-item-3', expected: 1, mode: 'max' },
    ]);
  });
});
