import Link from 'next/link';
import { Brand } from '@/components/brand';
export function Footer() {
  return <footer className="public-footer public-container"><div><Brand /><p>Seu foco em órbita.</p></div><nav aria-label="Links do rodapé"><div><strong>Produto</strong><Link href="/#recursos">Recursos</Link><Link href="/#como-funciona">Como funciona</Link></div><div><strong>Legal</strong><span>Privacidade <small>Em breve</small></span><span>Termos <small>Em breve</small></span></div></nav><div className="footer-bottom"><span>© {new Date().getFullYear()} Orbit. Todos os direitos reservados.</span><span>Mais espaço para o que importa.</span></div></footer>;
}
