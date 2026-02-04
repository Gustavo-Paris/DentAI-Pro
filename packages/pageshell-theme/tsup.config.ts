import { defineConfig } from 'tsup';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function addUseClientDirective() {
  const distDir = join(import.meta.dirname, 'dist');
  const files = await readdir(distDir);

  for (const file of files) {
    if (file.endsWith('.js') && !file.endsWith('.d.ts')) {
      const filePath = join(distDir, file);
      const content = await readFile(filePath, 'utf-8');
      if (!content.startsWith('"use client"')) {
        await writeFile(filePath, `"use client";\n${content}`);
      }
    }
  }
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    context: 'src/context.tsx',
    types: 'src/types.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', '@pageshell/primitives'],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  onSuccess: addUseClientDirective,
});
