import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    patients: './src/patients/index.ts',
    appointments: './src/appointments/index.ts',
    treatments: './src/treatments/index.ts',
    billing: './src/billing/index.ts',
    dashboard: './src/dashboard/index.ts',
    settings: './src/settings/index.ts',
    inventory: './src/inventory/index.ts',
    imaging: './src/imaging/index.ts',
    prescriptions: './src/prescriptions/index.ts',
  },
  format: ['esm'],
  target: 'es2022',
  outDir: 'dist',
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  sourcemap: true,
  external: [
    'react',
    'react-dom',
    '@parisgroup-ai/pageshell',
    '@parisgroup-ai/pageshell/*',
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
