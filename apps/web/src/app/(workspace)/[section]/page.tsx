import { notFound } from 'next/navigation';
import { Organizer, Subjects } from '@/features/workspace/organizer';
import { Pomodoro, Settings } from '@/features/workspace/focus';
import { Statistics, StudyPlan } from '@/features/workspace/summary';
import { navigation } from '@/features/workspace/navigation';

export const dynamicParams = false;
export function generateStaticParams() {
  return navigation.filter(item => item.href !== '/app').map(item => ({ section: item.href.slice(1) }));
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  switch (section) {
    case 'subjects': return <Subjects />;
    case 'tasks': return <Organizer key="task" kind="task" />;
    case 'exams': return <Organizer key="exam" kind="exam" />;
    case 'calendar': return <Organizer key="event" kind="event" />;
    case 'pomodoro': return <Pomodoro />;
    case 'ai': return <StudyPlan />;
    case 'statistics': return <Statistics />;
    case 'settings': return <Settings />;
    default: notFound();
  }
}
