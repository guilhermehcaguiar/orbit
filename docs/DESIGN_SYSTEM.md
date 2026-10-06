# Design System — Orbit

## Conceito

Dark-mode-first, futurista, premium e focado em produtividade. Neon/glow é acento, não decoração constante.

## Marca
- Nome: Orbit
- Tagline: **Seu foco em órbita.**
- Títulos: Sora
- Interface/textos: Inter

## Cores

```css
--orbit-primary: #7C3AED;
--orbit-secondary: #8B5CF6;
--orbit-accent: #22D3EE;
--orbit-success: #22C55E;
--orbit-warning: #F59E0B;
--orbit-danger: #EF4444;
--orbit-bg: #09090B;
--orbit-surface: #18181B;
--orbit-border: #27272A;
--orbit-text: #FAFAFA;
--orbit-muted: #A1A1AA;
```

## Regras visuais

- radius padrão: 12px; cards grandes 16px.
- bordas discretas `#27272A`.
- sombras suaves.
- roxo para ações primárias e identidade.
- ciano para informação/progresso secundário.
- verde apenas para sucesso.
- âmbar para atenção.
- vermelho para erro/urgência.
- IA pode usar gradiente roxo, mas não em todo card.
- contraste WCAG AA como mínimo.
- foco de teclado sempre visível.

## Layout desktop

Sidebar fixa ~240px, conteúdo fluido com largura máxima confortável. Dashboard em grid adaptativo.

## Mobile

Bottom navigation com 4 destinos principais + Mais. Pomodoro deve ser fácil de iniciar com uma mão.

## Componentes iniciais

- Button
- IconButton
- Input
- Textarea
- Select
- Date/Time picker
- Dialog/Sheet
- Card
- StatCard
- SubjectChip
- TaskRow
- AssessmentCard
- PomodoroTimer
- EmptyState
- Skeleton
- Toast
- Command/Search
- Calendar
- Progress
- Tabs

## Referência

Abrir `design/orbit-brand-board.png` antes de implementar UI.
