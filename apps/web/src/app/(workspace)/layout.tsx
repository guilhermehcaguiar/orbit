import type { ReactNode } from 'react';
import { ThemeProvider } from '@orbit/design-system';
import { AppShell } from '@/layouts/app-shell';
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <ThemeProvider><AppShell>{children}</AppShell></ThemeProvider>;
}
