/**
 * Graph Layout Algorithms
 *
 * Provides automatic node positioning for graph visualization.
 * Supports spiral layout and force-directed simulation.
 *
 * @module list/components/graph/graphLayout
 */

import type { GraphNodePosition } from '../../types';

/**
 * Node with edge connections for layout calculation
 */
export interface LayoutNode {
  id: string;
  connections: number;
}

/**
 * Calculate spiral layout positions for nodes.
 * Places most-connected nodes in the center, others in concentric rings.
 *
 * @param nodes - Array of nodes with connection counts
 * @param options - Layout options
 * @returns Map of node IDs to positions
 */
export function calculateSpiralLayout(
  nodes: LayoutNode[],
  options: {
    /** Base radius for first ring */
    baseRadius?: number;
    /** Radius increment per ring */
    radiusStep?: number;
    /** Nodes per ring (approximate) */
    nodesPerRing?: number;
    /** Center point */
    center?: GraphNodePosition;
  } = {}
): Map<string, GraphNodePosition> {
  const {
    baseRadius = 200,
    radiusStep = 180,
    nodesPerRing = 6,
    center = { x: 400, y: 300 },
  } = options;

  const positions = new Map<string, GraphNodePosition>();

  if (nodes.length === 0) return positions;

  // Sort by connections (most connected first)
  const sorted = [...nodes].sort((a, b) => b.connections - a.connections);

  // Place most connected node at center
  const [centerNode, ...restNodes] = sorted;
  if (!centerNode) return positions; // Safety check (shouldn't happen after length check)
  positions.set(centerNode.id, center);

  // Place remaining nodes in concentric rings
  let ringIndex = 0;
  let positionInRing = 0;
  const actualNodesPerRing = nodesPerRing;

  for (const node of restNodes) {
    // Calculate position in current ring
    const radius = baseRadius + ringIndex * radiusStep;
    const nodesInThisRing = Math.max(1, Math.floor(actualNodesPerRing * (1 + ringIndex * 0.5)));
    const angle = (2 * Math.PI * positionInRing) / nodesInThisRing;

    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);

    positions.set(node.id, { x, y });

    // Move to next position
    positionInRing++;
    if (positionInRing >= nodesInThisRing) {
      positionInRing = 0;
      ringIndex++;
    }
  }

  return positions;
}

/**
 * Calculate grid layout positions for nodes.
 * Simple grid arrangement, useful for many nodes.
 *
 * @param nodes - Array of nodes
 * @param options - Layout options
 * @returns Map of node IDs to positions
 */
export function calculateGridLayout(
  nodes: LayoutNode[],
  options: {
    /** Columns in grid */
    columns?: number;
    /** Spacing between nodes */
    spacing?: number;
    /** Starting position */
    start?: GraphNodePosition;
  } = {}
): Map<string, GraphNodePosition> {
  const {
    columns = Math.ceil(Math.sqrt(nodes.length)),
    spacing = 200,
    start = { x: 100, y: 100 },
  } = options;

  const positions = new Map<string, GraphNodePosition>();

  nodes.forEach((node, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    positions.set(node.id, {
      x: start.x + col * spacing,
      y: start.y + row * spacing,
    });
  });

  return positions;
}

/**
 * Calculate positions from edges (for connected graphs).
 * Analyzes edge connections to determine node positions.
 *
 * @param nodes - Array of node IDs
 * @param edges - Array of edges with source/target
 * @returns LayoutNode array with connection counts
 */
export function calculateConnectionCounts(
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>
): LayoutNode[] {
  const connectionMap = new Map<string, number>();

  // Initialize all nodes with 0 connections
  for (const id of nodeIds) {
    connectionMap.set(id, 0);
  }

  // Count connections from edges
  for (const edge of edges) {
    const sourceCount = connectionMap.get(edge.source) ?? 0;
    const targetCount = connectionMap.get(edge.target) ?? 0;
    connectionMap.set(edge.source, sourceCount + 1);
    connectionMap.set(edge.target, targetCount + 1);
  }

  return nodeIds.map((id) => ({
    id,
    connections: connectionMap.get(id) ?? 0,
  }));
}
