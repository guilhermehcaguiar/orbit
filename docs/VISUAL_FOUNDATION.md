# Fundação visual do Orbit

Segunda etapa: shell responsivo, dashboard visual e design system. Não foram
implementados serviços de negócio, autenticação, persistência ou chamadas HTTP
ao backend. A API de saúde permanece sem alterações.

## Estrutura

```text
packages/design-system/
  package.json, tsconfig.json, eslint.config.mjs
  src/
    index.ts, types.ts, utils.ts
    components/             16 componentes e ThemeProvider
    styles/                 tokens, primitives, layout e index CSS
apps/web/src/
  app/                      layout, dashboard, icon.svg e [section]/page.tsx
  components/               marca, header, navegação, busca e diálogo
    dashboard/              composição, cards, disciplinas e banner
  layouts/                  AppShell
  constants/                mapa de ícones Lucide
  mocks/                    dashboard, subjects e navigation
  styles/                   shell, dashboard, fonts.ts e fontes com licenças
```

## Componentes compartilhados

| Componente | Contrato principal |
| --- | --- |
| Button | variant, size, icon, props nativas e disabled |
| Card | props nativas de div, className e children |
| Input | label obrigatório, hideLabel, error e props nativas |
| Badge | tone semântico e conteúdo |
| IconButton | label obrigatório, variant e props nativas |
| Sidebar | brand, footer e conteúdo de navegação |
| SidebarItem | icon, active, badge e props de link |
| PageHeader | title, description, eyebrow e action |
| StatCard | title, icon, tone, conteúdo e footer |
| ProgressBar | value limitado a 0–100, label, tone e showValue |
| EmptyState | icon, title, description e action |
| SectionTitle | title, description, action e id |
| Avatar | name, size e iniciais acessíveis |
| SearchInput | label e props nativas de busca |
| ThemeToggle | consome ThemeProvider, sem persistência |
| Tooltip | conteúdo descritivo, foco/hover e Escape para dispensar |

## Decisões

- Cores oficiais centralizadas nos tokens, incluindo spacing, tipografia,
  radius, sombras, controles, transições, foco e z-index.
- Sora e Inter variáveis via next/font/local; arquivos e licenças incluídos.
  Builds e navegação não precisam buscar fontes em serviços externos.
- Lucide é a única biblioteca de ícones. Arte orbital do banner feita em CSS;
  favicon SVG é um ativo estático da marca.
- Pacote UI sem dependência de Next.js: anchors genéricos no SidebarItem e
  Link do Next.js na composição do aplicativo. A regra de páginas do Next foi
  desativada apenas no pacote genérico; as demais regras permanecem ativas.
- Sidebar desktop de 240 px, navegação inferior abaixo de 900 px, menu Mais
  em dialog nativo. Cards empilham no mobile; grids adaptam em 600/1250 px.
- Busca, notificações, perfil, alternância de tema, plano e banner usam mocks
  e estado local. Pomodoro é uma prévia visual, sem relógio ou regras de sessão.
- Rotas de calendário, tarefas, provas, Pomodoro, IA, estatísticas e configurações
  apresentam EmptyState; disciplinas reutilizam os cards do dashboard.
- Dialog nativo mantém foco modal e fecha com Escape. Popovers nativos são
  dispensáveis por teclado. Labels, foco visível, skip link, aria-current e
  progressbar foram incluídos. Movimento reduzido respeita a preferência do SO.
- allowedDevOrigins admite somente o loopback adicional 127.0.0.1 para HMR.
  O indicador de desenvolvimento fica no topo para não cobrir a navegação mobile.
  agentRules foi desativado para evitar arquivos auxiliares gerados pelo Next.

## Inventário de arquivos criados

Em `packages/design-system/`:

- package.json, tsconfig.json, eslint.config.mjs
- src/index.ts, src/types.ts, src/utils.ts
- src/components/button.tsx, card.tsx, input.tsx, badge.tsx, icon-button.tsx
- src/components/sidebar.tsx, sidebar-item.tsx, page-header.tsx, stat-card.tsx
- src/components/progress-bar.tsx, empty-state.tsx, section-title.tsx, avatar.tsx
- src/components/search-input.tsx, theme-toggle.tsx, tooltip.tsx
- src/styles/index.css, tokens.css, primitives.css, layout.css

Em `apps/web/src/`:

- constants/icons.ts
- mocks/dashboard.ts, subjects.ts, navigation.ts
- components/brand.tsx, app-header.tsx, app-navigation.tsx, header-search.tsx,
  preview-dialog.tsx
- components/dashboard/dashboard.tsx, overview-cards.tsx, subject-card.tsx,
  subjects-section.tsx, ai-banner.tsx
- layouts/app-shell.tsx
- app/[section]/page.tsx, app/icon.svg
- styles/shell.css, dashboard.css, fonts.ts
- styles/fonts/inter.woff2, sora.woff2, INTER-LICENSE.txt, SORA-LICENSE.txt

Documentação criada: docs/VISUAL_FOUNDATION.md.

## Arquivos alterados

- apps/web/package.json e next.config.ts
- apps/web/src/app/layout.tsx, page.tsx e globals.css
- tsconfig.json e package-lock.json na raiz
- README.md e docs/DESIGN_SYSTEM.md

## Verificação

Resultado final: npm run lint, npm run typecheck e npm run build passaram com
código zero, sem warnings de configuração, incluindo o novo workspace.
O frontend iniciou tanto em desenvolvimento quanto em produção, com resposta
HTTP 200. A verificação de navegador foi repetida no build de produção.
A checagem de navegador usa Edge/Playwright, com axe para WCAG 2 A/AA e 2.1 AA.
Viewports: 1440×1000, 768×1024, 390×844 e 320×720. Verificadas navegação,
busca sem acentos, alternância de tema, notificações, prévias, teclado e Mais.
Sem overflow horizontal, erros de console, pageerror ou requisições externas.
A análise automatizada não encontrou violações nas telas avaliadas, inclusive
no modo claro. Essa análise não substitui uma auditoria completa com tecnologia
assistiva. Evidências temporárias ficam em .cache, ignorado pelo controle de versão.
Em arranques iniciais, o Next informou lentidão do filesystem local; nenhum
arquivo foi movido nem permissão de sistema alterada por causa desse aviso.

As cinco ocorrências altas de npm audit na cadeia ESLint já existiam na base e
continuam pendentes. Nenhuma correção forçada ou mudança de versões principais
foi aplicada nesta etapa.
