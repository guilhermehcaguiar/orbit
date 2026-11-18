import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from '@/components/brand';

export function Navbar() {
  return <header className="public-header">
    <div className="public-container navbar">
      <Brand />
      <nav className="public-navigation" aria-label="Navegação principal">
        <a className="public-nav-link" href="#recursos">Ferramentas</a>
        <Link className="orbit-button orbit-button--secondary" href="/app">Abrir meu espaço <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </nav>
    </div>
  </header>;
}
