import { ChevronRight, CircleCheck } from 'lucide-react';
import Link from 'next/link';
import { Card, ProgressBar } from '@orbit/design-system';
import type { SubjectMock } from '@/mocks/subjects';

export function SubjectCard({ subject }: { subject: SubjectMock }) {
  return <Card className={`subject-card orbit-tone--${subject.tone}`}><div className="subject-card-top"><span className="subject-mark" aria-hidden="true">{subject.abbreviation}</span><ChevronRight size={16} aria-hidden="true" /></div><h3><Link href="/subjects">{subject.name}<span className="orbit-sr-only"> — disciplina</span></Link></h3><p className={subject.progress === 100 ? 'subject-status is-complete' : 'subject-status'}>{subject.progress === 100 && <CircleCheck size={13} aria-hidden="true" />}{subject.status}</p><ProgressBar value={subject.progress} label={`Progresso em ${subject.name}`} tone={subject.tone} /></Card>;
}
