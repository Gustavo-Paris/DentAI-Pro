'use client';

/**
 * GraphView Component
 *
 * Graph/network visualization view for ListPage.
 * Displays list items as nodes with optional edges showing relationships.
 *
 * Features:
 * - Pan/zoom navigation with Controls
 * - Optional MiniMap for large graphs
 * - Custom node rendering
 * - Auto-layout (spiral or grid)
 * - Edge visualization with labels
 *
 * @design-system-exception Hex colors are intentionally used because:
 * 1. React Flow requires inline hex colors for canvas rendering
 * 2. CSS custom properties don't work in canvas context
 * @see ADR-0006 (Theme Unification) for design system color guidelines
 *
 * @module list/components/graph/GraphView
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import type { Node, Edge, NodeMouseHandler, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';

import type { GraphViewConfig, GraphEdge } from '../../types';
import { DefaultGraphNode, CustomGraphNode } from './DefaultGraphNode';
import type { DefaultNodeData, CustomNodeData } from './DefaultGraphNode';
import {
  calculateSpiralLayout,
  calculateConnectionCounts,
} from './graphLayout';

/**
 * Props for GraphView component
 */
export interface GraphViewProps<TItem> {
  /** Items to display as nodes */
  items: TItem[];
  /** Extract unique key from item */
  keyExtractor: (item: TItem) => string;
  /** Graph configuration */
  config?: GraphViewConfig<TItem>;
  /** Custom node renderer */
  renderNode?: (item: TItem) => React.ReactNode;
  /** Edges between nodes */
  edges?: GraphEdge[];
  /** Node click handler */
  onNodeClick?: (item: TItem) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Edge type colors for visualization
 */
const edgeColors: Record<string, string> = {
  default: '#a1a1aa',
  related: '#8b5cf6',
  prerequisite: '#3b82f6',
  extends: '#f59e0b',
  contradicts: '#ef4444',
  example_of: '#22c55e',
};

/**
 * Map background option to React Flow variant
 */
function getBackgroundVariant(bg?: 'dots' | 'lines' | 'none'): BackgroundVariant {
  if (bg === 'lines') return 'lines' as BackgroundVariant;
  if (bg === 'none') return 'dots' as BackgroundVariant; // Will be hidden via style
  return 'dots' as BackgroundVariant;
}

/**
 * GraphView - Network visualization for ListPage items
 *
 * @example Basic usage
 * ```tsx
 * <GraphView
 *   items={knowledgeBases}
 *   keyExtractor={(kb) => kb.id}
 *   config={{ showControls: true, showMinimap: true }}
 *   edges={sharedProposalEdges}
 *   onNodeClick={(kb) => router.push(`/kb/${kb.id}`)}
 * />
 * ```
 *
 * @example With custom node renderer
 * ```tsx
 * <GraphView
 *   items={items}
 *   keyExtractor={(item) => item.id}
 *   renderNode={(item) => <CustomNodeCard item={item} />}
 * />
 * ```
 */
export function GraphView<TItem>({
  items,
  keyExtractor,
  config = {},
  renderNode,
  edges = [],
  onNodeClick,
  isLoading = false,
  className,
}: GraphViewProps<TItem>) {
  const {
    showControls = true,
    showMinimap = false,
    background = 'dots',
    height = 600,
    getNodePosition,
    draggable = true,
    interactive = true,
    fitView = true,
  } = config;

  // Track items for position recalculation
  const [lastItemCount, setLastItemCount] = useState(items.length);

  // Create item map for quick lookup
  const itemMap = useMemo(() => {
    const map = new Map<string, TItem>();
    for (const item of items) {
      map.set(keyExtractor(item), item);
    }
    return map;
  }, [items, keyExtractor]);

  // Register custom node types
  const nodeTypes = useMemo(
    () => ({
      default: DefaultGraphNode,
      custom: CustomGraphNode,
    }),
    []
  );

  // Calculate node positions
  const nodePositions = useMemo(() => {
    if (getNodePosition) {
      // Use custom position calculator
      const positions = new Map<string, { x: number; y: number }>();
      items.forEach((item, index) => {
        const id = keyExtractor(item);
        positions.set(id, getNodePosition(item, index, items.length));
      });
      return positions;
    }

    // Use auto-layout based on edges
    const nodeIds = items.map(keyExtractor);
    const layoutNodes = calculateConnectionCounts(
      nodeIds,
      edges.map((e) => ({ source: e.source, target: e.target }))
    );
    return calculateSpiralLayout(layoutNodes);
  }, [items, edges, keyExtractor, getNodePosition]);

  // Convert items to React Flow nodes
  const initialNodes = useMemo((): Node[] => {
    return items.map((item) => {
      const id = keyExtractor(item);
      const position = nodePositions.get(id) || { x: 0, y: 0 };

      if (renderNode) {
        // Custom render mode
        return {
          id,
          type: 'custom',
          position,
          draggable,
          data: {
            item,
            renderNode,
          } as CustomNodeData<TItem>,
        };
      }

      // Default render mode - extract common fields
      const itemAny = item as Record<string, unknown>;
      return {
        id,
        type: 'default',
        position,
        draggable,
        data: {
          title: String(itemAny.name || itemAny.title || id),
          subtitle: itemAny.description ? String(itemAny.description) : undefined,
          status: mapStatus(itemAny.status as string),
          badge: itemAny.status ? String(itemAny.status) : undefined,
          icon: getItemIcon(itemAny),
          item,
        } as DefaultNodeData,
      };
    });
  }, [items, keyExtractor, nodePositions, renderNode, draggable]);

  // Convert edges to React Flow format
  const initialEdges = useMemo((): Edge[] => {
    return edges.map((edge) => {
      const color = edgeColors[edge.type || 'default'] || edgeColors.default;
      const strokeWidth = edge.strength ? 1 + edge.strength * 3 : 2;

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'default',
        animated: edge.type === 'related',
        style: {
          stroke: color,
          strokeWidth,
        },
        labelStyle: {
          fill: color,
          fontWeight: 500,
          fontSize: 11,
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 15,
          height: 15,
        },
      };
    });
  }, [edges]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when items change
  useEffect(() => {
    if (items.length !== lastItemCount) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      setLastItemCount(items.length);
    }
  }, [items.length, lastItemCount, initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node click
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (onNodeClick) {
        const item = itemMap.get(node.id);
        if (item) {
          onNodeClick(item);
        }
      }
    },
    [onNodeClick, itemMap]
  );

