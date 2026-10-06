import type { ReactNode } from 'react';
import { AppNavigation } from '@/components/app-navigation';
import { AppHeader } from '@/components/app-header';

export function AppShell({ children }: { children: ReactNode }) {
  return <><a className="skip-link" href="#main-content">Pular para o conteúdo</a><AppNavigation /><div className="app-shell"><AppHeader /><main id="main-content" className="app-content" tabIndex={-1}>{children}</main><footer className="app-footer"><span>Seu futuro começa com o foco de hoje.</span><span>Orbit • Seu foco em órbita.</span></footer></div></>;
}
