import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { inter, sora } from '@/styles/fonts';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Orbit',
  description: 'Seu foco em órbita.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" data-scroll-behavior="smooth" className={`${inter.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
