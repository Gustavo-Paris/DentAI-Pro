/**
 * GroupHeader Component
 *
 * Group header for PageTimeline date grouping.
 *
 * @package @pageshell/layouts
 */

'use client';

// =============================================================================
// Component
// =============================================================================

export function GroupHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3 -ml-8">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
