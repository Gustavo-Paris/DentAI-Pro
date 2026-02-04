/**
 * GraphViewSkeleton Component
 *
 * Loading state skeleton for GraphView component.
 * Displays a toolbar placeholder and canvas area with node shapes.
 *
 * @module list/components/graph/GraphViewSkeleton
 */

'use client';

import * as React from 'react';
import { Skeleton } from '@pageshell/primitives';
import { cn } from '@pageshell/core';

/**
 * Props for GraphViewSkeleton
 */
export interface GraphViewSkeletonProps {
  /** Height of the skeleton container */
  height?: number | string;
  /** Show controls skeleton */
  showControls?: boolean;
  /** Show minimap skeleton */
  showMinimap?: boolean;
  /** Number of node placeholders to show */
  nodeCount?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Node placeholder positions for skeleton
 * Uses a spread pattern to simulate a graph layout
 */
const defaultNodePositions = [
  { x: '20%', y: '30%' },
  { x: '50%', y: '20%' },
  { x: '75%', y: '35%' },
  { x: '30%', y: '60%' },
  { x: '60%', y: '55%' },
  { x: '45%', y: '80%' },
];

/**
 * GraphViewSkeleton - Loading state for GraphView
 *
 * Renders a placeholder that matches the GraphView layout:
 * - Border and rounded container
 * - Controls placeholder (if enabled)
 * - Node placeholders in a spread pattern
 * - Optional minimap placeholder
 *
 * @example
 * ```tsx
 * <GraphViewSkeleton
 *   height={600}
 *   showControls
 *   nodeCount={6}
 * />
 * ```
 */
export function GraphViewSkeleton({
  height = 600,
  showControls = true,
  showMinimap = false,
  nodeCount = 6,
  className,
}: GraphViewSkeletonProps) {
  // Determine which node positions to use
  const positions = React.useMemo(() => {
    if (nodeCount <= defaultNodePositions.length) {
      return defaultNodePositions.slice(0, nodeCount);
    }
    // Generate additional random-ish positions if more nodes requested
    const extra: Array<{ x: string; y: string }> = [];
    for (let i = defaultNodePositions.length; i < nodeCount; i++) {
      extra.push({
        x: `${15 + (i * 17) % 70}%`,
        y: `${20 + (i * 23) % 60}%`,
      });
    }
    return [...defaultNodePositions, ...extra];
  }, [nodeCount]);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-border bg-muted/30',
        className
      )}
      style={{
        height: typeof height === 'number' ? height : height,
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading graph view"
    >
      {/* Controls skeleton (bottom left, matches React Flow Controls) */}
      {showControls && (
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1">
          <Skeleton animation="pulse" className="h-7 w-7 rounded" />
          <Skeleton animation="pulse" className="h-7 w-7 rounded" />
          <Skeleton animation="pulse" className="h-7 w-7 rounded" />
          <Skeleton animation="pulse" className="h-7 w-7 rounded" />
        </div>
      )}

      {/* Minimap skeleton (bottom right, matches React Flow MiniMap) */}
      {showMinimap && (
        <div className="absolute bottom-4 right-4 z-10">
          <Skeleton
            animation="shimmer"
            className="h-24 w-32 rounded border border-border"
          />
        </div>
      )}

      {/* Background dots pattern (simulating React Flow background) */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, var(--color-border, #e4e4e7) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Node placeholders */}
      {positions.map((pos, index) => (
        <div
          key={index}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: pos.x,
            top: pos.y,
          }}
        >
          {/* Node card skeleton */}
          <Skeleton
            animation="shimmer"
            className="h-20 w-40 rounded-lg border border-border shadow-sm"
          />
        </div>
      ))}

      {/* Edge placeholders (simple lines between some nodes) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
        style={{ zIndex: 0 }}
      >
        {/* Simulated edges connecting nodes */}
        <line
          x1="22%"
          y1="32%"
          x2="48%"
          y2="22%"
          stroke="var(--color-border, #e4e4e7)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <line
          x1="52%"
          y1="22%"
          x2="73%"
          y2="33%"
          stroke="var(--color-border, #e4e4e7)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <line
          x1="32%"
          y1="58%"
          x2="58%"
          y2="53%"
          stroke="var(--color-border, #e4e4e7)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <line
          x1="47%"
          y1="78%"
          x2="32%"
          y2="62%"
          stroke="var(--color-border, #e4e4e7)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </svg>
    </div>
  );
}

GraphViewSkeleton.displayName = 'GraphViewSkeleton';
