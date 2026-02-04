import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/wizard/index.ts',
    'src/skeletons/index.ts',
    'src/context/index.ts',
    'src/adapters/next.tsx',
  ],
  format: ['esm'],
  dts: {
    compilerOptions: {
      typeRoots: ['./node_modules/@types'],
      paths: {
        'react': ['./node_modules/@types/react'],
      },
    },
  },
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'next',
    'next/link',
    'next/image',
    'next/navigation',
    'lucide-react',
  ],
  treeshake: true,
  splitting: false,
  async onSuccess() {
    // Prepend "use client" to all JS files in dist
    const distDir = './dist';
    const prependUseClient = (dir: string) => {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = join(dir, file.name);
        if (file.isDirectory()) {
          prependUseClient(filePath);
        } else if (file.name.endsWith('.js')) {
          const content = readFileSync(filePath, 'utf-8');
          if (!content.startsWith('"use client"')) {
            writeFileSync(filePath, `"use client";\n${content}`);
          }
        }
      }
    };
    prependUseClient(distDir);
  },
});
