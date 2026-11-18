import type { Metadata } from 'next';
import { Dashboard } from '@/features/workspace/summary';

export const metadata: Metadata = { title: 'Dashboard | Orbit', description: 'Seu espaço de estudos.' };

export default function AppPage() {
  return <Dashboard />;
}