  // Loading state
  if (isLoading) {
    return (
      <div
        className={className}
        style={{
          height: typeof height === 'number' ? height : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          borderRadius: 8,
          border: '1px solid #e4e4e7',
        }}
      >
        <div style={{ textAlign: 'center', color: '#71717a' }}>
          <div style={{ marginBottom: 8 }}>Loading graph...</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={className}
        style={{
          height: typeof height === 'number' ? height : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          borderRadius: 8,
          border: '1px solid #e4e4e7',
        }}
      >
        <div style={{ textAlign: 'center', color: '#71717a' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🕸️</div>
          <div>No items to display in graph</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        height: typeof height === 'number' ? height : height,
        width: '100%',
        borderRadius: 8,
        border: '1px solid #e4e4e7',
        overflow: 'hidden',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView={fitView}
        panOnScroll={interactive}
        zoomOnScroll={interactive}
        panOnDrag={interactive}
        selectionOnDrag={false}
        nodesDraggable={draggable}
        nodesConnectable={false}
        elementsSelectable={true}
        minZoom={0.2}
        maxZoom={2}
      >
        {showControls && <Controls showInteractive={false} />}
        {background !== 'none' && (
          <Background
            variant={getBackgroundVariant(background)}
            gap={20}
            size={1}
            color="#e4e4e7"
          />
        )}
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as DefaultNodeData;
              if (data.status === 'success') return '#22c55e';
              if (data.status === 'error') return '#ef4444';
              if (data.status === 'warning') return '#f59e0b';
              return '#8b5cf6';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        )}
      </ReactFlow>
    </div>
  );
}

/**
 * Map item status to node status
 */
function mapStatus(
  status?: string
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (!status) return 'default';
  const s = status.toLowerCase();
  if (s === 'active' || s === 'completed' || s === 'published') return 'success';
  if (s === 'pending' || s === 'draft') return 'warning';
  if (s === 'failed' || s === 'error' || s === 'archived') return 'error';
  if (s === 'processing' || s === 'in_progress') return 'info';
  return 'default';
}

/**
 * Get icon for item based on type
 */
function getItemIcon(item: Record<string, unknown>): string | undefined {
  const type = item.type as string;
  if (type === 'file') return '📄';
  if (type === 'url') return '🔗';
  if (type === 'text') return '📝';
  if (type === 'knowledge_base') return '🗃️';
  return '📦';
}
