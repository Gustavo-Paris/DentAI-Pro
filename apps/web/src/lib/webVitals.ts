/**
 * Web Vitals Monitoring
 * Reports Core Web Vitals to Sentry for performance monitoring
 *
 * Metrics tracked (web-vitals v5):
 * - LCP (Largest Contentful Paint): Loading performance
 * - INP (Interaction to Next Paint): Interactivity (replaced FID in v4)
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial render
 * - TTFB (Time to First Byte): Server response time
 */

import * as Sentry from "@sentry/react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

// Thresholds for good/needs improvement/poor (in ms, except CLS)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

type MetricRating = "good" | "needs-improvement" | "poor";

function getRating(name: string, value: number): MetricRating {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return "needs-improvement";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

function sendToSentry(metric: Metric) {
  const rating = getRating(metric.name, metric.value);

  // Send as Sentry measurement
  Sentry.setMeasurement(metric.name, metric.value, metric.name === "CLS" ? "" : "millisecond");

  // Also capture as breadcrumb for context
  Sentry.addBreadcrumb({
    category: "web-vital",
    message: `${metric.name}: ${metric.value.toFixed(2)} (${rating})`,
    level: rating === "poor" ? "warning" : "info",
    data: {
      name: metric.name,
      value: metric.value,
      rating,
      id: metric.id,
      navigationType: metric.navigationType,
    },
  });

  // Log poor metrics as warnings for debugging
  if (rating === "poor" && import.meta.env.DEV) {
    console.warn(`[Web Vital] Poor ${metric.name}: ${metric.value.toFixed(2)}`);
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this once in main.tsx after Sentry is initialized
 */
export function initWebVitals() {
  // Only track in production or if explicitly enabled
  if (!import.meta.env.PROD && !import.meta.env.VITE_ENABLE_VITALS) {
    if (import.meta.env.DEV) {
      console.log("[Web Vitals] Disabled in development. Set VITE_ENABLE_VITALS=true to enable.");
    }
    return;
  }

  try {
    // Core Web Vitals (Google ranking factors)
    onLCP(sendToSentry);
    onINP(sendToSentry); // Replaced FID in web-vitals v4+
    onCLS(sendToSentry);

    // Additional metrics
    onFCP(sendToSentry);
    onTTFB(sendToSentry);

    if (import.meta.env.DEV) {
      console.log("[Web Vitals] Monitoring initialized");
    }
  } catch (error) {
    console.error("[Web Vitals] Failed to initialize:", error);
  }
}

/**
 * Custom performance mark for tracking specific user flows
 * Example: measureFlow('dsd-analysis', () => analyzeDSD())
 */
export async function measureFlow<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `flow-${name}`;

  performance.mark(startMark);

  try {
    const result = await fn();

    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const measure = performance.getEntriesByName(measureName)[0];
    if (measure) {
      Sentry.setMeasurement(measureName, measure.duration, "millisecond");

      Sentry.addBreadcrumb({
        category: "performance",
        message: `${name} completed in ${measure.duration.toFixed(0)}ms`,
        level: "info",
        data: { name, duration: measure.duration },
      });
    }

    return result;
  } catch (error) {
    performance.mark(endMark);
    throw error;
  } finally {
    // Cleanup marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  }
}

/**
 * Track a simple timing metric
 * Example: trackTiming('photo-upload', uploadDuration)
 */
export function trackTiming(name: string, durationMs: number) {
  Sentry.setMeasurement(name, durationMs, "millisecond");

  Sentry.addBreadcrumb({
    category: "timing",
    message: `${name}: ${durationMs.toFixed(0)}ms`,
    level: "info",
    data: { name, duration: durationMs },
  });
}
