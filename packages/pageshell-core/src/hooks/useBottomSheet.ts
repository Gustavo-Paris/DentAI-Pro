/**
 * useBottomSheet - Swipe Gesture Hook for Mobile Modals
 *
 * Provides touch-based swipe gestures for bottom sheet components.
 * Supports snap points, swipe-to-close, and programmatic control.
 *
 * @module hooks/useBottomSheet
 *
 * @example Basic usage
 * ```tsx
 * function MySheet({ open, onOpenChange }) {
 *   const { sheetProps, currentSnapIndex } = useBottomSheet({
 *     open,
 *     onOpenChange,
 *   });
 *
 *   return <div {...sheetProps}>Content</div>;
 * }
 * ```
 *
 * @example With custom snap points
 * ```tsx
 * const { sheetProps, snapTo, currentSnapIndex } = useBottomSheet({
 *   open,
 *   onOpenChange,
 *   snapPoints: [30, 60, 100],
 *   defaultSnapIndex: 1,
 *   onSnapChange: (index) => console.log('Snapped to:', index),
 * });
 * ```
 */

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type TouchEvent,
} from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseBottomSheetOptions {
  /** Open/closed state */
  open: boolean;
  /** Callback when state changes */
  onOpenChange: (open: boolean) => void;
  /** Snap points in % of viewport (default: [50, 100]) */
  snapPoints?: number[];
  /** Initial snap index (default: last) */
  defaultSnapIndex?: number;
  /** Close when swiping down */
  closeOnSwipeDown?: boolean;
  /** Threshold for closing (% of sheet height) */
  closeThreshold?: number;
  /** Callback when snap changes */
  onSnapChange?: (snapIndex: number) => void;
  /** Lock body scroll when open */
  lockBodyScroll?: boolean;
}

export interface UseBottomSheetReturn {
  /** Props for the sheet container */
  sheetProps: {
    ref: RefObject<HTMLDivElement | null>;
    style: CSSProperties;
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
  };
  /** Programmatic snap */
  snapTo: (index: number) => void;
  /** Current state */
  currentSnapIndex: number;
  isDragging: boolean;
  dragProgress: number;
}

// =============================================================================
// Hook
// =============================================================================

export function useBottomSheet({
  open,
  onOpenChange,
  snapPoints = [50, 100],
  defaultSnapIndex,
  closeOnSwipeDown = true,
  closeThreshold = 25,
  onSnapChange,
  lockBodyScroll = true,
}: UseBottomSheetOptions): UseBottomSheetReturn {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(
    defaultSnapIndex ?? snapPoints.length - 1
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const touchStartY = useRef(0);

  // =========================================================================
  // Computed Values
  // =========================================================================

  // Calculate current height from snap point
  const currentSnapHeight = snapPoints[currentSnapIndex] ?? 100;
  const sheetHeight = `${currentSnapHeight}vh`;

  // =========================================================================
  // Side Effects
  // =========================================================================

  // Lock body scroll
  useEffect(() => {
    if (!lockBodyScroll) return;

    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, lockBodyScroll]);

  // Reset snap when opening
  useEffect(() => {
    if (open) {
      setCurrentSnapIndex(defaultSnapIndex ?? snapPoints.length - 1);
      setDragOffset(0);
    }
  }, [open, defaultSnapIndex, snapPoints.length]);

  // =========================================================================
  // Touch Handlers
  // =========================================================================

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    touchStartY.current = touch.clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - touchStartY.current;

      // Only allow dragging down (positive deltaY)
      if (deltaY > 0) {
        setDragOffset(deltaY);
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    const sheetElement = sheetRef.current;
    if (!sheetElement) {
      setDragOffset(0);
      return;
    }

    const sheetHeightPx = sheetElement.getBoundingClientRect().height;
    const dragPercentage = (dragOffset / sheetHeightPx) * 100;

    // Check if should close
    if (closeOnSwipeDown && dragPercentage > closeThreshold) {
      onOpenChange(false);
      setDragOffset(0);
      return;
    }

    // Find nearest snap point
    const viewportHeight = window.innerHeight;
    const currentHeightPercent =
      ((sheetHeightPx - dragOffset) / viewportHeight) * 100;

    let nearestSnapIndex = currentSnapIndex;
    let nearestDistance = Infinity;

    snapPoints.forEach((snap, index) => {
      const distance = Math.abs(snap - currentHeightPercent);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestSnapIndex = index;
      }
    });

    if (nearestSnapIndex !== currentSnapIndex) {
      setCurrentSnapIndex(nearestSnapIndex);
      onSnapChange?.(nearestSnapIndex);
    }

    setDragOffset(0);
  }, [
    dragOffset,
    closeOnSwipeDown,
    closeThreshold,
    onOpenChange,
    snapPoints,
    currentSnapIndex,
    onSnapChange,
  ]);

  // =========================================================================
  // Public API
  // =========================================================================

  const snapTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < snapPoints.length) {
        setCurrentSnapIndex(index);
        onSnapChange?.(index);
      }
    },
    [snapPoints.length, onSnapChange]
  );

  // Memoized drag progress for performance
  const dragProgress = useMemo(() => {
    if (!isDragging || !sheetRef.current) return 0;
    return dragOffset / sheetRef.current.getBoundingClientRect().height;
  }, [isDragging, dragOffset]);

  const style: CSSProperties = {
    // Use maxHeight instead of height to allow content-based sizing
    // The sheet will be as tall as its content, up to the snap point limit
    maxHeight: sheetHeight,
    transform: isDragging ? `translateY(${dragOffset}px)` : 'translateY(0)',
    transition: isDragging
      ? 'none'
      : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), max-height 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
  };

  // =========================================================================
  // Return
  // =========================================================================

  return {
    sheetProps: {
      ref: sheetRef,
      style,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    snapTo,
    currentSnapIndex,
    isDragging,
    dragProgress,
  };
}
