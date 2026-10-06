import { BookOpen, CalendarDays, ChartNoAxesCombined, ClipboardList, House, Settings2, Sparkles, SquareCheckBig, Timer, type LucideIcon } from 'lucide-react';

export const navigationIcons = { home: House, calendar: CalendarDays, subjects: BookOpen, tasks: SquareCheckBig, exams: ClipboardList, pomodoro: Timer, ai: Sparkles, statistics: ChartNoAxesCombined, settings: Settings2 } satisfies Record<string, LucideIcon>;
export type NavigationIcon = keyof typeof navigationIcons;
