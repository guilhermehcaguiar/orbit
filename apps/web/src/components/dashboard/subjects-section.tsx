import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SectionTitle } from '@orbit/design-system';
import { subjects } from '@/mocks/subjects';
import { SubjectCard } from './subject-card';

export function SubjectsSection({ showAllLink = true }: { showAllLink?: boolean }) {
  return <section className="subjects-section" aria-labelledby="subjects-title"><SectionTitle id="subjects-title" title="Minhas disciplinas" description="Cada matéria, um passo mais perto dos seus objetivos." action={showAllLink ? <Link className="text-link" href="/subjects">Ver todas <ArrowUpRight size={16} aria-hidden="true" /></Link> : undefined} /><div className="subjects-grid">{subjects.map(subject => <SubjectCard key={subject.id} subject={subject} />)}</div></section>;
}
