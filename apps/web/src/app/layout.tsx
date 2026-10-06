import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@orbit/design-system';
import { AppShell } from '@/layouts/app-shell';
import { inter, sora } from '@/styles/fonts';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Orbit',
  description: 'Seu foco em órbita.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" data-scroll-behavior="smooth" className={`${inter.variable} ${sora.variable}`}>
      <body><ThemeProvider><AppShell>{children}</AppShell></ThemeProvider></body>
    </html>
  );
}
