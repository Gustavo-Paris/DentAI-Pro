/**
 * ListPage Graph View Types
 *
 * Type definitions for graph/network visualization mode.
 *
 * @module list/types/graph
 */

// =============================================================================
// Graph Mode Types
// =============================================================================

/**
 * Graph edge configuration
 */
export interface GraphEdge {
  /** Unique edge ID */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Edge label (optional) */
  label?: string;
  /** Edge type for styling (e.g., 'related', 'prerequisite') */
  type?: string;
  /** Edge strength/weight (0-1) for visual thickness */
  strength?: number;
  /** Additional edge data */
  data?: Record<string, unknown>;
}

/**
 * Node position in the graph
 */
export interface GraphNodePosition {
  x: number;
  y: number;
}

/**
 * Graph view configuration
 */
export interface GraphViewConfig<TItem = unknown> {
  /**
   * Show zoom/pan controls
   * @default true
   */
  showControls?: boolean;

  /**
   * Show minimap for navigation
   * @default false
   */
  showMinimap?: boolean;

  /**
   * Background pattern
   * @default 'dots'
   */
  background?: 'dots' | 'lines' | 'none';

  /**
   * Graph container height
   * @default 600
   */
  height?: number | string;

  /**
   * Custom node position calculator
   * If not provided, uses auto-layout algorithm
   */
  getNodePosition?: (item: TItem, index: number, total: number) => GraphNodePosition;

  /**
   * Enable node dragging
   * @default true
   */
  draggable?: boolean;

  /**
   * Enable pan/zoom interactions
   * @default true
   */
  interactive?: boolean;

  /**
   * Fit view on load
   * @default true
   */
  fitView?: boolean;
}
