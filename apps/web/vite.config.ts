import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/vendor-heic-*.js', '**/vendor-pdf-*.js', '**/vendor-recharts-*.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
        ],
      },
    }),
    ...(process.env.ANALYZE === "true"
      ? [visualizer({ filename: "dist/stats.html", open: true })]
      : []),
    ...(process.env.SENTRY_AUTH_TOKEN ? [
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          filesToDeleteAfterUpload: ['**/*.map'],
        },
      }),
    ] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['@parisgroup-ai/domain-odonto-ai'],
  },
  build: {
    sourcemap: 'hidden', // Generate for Sentry upload, don't serve publicly
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI framework
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          // Data fetching
          'vendor-query': ['@tanstack/react-query'],
          // Date utilities
          'vendor-date': ['date-fns', 'react-day-picker'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // PDF generation (lazy loaded)
          'vendor-pdf': ['jspdf'],
          // HEIC conversion (lazy loaded)
          'vendor-heic': ['heic-to'],
          // Charts (Dashboard only)
          'vendor-recharts': ['recharts'],
          // PageShell design system
          'vendor-pageshell': [
            '@parisgroup-ai/pageshell/primitives',
            '@parisgroup-ai/pageshell/composites',
            '@parisgroup-ai/pageshell/interactions',
            '@parisgroup-ai/pageshell/core',
            '@parisgroup-ai/pageshell/theme',
          ],
        },
      },
    },
    // Suppress warnings for intentionally large chunks (PDF/HEIC are lazy loaded)
    chunkSizeWarningLimit: 500,
  },
}));
