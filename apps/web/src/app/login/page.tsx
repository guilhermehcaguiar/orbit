import type { Metadata } from 'next';
import { AuthCard } from '@/components/public/auth-card';
export const metadata: Metadata = { title: 'Entrar | Orbit', description: 'Tela de acesso ao Orbit. Prévia visual; autenticação disponível em uma etapa futura.' };
export default function LoginPage() { return <AuthCard mode="login" />; }
