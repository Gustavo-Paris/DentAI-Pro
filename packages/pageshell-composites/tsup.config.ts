import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Recursively find all .js files in a directory
 */
function findJsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (entry.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'list/index': 'src/list/index.ts',
    'tabbed-list/index': 'src/tabbed-list/index.ts',
    'form/index': 'src/form/index.ts',
    'detail/index': 'src/detail/index.ts',
    'dashboard/index': 'src/dashboard/index.ts',
    'settings/index': 'src/settings/index.ts',
    'card-settings/index': 'src/card-settings/index.ts',
    'config/index': 'src/config/index.ts',
    'preferences/index': 'src/preferences/index.ts',
    'analytics/index': 'src/analytics/index.ts',
    'calendar/index': 'src/calendar/index.ts',
    'linear-flow/index': 'src/linear-flow/index.ts',
    'wizard/index': 'src/wizard/index.ts',
    'split-panel/index': 'src/split-panel/index.ts',
    'progressive-extraction/index': 'src/progressive-extraction/index.ts',
    'sectioned-form/index': 'src/sectioned-form/index.ts',
    'help-center/index': 'src/help-center/index.ts',
    'shared/index': 'src/shared/index.ts',
  },
  format: ['esm'],
  // DTS disabled - internal monorepo package uses source types via workspace:*
  // Re-enable when tsup fixes worker memory issues or package is published
  dts: false,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next', 'next/navigation', '@pageshell/core', '@pageshell/primitives', '@pageshell/interactions', '@pageshell/layouts', '@pageshell/theme'],
  treeshake: true,
  // Add 'use client' banner to all output files after build
  async onSuccess() {
    const distDir = join(process.cwd(), 'dist');
    const files = findJsFiles(distDir);

    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');

      // Only add if not already present
      if (!content.startsWith('"use client"')) {
        writeFileSync(filePath, `"use client";\n${content}`);
      }
    }

    console.log(`Added "use client" directive to ${files.length} files`);
  },
});
