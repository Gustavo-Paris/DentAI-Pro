'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@pageshell/core';
import type { ScrollRevealProps, ScrollRevealAnimation } from './types';

/**
 * Get animation classes for initial (hidden) state
 */
function getInitialClasses(animation: ScrollRevealAnimation): string {
  switch (animation) {
    case 'fade-up':
      return 'opacity-0 translate-y-8';
    case 'fade-down':
      return 'opacity-0 -translate-y-8';
    case 'fade-left':
      return 'opacity-0 translate-x-8';
    case 'fade-right':
      return 'opacity-0 -translate-x-8';
    case 'fade-in':
      return 'opacity-0';
    case 'scale-up':
      return 'opacity-0 scale-95';
    case 'scale-down':
      return 'opacity-0 scale-105';
    default:
      return 'opacity-0 translate-y-8';
  }
}

/**
 * Get animation classes for visible state
 */
function getVisibleClasses(): string {
  return 'opacity-100 translate-y-0 translate-x-0 scale-100';
}

/**
 * ScrollReveal - Intersection Observer based reveal animation
 *
 * Reveals children with animation when they enter the viewport.
 * Respects `prefers-reduced-motion` accessibility setting.
 *
 * @example Basic usage
 * ```tsx
 * <ScrollReveal>
 *   <Card>Content that fades up when scrolled into view</Card>
 * </ScrollReveal>
 * ```
 *
 * @example With animation variant
 * ```tsx
 * <ScrollReveal animation="fade-left" delay={200}>
 *   <Card>Slides in from right</Card>
 * </ScrollReveal>
 * ```
 *
 * @example Staggered list
 * ```tsx
 * {items.map((item, index) => (
 *   <ScrollReveal key={item.id} delay={index * 100}>
 *     <ItemCard {...item} />
 *   </ScrollReveal>
 * ))}
 * ```
 */
export function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  once = true,
  className,
  style,
  testId,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Set up intersection observer
  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, once, prefersReducedMotion]);

  // If reduced motion, render without animation
  if (prefersReducedMotion) {
    return (
      <div className={className} style={style} data-testid={testId}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isVisible ? getVisibleClasses() : getInitialClasses(animation),
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        ...style,
      }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

ScrollReveal.displayName = 'ScrollReveal';
