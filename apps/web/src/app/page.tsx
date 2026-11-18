import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, BookOpen, CalendarDays, Check, ClipboardList, ListTodo, Timer, TrendingUp } from 'lucide-react';
import { Footer } from '@/components/public/footer';
import { Navbar } from '@/components/public/navbar';
import { ProductPreview } from '@/components/public/product-preview';

export const metadata: Metadata = {
  title: 'Orbit — Organizador de estudos',
  description: 'Organize disciplinas, tarefas e provas, consulte sua agenda e acompanhe as sessões de foco.',
};

const tools = [
  { icon: BookOpen, title: 'Disciplinas', description: 'Organize as matérias e vincule suas tarefas e provas.', route: '/subjects' },
  { icon: CalendarDays, title: 'Calendário', description: 'Consulte compromissos e prazos na agenda mensal.', route: '/calendar' },
  { icon: ListTodo, title: 'Tarefas', description: 'Cadastre prazos e acompanhe o que falta concluir.', route: '/tasks' },
  { icon: ClipboardList, title: 'Provas', description: 'Registre as datas das próximas avaliações.', route: '/exams' },
  { icon: Timer, title: 'Pomodoro', description: 'Alterne sessões de foco e pausas configuráveis.', route: '/pomodoro' },
  { icon: TrendingUp, title: 'Estatísticas', description: 'Acompanhe o tempo de foco e as tarefas concluídas.', route: '/statistics' },
];

export default function Home() {
  return <div className="public-site">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <Navbar />
    <main id="main-content" tabIndex={-1}>
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="public-container landing-hero-inner">
          <div className="landing-intro">
            <h1 id="hero-title">Organizador <span>de estudos.</span></h1>
            <p>Junte disciplinas, tarefas e provas. Veja os próximos prazos e inicie uma sessão de foco.</p>
            <div className="landing-actions">
              <Link href="/app" className="orbit-button orbit-button--primary">Abrir meu espaço <ArrowUpRight size={18} aria-hidden="true" /></Link>
              <a href="#recursos" className="orbit-button orbit-button--secondary">Ver ferramentas <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <p className="landing-local"><Check size={16} aria-hidden="true" /> Sem cadastro. Seus registros ficam no navegador.</p>
          </div>
          <ProductPreview />
        </div>
      </section>
      <section id="recursos" className="public-container landing-tools" aria-labelledby="features-title">
        <div className="landing-tools-head"><h2 id="features-title">Ferramentas de estudo</h2><p>Organize o semestre, acompanhe os prazos e veja quanto tempo você estudou.</p></div>
        <ul>{tools.map(({ icon: Icon, title, description, route }) => <li key={route}>
          <Link href={route} className="landing-tool"><Icon size={22} aria-hidden="true" />
            <span><strong>{title}</strong><span>{description}</span></span>
            <ArrowUpRight className="landing-tool-arrow" size={16} aria-hidden="true" />
          </Link>
        </li>)}</ul>
      </section>
      <section className="public-container landing-close" aria-labelledby="close-title">
        <div><h2 id="close-title">Sua primeira disciplina</h2><p>Cadastre uma matéria e organize os próximos prazos a partir dela.</p></div>
        <Link href="/subjects#novo" className="orbit-button orbit-button--primary">Adicionar disciplina <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </section>
    </main>
    <Footer />
  </div>;
}
