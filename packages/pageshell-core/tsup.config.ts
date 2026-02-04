import { defineConfig } from 'tsup';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Files that need "use client" directive (contain React hooks or client-side logic)
// Note: index.js and hooks/index.js need this because they bundle React hooks
// utils, formatters, types are server-safe and don't get the directive
const CLIENT_ONLY_FILES = [
  'index.js',
  'hooks/index.js',
  'hooks/form/useNavigationGuard.js',
  'toast/index.js', // Uses sonner which is client-side
];

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
        const relativePath = fullPath.replace(distDir + '/', '');

        // Only add "use client" to files that need it
        if (CLIENT_ONLY_FILES.includes(relativePath)) {
          const content = await readFile(fullPath, 'utf-8');
          if (!content.startsWith('"use client"')) {
            await writeFile(fullPath, `"use client";\n${content}`);
          }
        }
      }
    }
  }

  await processDir(distDir);
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'hooks/form/useNavigationGuard': 'src/hooks/form/useNavigationGuard.ts',
    'utils/index': 'src/utils/index.ts',
    'formatters/index': 'src/formatters/index.ts',
    'types/index': 'src/types/index.ts',
    'toast/index': 'src/toast/index.ts',
    'test-utils/index': 'src/test-utils/index.ts',
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
  external: ['react', 'react-dom', 'react-router-dom', 'sonner', 'date-fns', 'date-fns/locale'],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  onSuccess: addUseClientDirective,
});
