'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Orbit, Target } from 'lucide-react';
import { Badge, Button, Card, Input } from '@orbit/design-system';
import { Brand } from '@/components/brand';

export function AuthCard({ mode }: { mode: 'login' | 'cadastro' }) {
  const signup = mode === 'cadastro';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage('');
    if (signup && String(data.get('name') ?? '').trim().length < 2) {
      setError('Informe seu nome com pelo menos 2 caracteres.');
      form.querySelector<HTMLInputElement>('[name="name"]')?.focus();
      return;
    }
    if (signup && data.get('password') !== data.get('confirmation')) {
      setError('As senhas precisam ser iguais.');
      form.querySelector<HTMLInputElement>('[name="confirmation"]')?.focus();
      return;
    }
    setError('');
    form.reset();
    setMessage('A integração de autenticação será ativada em uma etapa posterior. Nenhuma conta foi criada ou acessada e seus dados não foram enviados.');
  }
  return <div className="auth-page"><a className="skip-link" href="#main-content">Pular para o conteúdo</a><header className="public-container auth-header"><Brand /><Link className="text-link" href="/"><ArrowLeft size={16} aria-hidden="true" />Voltar ao início</Link></header><main id="main-content" className="auth-layout public-container" tabIndex={-1}><section className="auth-intro" aria-labelledby="auth-intro-title"><div className="auth-orbit" aria-hidden="true"><Orbit size={108} strokeWidth={0.7} /></div><span className="section-eyebrow">SEU FOCO EM ÓRBITA</span><h2 id="auth-intro-title">Grandes objetivos.<br /><span>Um passo de cada vez.</span></h2><p>Um espaço para organizar sua rotina, encontrar seu ritmo e seguir em frente.</p><div className="auth-note"><Target size={22} aria-hidden="true" /><span>Mais clareza para planejar.<br />Mais espaço para aprender.</span></div></section><Card className="auth-card"><Badge tone="primary">Prévia visual · Sem autenticação</Badge><h1>{signup ? 'Comece sua jornada.' : 'Bom ter você por aqui.'}</h1><p>{signup ? 'Seu novo espaço de estudos está tomando forma.' : 'Acesse seu espaço de foco quando a integração estiver disponível.'}</p><form onSubmit={submit} aria-describedby="auth-preview-note" onChange={() => { setError(''); setMessage(''); }}>
    {signup && <Input id="signup-name" label="Nome" name="name" autoComplete="name" placeholder="Como podemos chamar você?" required minLength={2} maxLength={100} />}
    <Input id={`${mode}-email`} label="E-mail" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required maxLength={254} />
    <Input id={`${mode}-password`} label="Senha" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'Pelo menos 8 caracteres' : 'Digite sua senha'} required minLength={signup ? 8 : undefined} maxLength={128} />
    {signup && <Input id="signup-confirmation" label="Confirmar senha" name="confirmation" type="password" autoComplete="new-password" placeholder="Repita sua senha" required minLength={8} maxLength={128} error={error.includes('senhas') ? error : undefined} />}
    {!signup && <button className="auth-forgot" type="button" onClick={() => setMessage('A recuperação de senha será disponibilizada junto com a autenticação em uma etapa posterior.')}>Esqueci minha senha</button>}
    {error && !error.includes('senhas') && <p className="orbit-field-error" role="alert">{error}</p>}
    <Button type="submit" icon={<ArrowRight size={17} aria-hidden="true" />}>{signup ? 'Criar conta' : 'Entrar'}</Button>
    <p id="auth-preview-note" className="auth-preview-note">Esta é uma prévia. Nenhum dado é enviado ou salvo pelo Orbit.</p>
  </form><div className="auth-message" role="status" aria-live="polite">{message}</div><p className="auth-switch">{signup ? 'Já tenho uma conta. ' : 'Novo por aqui? '}<Link href={signup ? '/login' : '/cadastro'}>{signup ? 'Entrar' : 'Criar conta'}</Link></p></Card></main><footer className="auth-footer">Orbit · Seu foco em órbita.</footer></div>;
}
