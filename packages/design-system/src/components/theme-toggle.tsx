'use client';

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);
const storageKey = 'orbit.theme';
const changeEvent = 'orbit:theme-change';
let memoryTheme: Theme = 'dark';
let storageFailed = false;

function currentTheme(): Theme {
  if (storageFailed) return memoryTheme;
  try {
    return window.localStorage.getItem(storageKey) === 'light' ? 'light' : 'dark';
  } catch {
    return memoryTheme;
  }
}

function subscribe(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) listener();
  }
  window.addEventListener(changeEvent, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener('storage', onStorage);
  };
}

function toggleTheme() {
  memoryTheme = currentTheme() === 'dark' ? 'light' : 'dark';
  try {
    window.localStorage.setItem(storageKey, memoryTheme);
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, currentTheme, () => 'dark');
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = theme;
    return () => {
      if (previous === undefined) delete root.dataset.theme;
      else root.dataset.theme = previous;
    };
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeToggle requires ThemeProvider');
  const label = context.theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro';
  return <Tooltip content={label}><IconButton label={label} onClick={context.toggle} aria-pressed={context.theme === 'light'}>{context.theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</IconButton></Tooltip>;
}
