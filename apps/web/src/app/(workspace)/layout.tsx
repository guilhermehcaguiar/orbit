import type { ReactNode } from 'react';
import { ThemeProvider } from '@orbit/design-system';
import { FocusClock } from '@/features/workspace/focus';
import { AppShell } from '@/layouts/app-shell';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <ThemeProvider><FocusClock /><AppShell>{children}</AppShell></ThemeProvider>;
}
