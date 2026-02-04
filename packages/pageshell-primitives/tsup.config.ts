import { defineConfig } from 'tsup';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
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
    'button/index': 'src/button/index.ts',
    'dialog/index': 'src/dialog/index.ts',
    'dropdown/index': 'src/dropdown/index.ts',
    'table/index': 'src/table/index.ts',
    'tabs/index': 'src/tabs/index.ts',
    'tooltip/index': 'src/tooltip/index.ts',
    'skeleton/index': 'src/skeleton/index.ts',
    'input/index': 'src/input/index.ts',
    'select/index': 'src/select/index.ts',
    'badge/index': 'src/badge/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  onSuccess: addUseClientDirective,
});
