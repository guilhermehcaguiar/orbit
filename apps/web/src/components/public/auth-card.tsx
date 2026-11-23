'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Orbit } from 'lucide-react';
import { Button, Card, Input } from '@orbit/design-system';
import { Brand } from '@/components/brand';
import { orbitApi } from '@/features/workspace/api';

export function AuthCard({ mode }: { mode: 'login' | 'cadastro' }) {
  const signup = mode === 'cadastro';
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (signup && data.get('password') !== data.get('confirmation')) {
      setError('As senhas precisam ser iguais.');
      form.querySelector<HTMLInputElement>('[name="confirmation"]')?.focus();
      return;
    }
    setError('');
    setBusy(true);
    try {
      await orbitApi(signup ? 'auth/register' : 'auth/login', {
        method: 'POST',
        body: { name: data.get('name'), email: data.get('email'), password: data.get('password') },
      });
      window.location.assign(signup ? '/onboarding' : '/app');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.');
      setBusy(false);
    }
  }

  return <div className="auth-page">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="public-container auth-header"><Brand /><Link className="text-link" href="/"><ArrowLeft size={16} aria-hidden="true" />Voltar ao início</Link></header>
    <main id="main-content" className="auth-layout public-container" tabIndex={-1}>
      <div className="auth-intro"><div className="auth-orbit" aria-hidden="true"><Orbit size={108} strokeWidth={0.8} /></div><p className="auth-intro-title">Seu espaço de estudos</p><p>Disciplinas, tarefas, provas e foco em um só lugar.</p></div>
      <Card className="auth-card">
        <h1>{signup ? 'Criar conta' : 'Entrar no Orbit'}</h1>
        <Link className="text-link" href="/app">Abrir o workspace <ArrowRight size={16} aria-hidden="true" /></Link>
        <form onSubmit={submit} onChange={() => setError('')}>
          {signup && <Input id="signup-name" label="Nome" name="name" autoComplete="name" required minLength={2} maxLength={60} />}
          <Input id={`${mode}-email`} label="E-mail" name="email" type="email" autoComplete="email" required maxLength={254} />
          <Input id={`${mode}-password`} label="Senha" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 8 : undefined} maxLength={128} />
          {signup && <Input id="signup-confirmation" label="Confirmar senha" name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={128} />}
          {error && <p className="auth-message" role="alert">{error}</p>}
          <Button type="submit" disabled={busy} icon={<ArrowRight size={17} aria-hidden="true" />}>{busy ? 'Aguarde…' : signup ? 'Criar conta' : 'Entrar'}</Button>
        </form>
        <p className="auth-switch">{signup ? 'Já tenho uma conta. ' : 'Novo por aqui? '}<Link href={signup ? '/login' : '/cadastro'}>{signup ? 'Entrar' : 'Criar conta'}</Link></p>
      </Card>
    </main>
    <footer className="auth-footer">Orbit · Seu foco em órbita</footer>
  </div>;
}
