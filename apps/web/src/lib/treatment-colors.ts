/**
 * Canonical treatment-type → color mapping.
 *
 * Single source of truth for all treatment color references:
 * - Dashboard charts (useDashboard.ts)
 * - DSD annotation overlays (AnnotationOverlay.tsx)
 *
 * Hex values are required because:
 * - SVG stroke/fill attributes don't universally support CSS custom properties
 * - Recharts requires resolved color strings
 *
 * Color assignments follow the PageShell primitive palette where possible:
 * - resina: blue-500, porcelana: amber-500, coroa: purple (violet-like)
 * - implante: red-500, endodontia: rose-500, gengivoplastia: pink-500
 * - recobrimento_radicular: teal-500, encaminhamento: gray-500
 */
export const TREATMENT_COLORS: Record<string, string> = {
  resina: '#3b82f6',                // blue-500
  porcelana: '#f59e0b',             // amber-500
  coroa: '#a855f7',                 // purple-500
  implante: '#ef4444',              // red-500
  endodontia: '#f43f5e',            // rose-500
  encaminhamento: '#6b7280',        // gray-500
  gengivoplastia: '#ec4899',        // pink-500
  recobrimento_radicular: '#14b8a6', // teal-500
};

/** Fallback color for unknown treatment types */
export const TREATMENT_COLOR_FALLBACK = '#6b7280';
