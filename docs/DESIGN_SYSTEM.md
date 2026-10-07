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

## Componentes implementados na segunda etapa

Disponíveis em `@orbit/design-system`: Button, Card, Input, Badge, IconButton,
Sidebar, SidebarItem, PageHeader, StatCard, ProgressBar, EmptyState, SectionTitle,
Avatar, SearchInput, ThemeToggle e Tooltip. ThemeProvider controla o tema apenas
em memória, com dark mode padrão. As props tipadas são exportadas pelo pacote.

A implementação usa tokens CSS em `packages/design-system/src/styles/tokens.css`.
Importe `@orbit/design-system/styles.css` uma vez no CSS global do aplicativo.
Os tokens de fontes recebem as variáveis de `next/font/local` configuradas em
`apps/web/src/styles/fonts.ts`. Fontes locais incluem licenças OFL.

O modo claro é uma preparação estrutural, com cores semânticas ajustadas para
contraste. A identidade visual principal permanece escura.

## Componentes planejados para etapas futuras

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

## Composição pública

Landing e acesso usam os mesmos tokens, fontes locais, Card, Badge, Button e Input.
Não foram alterados contratos ou tokens do pacote compartilhado. Navbar, Footer,
FeatureCard, ProductPreview e AuthCard ficam no frontend; `styles/public.css`
organiza a composição e os breakpoints. O mockup reutiliza SubjectCard e dados
existentes, sem duplicar lógica interativa do dashboard.

Conteúdo público com largura máxima de 1160 px, hero centralizada, benefícios em
4/2/1 colunas e recursos em 3/2/1 colunas. A navegação muda para menu expansível
abaixo de 800 px, com Escape e retorno de foco. Login/cadastro usam card em duas
colunas no desktop e uma coluna no tablet/mobile. Brilho discreto só na prévia;
IA futura sempre acompanhada por indicação de disponibilidade.
