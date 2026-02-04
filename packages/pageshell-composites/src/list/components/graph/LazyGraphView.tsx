/**
 * LazyGraphView Component
 *
 * Lazy-loaded wrapper for GraphView using React.lazy() and Suspense.
 * Reduces initial bundle size for pages that don't use graph mode (~50KB savings).
 *
 * @module list/components/graph/LazyGraphView
 */

'use client';

import * as React from 'react';
import type { GraphViewProps } from './GraphView';
import { GraphViewSkeleton } from './GraphViewSkeleton';
import type { GraphViewSkeletonProps } from './GraphViewSkeleton';

// Lazy load the GraphView component
const GraphViewLazy = React.lazy(() =>
  import('./GraphView').then((module) => ({ default: module.GraphView }))
);

/**
 * Extended props for LazyGraphView
 * Includes all GraphViewProps plus skeleton configuration
 */
export interface LazyGraphViewProps<TItem> extends GraphViewProps<TItem> {
  /**
   * Custom skeleton component to show while loading.
   * If not provided, uses GraphViewSkeleton with default props.
   */
  skeleton?: React.ReactNode;

  /**
   * Props to pass to the default GraphViewSkeleton.
   * Only used when `skeleton` is not provided.
   */
  skeletonProps?: Omit<GraphViewSkeletonProps, 'height'>;
}

/**
 * LazyGraphView - Lazy-loaded GraphView with Suspense
 *
 * Wraps GraphView in React.lazy() for code splitting, showing a skeleton
 * fallback while the component loads. This reduces the initial bundle size
 * for pages that don't immediately need graph view functionality.
 *
 * @example Basic usage (auto skeleton)
 * ```tsx
 * <LazyGraphView
 *   items={knowledgeBases}
 *   keyExtractor={(kb) => kb.id}
 *   config={{ height: 600 }}
 * />
 * ```
 *
 * @example With custom skeleton props
 * ```tsx
 * <LazyGraphView
 *   items={items}
 *   keyExtractor={(item) => item.id}
 *   config={{ height: 800, showMinimap: true }}
 *   skeletonProps={{ nodeCount: 8, showMinimap: true }}
 * />
 * ```
 *
 * @example With custom skeleton component
 * ```tsx
 * <LazyGraphView
 *   items={items}
 *   keyExtractor={(item) => item.id}
 *   skeleton={<MyCustomSkeleton />}
 * />
 * ```
 */
export function LazyGraphView<TItem>({
  skeleton,
  skeletonProps,
  config = {},
  ...graphViewProps
}: LazyGraphViewProps<TItem>) {
  // Extract height from config for skeleton
  const height = config.height ?? 600;
  const showControls = config.showControls ?? true;
  const showMinimap = config.showMinimap ?? false;

  // Build fallback skeleton
  const fallback = skeleton ?? (
    <GraphViewSkeleton
      height={height}
      showControls={showControls}
      showMinimap={showMinimap}
      {...skeletonProps}
    />
  );

  return (
    <React.Suspense fallback={fallback}>
      {/* @ts-ignore -- Generic type covariance issue with React.lazy; error depends on type resolution context */}
      <GraphViewLazy config={config} {...graphViewProps} />
    </React.Suspense>
  );
}

LazyGraphView.displayName = 'LazyGraphView';
