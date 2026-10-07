import type { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard/dashboard';
export const metadata: Metadata = { title: 'Dashboard | Orbit', description: 'Prévia visual do seu espaço de estudos.' };
export default function AppPage() { return <Dashboard />; }
