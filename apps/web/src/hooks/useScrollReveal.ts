import { useEffect, useRef } from 'react';

const THRESHOLD = 0.15;
const ROOT_MARGIN = '0px 0px -40px 0px';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reveals a single element when it enters the viewport.
 * Add `scroll-reveal` (or `scroll-reveal-scale`) class to the element.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.classList.add('revealed');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      },
      { threshold: THRESHOLD, rootMargin: ROOT_MARGIN },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * Reveals all `.scroll-reveal` children inside a container at once
 * (stagger via `scroll-reveal-delay-N` CSS classes).
 */
export function useScrollRevealChildren<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const children = container.querySelectorAll<HTMLElement>(
      '.scroll-reveal, .scroll-reveal-scale',
    );

    if (children.length === 0) return;

    if (prefersReducedMotion()) {
      children.forEach((child) => child.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach((child) => child.classList.add('revealed'));
          observer.unobserve(container);
        }
      },
      { threshold: THRESHOLD, rootMargin: ROOT_MARGIN },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return ref;
}
