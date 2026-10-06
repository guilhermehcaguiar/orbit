'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';

const ThemeContext = createContext<{ theme: 'dark' | 'light'; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggle: () => setTheme(current => current === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeToggle requires ThemeProvider');
  const label = context.theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro';
  return <Tooltip content={label}><IconButton label={label} onClick={context.toggle} aria-pressed={context.theme === 'light'}>{context.theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</IconButton></Tooltip>;
}
