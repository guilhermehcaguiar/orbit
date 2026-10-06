import type { Tone } from '@orbit/design-system';

export interface SubjectMock { id: string; name: string; status: string; progress: number; tone: Tone; abbreviation: string }
export const subjects: SubjectMock[] = [
  { id: 'calculus', name: 'Cálculo I', status: '3 tarefas pendentes', progress: 66, tone: 'primary', abbreviation: 'Ca' },
  { id: 'programming', name: 'Programação', status: '1 tarefa pendente', progress: 25, tone: 'accent', abbreviation: 'Pr' },
  { id: 'physics', name: 'Física', status: 'Tudo em dia', progress: 100, tone: 'success', abbreviation: 'Fí' },
  { id: 'writing', name: 'Redação', status: '2 tarefas pendentes', progress: 40, tone: 'warning', abbreviation: 'Re' },
];
