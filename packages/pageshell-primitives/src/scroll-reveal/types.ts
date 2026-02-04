import type { ReactNode } from 'react';

/**
 * Animation variants for ScrollReveal
 */
export type ScrollRevealAnimation =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'fade-in'
  | 'scale-up'
  | 'scale-down';

/**
 * Props for ScrollReveal component
 */
export interface ScrollRevealProps {
  /** Content to reveal */
  children: ReactNode;
  /** Animation variant (default: 'fade-up') */
  animation?: ScrollRevealAnimation;
  /** Delay before animation starts in ms (default: 0) */
  delay?: number;
  /** Animation duration in ms (default: 700) */
  duration?: number;
  /** Intersection threshold 0-1 (default: 0.1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Whether to only animate once (default: true) */
  once?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Test ID for testing */
  testId?: string;
}
