'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Brand } from '@/components/brand';

const links = [['Recursos', '#recursos'], ['Como funciona', '#como-funciona'], ['Produtividade', '#produtividade'], ['IA', '#ia']];
export function Navbar() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return <header className="public-header"><div className="public-container navbar"><Brand /><button ref={toggle} type="button" className="menu-toggle orbit-icon-button" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? <X /> : <Menu />}</span></button><nav id="public-navigation" aria-label="Navegação principal" className={`public-navigation ${open ? 'is-open' : ''}`} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } }}><div className="public-nav-links">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}</div><div className="public-actions"><Link className="orbit-button orbit-button--secondary orbit-button--sm" href="/login">Entrar</Link><Link className="orbit-button orbit-button--primary orbit-button--sm" href="/cadastro">Criar conta</Link></div></nav></div></header>;
}
