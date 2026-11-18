import Link from 'next/link';
import { Brand } from '@/components/brand';

export function Footer() {
  return <footer className="public-footer public-container">
    <Brand />
    <nav aria-label="Links do rodapé"><Link href="/#recursos">Ferramentas</Link><Link href="/app">Workspace</Link></nav>
    <p>© {new Date().getFullYear()} Orbit</p>
  </footer>;
}
