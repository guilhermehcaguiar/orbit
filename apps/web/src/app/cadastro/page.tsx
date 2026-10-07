import type { Metadata } from 'next';
import { AuthCard } from '@/components/public/auth-card';
export const metadata: Metadata = { title: 'Criar conta | Orbit', description: 'Prepare-se para sua jornada no Orbit. Prévia visual de cadastro, ainda sem autenticação.' };
export default function SignupPage() { return <AuthCard mode="cadastro" />; }
