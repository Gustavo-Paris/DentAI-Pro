import { defineConfig } from 'tsup';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function addUseClientDirective() {
  const distDir = join(import.meta.dirname, 'dist');

  async function processDir(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await processDir(fullPath);
      } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.d.ts')) {
        const content = await readFile(fullPath, 'utf-8');
        if (!content.startsWith('"use client"')) {
          await writeFile(fullPath, `"use client";\n${content}`);
        }
      }
    }
  }

  await processDir(distDir);
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    modal: 'src/modal.ts',
    drawer: 'src/drawer.ts',
    filters: 'src/filters.ts',
    search: 'src/search.ts',
    list: 'src/list.ts',
    pagination: 'src/pagination.ts',
    'infinite-scroll': 'src/infinite-scroll.ts',
    alert: 'src/alert.ts',
    'floating-action': 'src/floating-action.ts',
    wizard: 'src/wizard/index.ts',
    form: 'src/form/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'next',
    'next/link',
    'next/navigation',
    '@pageshell/core',
    '@pageshell/primitives',
    '@pageshell/theme',
  ],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  onSuccess: addUseClientDirective,
});
