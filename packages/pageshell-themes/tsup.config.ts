import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'presets/index': 'src/presets/index.ts',
    'hooks/index': 'src/hooks.tsx',
  },
  format: ['esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react/jsx-runtime'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
