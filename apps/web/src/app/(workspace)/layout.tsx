import type { ReactNode } from 'react';
import { ThemeProvider } from '@orbit/design-system';
import { WorkspaceConnection } from '@/features/workspace/connection';
import { FocusClock } from '@/features/workspace/focus';
import { AppShell } from '@/layouts/app-shell';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <ThemeProvider><WorkspaceConnection><FocusClock /><AppShell>{children}</AppShell></WorkspaceConnection></ThemeProvider>;
}
