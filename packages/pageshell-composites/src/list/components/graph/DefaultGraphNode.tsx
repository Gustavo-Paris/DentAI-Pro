'use client';

/**
 * DefaultGraphNode
 *
 * Default node renderer for GraphView when no custom renderGraphNode is provided.
 * Displays items as card-like nodes with title, subtitle, and status badge.
 *
 * @design-system-exception Hex colors are intentionally used because:
 * 1. React Flow requires inline hex colors for node styling
 * 2. Canvas-based rendering doesn't inherit CSS custom properties
 * @see ADR-0006 (Theme Unification) for design system color guidelines
 *
 * @module list/components/graph/DefaultGraphNode
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

/**
 * Data passed to the default graph node
 */
export interface DefaultNodeData {
  /** Node title (primary text) */
  title: string;
  /** Node subtitle (secondary text) */
  subtitle?: string;
  /** Status for badge styling */
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Badge text */
  badge?: string;
  /** Icon emoji or text */
  icon?: string;
  /** Original item reference */
  item?: unknown;
}

/**
 * Status colors for node styling
 * Using hex colors because React Flow canvas doesn't support CSS variables
 */
const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  default: { bg: '#f4f4f5', border: '#a1a1aa', text: '#52525b' },
  success: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
};

/**
 * Default graph node component
 *
 * @example
 * ```tsx
 * // Used automatically when renderGraphNode is not provided
 * <GraphView
 *   items={items}
 *   // No renderGraphNode = uses DefaultGraphNode
 * />
 * ```
 */
function DefaultGraphNodeComponent({ data }: NodeProps<DefaultNodeData>) {
  const status = data.status || 'default';
  const defaultColors = { bg: '#f4f4f5', border: '#a1a1aa', text: '#52525b' };
  const colors = statusColors[status] ?? defaultColors;

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: 2,
        borderStyle: 'solid',
        borderRadius: 8,
        padding: '12px 16px',
        minWidth: 160,
        maxWidth: 240,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      className="default-graph-node"
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: colors.border,
          width: 8,
          height: 8,
          border: 'none',
        }}
      />

      {/* Node content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Icon */}
        {data.icon && (
          <span style={{ fontSize: 20, lineHeight: 1 }}>{data.icon}</span>
        )}

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: '#18181b',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.title}
          </div>

          {/* Subtitle */}
          {data.subtitle && (
            <div
              style={{
                fontSize: 12,
                color: '#71717a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: 2,
              }}
            >
              {data.subtitle}
            </div>
          )}

          {/* Badge */}
          {data.badge && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginTop: 6,
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: colors.border + '20',
                color: colors.text,
              }}
            >
              {data.badge}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: colors.border,
          width: 8,
          height: 8,
          border: 'none',
        }}
      />
    </div>
  );
}

export const DefaultGraphNode = memo(DefaultGraphNodeComponent);

/**
 * Custom node renderer wrapper
 * Wraps a custom render function with React Flow handles
 */
export interface CustomNodeData<TItem = unknown> {
  item: TItem;
  renderNode: (item: TItem) => React.ReactNode;
}

function CustomGraphNodeComponent<TItem>({ data }: NodeProps<CustomNodeData<TItem>>) {
  return (
    <div style={{ position: 'relative' }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#8b5cf6',
          width: 8,
          height: 8,
          border: 'none',
        }}
      />

      {data.renderNode(data.item)}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#8b5cf6',
          width: 8,
          height: 8,
          border: 'none',
        }}
      />
    </div>
  );
}

export const CustomGraphNode = memo(CustomGraphNodeComponent) as <TItem>(
  props: NodeProps<CustomNodeData<TItem>>
) => React.ReactElement;
