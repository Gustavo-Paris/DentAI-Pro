import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualListOptions {
  count: number;
  estimateSize: number;
  overscan?: number;
}

/**
 * Lightweight wrapper around @tanstack/react-virtual for virtualising long lists.
 *
 * Usage:
 *   const { parentRef, virtualizer, virtualItems, totalSize } = useVirtualList({
 *     count: items.length,
 *     estimateSize: 72,
 *   });
 *
 *   <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
 *     <div style={{ height: totalSize, position: 'relative' }}>
 *       {virtualItems.map((vRow) => (
 *         <div
 *           key={vRow.key}
 *           ref={virtualizer.measureElement}
 *           data-index={vRow.index}
 *           style={{
 *             position: 'absolute',
 *             top: 0,
 *             left: 0,
 *             width: '100%',
 *             transform: `translateY(${vRow.start}px)`,
 *           }}
 *         >
 *           {renderItem(items[vRow.index])}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 */
export function useVirtualList({ count, estimateSize, overscan = 5 }: UseVirtualListOptions) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => estimateSize, [estimateSize]),
    overscan,
  });

  return {
    parentRef,
    virtualizer,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
  };
}
