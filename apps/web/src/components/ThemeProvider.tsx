import { PageShellProvider } from '@parisgroup-ai/pageshell/theme';
import type { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <PageShellProvider theme="odonto-ai">
      {children}
    </PageShellProvider>
  );
}
