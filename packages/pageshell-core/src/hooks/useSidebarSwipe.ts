/**
 * useSidebarSwipe - Touch gesture handling for mobile sidebar
 *
 * Features:
 * - Swipe right from left edge to open
 * - Swipe left to close
 * - Velocity-based detection
 * - Configurable thresholds
 *
 * @module hooks/useSidebarSwipe
 */

'use client';

import { useCallback, useRef, useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseSidebarSwipeOptions {
  /** Whether the sidebar is currently open */
  isOpen: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** Width of the edge trigger zone in pixels (default: 20) */
  edgeWidth?: number;
  /** Swipe distance threshold as percentage of screen width (default: 0.3 = 30%) */
  threshold?: number;
  /** Minimum velocity to trigger swipe (px/ms) (default: 0.5) */
  velocityThreshold?: number;
  /** Sidebar width in pixels (default: 288 = w-72) */
  sidebarWidth?: number;
  /** Whether swipe is enabled (default: true) */
  enabled?: boolean;
}

export interface SwipeState {
  /** Whether a swipe is currently in progress */
  isDragging: boolean;
  /** Current drag progress (0-1) */
  dragProgress: number;
  /** Current X translation in pixels */
  translateX: number;
}

export interface UseSidebarSwipeReturn {
  /** Current swipe state */
  state: SwipeState;
  /** Props to spread on the swipe container (document body or wrapper) */
  containerProps: {
    onTouchStart: (e: TouchEvent | React.TouchEvent) => void;
    onTouchMove: (e: TouchEvent | React.TouchEvent) => void;
    onTouchEnd: (e: TouchEvent | React.TouchEvent) => void;
  };
  /** Style for the sidebar during drag */
  sidebarStyle: {
    transform: string;
    transition: string;
  };
  /** Style for the backdrop during drag */
  backdropStyle: {
    opacity: number;
    transition: string;
  };
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_EDGE_WIDTH = 20;
const DEFAULT_THRESHOLD = 0.3;
const DEFAULT_VELOCITY_THRESHOLD = 0.5;
const DEFAULT_SIDEBAR_WIDTH = 288;

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for handling swipe gestures on mobile sidebar.
 *
 * @example
 * ```tsx
 * function MobileSidebar() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   const { containerProps, sidebarStyle, backdropStyle, state } = useSidebarSwipe({
 *     isOpen,
 *     onOpenChange: setIsOpen,
 *   });
 *
 *   // Attach to document
 *   useEffect(() => {
 *     const { onTouchStart, onTouchMove, onTouchEnd } = containerProps;
 *     document.addEventListener('touchstart', onTouchStart);
 *     document.addEventListener('touchmove', onTouchMove);
 *     document.addEventListener('touchend', onTouchEnd);
 *     return () => {
 *       document.removeEventListener('touchstart', onTouchStart);
 *       document.removeEventListener('touchmove', onTouchMove);
 *       document.removeEventListener('touchend', onTouchEnd);
 *     };
 *   }, [containerProps]);
 *
 *   return (
 *     <>
 *       <div style={backdropStyle} onClick={() => setIsOpen(false)} />
 *       <aside style={sidebarStyle}>
 *         Sidebar content
 *       </aside>
 *     </>
 *   );
 * }
 * ```
 */
export function useSidebarSwipe(
  options: UseSidebarSwipeOptions
): UseSidebarSwipeReturn {
  const {
    isOpen,
    onOpenChange,
    edgeWidth = DEFAULT_EDGE_WIDTH,
    threshold = DEFAULT_THRESHOLD,
    velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
    sidebarWidth = DEFAULT_SIDEBAR_WIDTH,
    enabled = true,
  } = options;

  // =============================================================================
  // Refs for tracking touch state
  // =============================================================================

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const isEdgeSwipe = useRef(false);
  const dragProgress = useRef(0);

  // =============================================================================
  // Touch Handlers
  // =============================================================================

  const onTouchStart = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (!enabled) return;

      // Handle both native TouchEvent and React.TouchEvent
      const touches = 'touches' in e ? e.touches : undefined;
      const touch = touches?.[0];
      if (!touch) return;

      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
      currentX.current = touch.clientX;

      // Check if starting from left edge (to open)
      if (!isOpen && touch.clientX <= edgeWidth) {
        isEdgeSwipe.current = true;
        isDragging.current = true;
      }

      // If open, allow closing from anywhere
      if (isOpen) {
        isDragging.current = true;
      }
    },
    [enabled, isOpen, edgeWidth]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (!enabled || !isDragging.current) return;

      // Handle both native TouchEvent and React.TouchEvent
      const touches = 'touches' in e ? e.touches : undefined;
      const touch = touches?.[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Cancel if vertical scroll is dominant
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && Math.abs(deltaX) < 30) {
        isDragging.current = false;
        isEdgeSwipe.current = false;
        return;
      }

      currentX.current = touch.clientX;

      // Calculate progress
      if (!isOpen && isEdgeSwipe.current) {
        // Opening: progress = how far we've swiped right
        const progress = Math.min(Math.max(deltaX / sidebarWidth, 0), 1);
        dragProgress.current = progress;
      } else if (isOpen) {
        // Closing: progress = how much sidebar is visible
        const progress = Math.min(Math.max(1 + deltaX / sidebarWidth, 0), 1);
        dragProgress.current = progress;
      }
    },
    [enabled, isOpen, sidebarWidth]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent | React.TouchEvent) => {
      if (!enabled || !isDragging.current) return;

      // Handle both native TouchEvent and React.TouchEvent
      const changedTouches = 'changedTouches' in e ? e.changedTouches : undefined;
      const touch = changedTouches?.[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX.current;
      const deltaTime = Date.now() - touchStartTime.current;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Determine final state based on progress and velocity
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      const swipeDistance = Math.abs(deltaX);
      const passedThreshold = swipeDistance > screenWidth * threshold;
      const passedVelocity = velocity > velocityThreshold;

      let shouldOpen = isOpen;

      if (!isOpen && isEdgeSwipe.current) {
        // Opening gesture
        if (passedThreshold || (passedVelocity && deltaX > 0)) {
          shouldOpen = true;
        }
      } else if (isOpen) {
        // Closing gesture
        if (
          (passedThreshold && deltaX < 0) ||
          (passedVelocity && deltaX < 0)
        ) {
          shouldOpen = false;
        }
      }

      if (shouldOpen !== isOpen) {
        onOpenChange(shouldOpen);
      }

      // Reset state
      isDragging.current = false;
      isEdgeSwipe.current = false;
      dragProgress.current = shouldOpen ? 1 : 0;
    },
    [enabled, isOpen, onOpenChange, threshold, velocityThreshold]
  );

  // =============================================================================
  // Computed Styles
  // =============================================================================

  const state = useMemo<SwipeState>(
    () => ({
      isDragging: isDragging.current,
      dragProgress: dragProgress.current,
      translateX: isDragging.current
        ? dragProgress.current * sidebarWidth - sidebarWidth
        : isOpen
          ? 0
          : -sidebarWidth,
    }),
    // Note: This won't update during drag, need to force re-render
    [isOpen, sidebarWidth]
  );

  const sidebarStyle = useMemo(
    () => ({
      transform: `translate3d(${isOpen ? 0 : -sidebarWidth}px, 0, 0)`,
      transition: isDragging.current ? 'none' : 'transform 300ms ease-out',
    }),
    [isOpen, sidebarWidth]
  );

  const backdropStyle = useMemo(
    () => ({
      opacity: isOpen ? 1 : 0,
      transition: isDragging.current ? 'none' : 'opacity 300ms ease-out',
    }),
    [isOpen]
  );

  // =============================================================================
  // Container Props
  // =============================================================================

  const containerProps = useMemo(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    }),
    [onTouchStart, onTouchMove, onTouchEnd]
  );

  return {
    state,
    containerProps,
    sidebarStyle,
    backdropStyle,
  };
}
