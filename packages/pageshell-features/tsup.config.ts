import { defineConfig } from 'tsup';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

async function addUseClientDirective() {
  const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
  const distDir = join(__dirname, 'dist');

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
  },
  format: ['esm'],
  dts: {
    compilerOptions: {
      typeRoots: ['./node_modules/@types'],
      paths: {
        'react': ['./node_modules/@types/react'],
      },
    },
  },
  clean: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@pageshell/core',
    '@pageshell/primitives',
    '@pageshell/theme',
    '@pageshell/interactions',
    '@pageshell/layouts',
  ],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  onSuccess: addUseClientDirective,
});
