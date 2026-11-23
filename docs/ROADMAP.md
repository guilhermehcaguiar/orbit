# Roadmap de implementação

## Implementado

- CI de lint, typecheck, testes, build e migrations. Testes de navegador com
  Playwright e de isolamento com PostgreSQL e papel de runtime restrito.
- Modo visitante e workspace autenticado, com cadastro, login, sessão,
  importação explícita e sincronização com revisão para detectar conflitos.
- Onboarding, semestres, disciplinas, horários recorrentes, tarefas,
  provas, eventos, calendário e próxima aula no dashboard.
- Pomodoro, histórico, preferências e estatísticas de foco por disciplina.
- Plano semanal determinístico que usa prazos, disponibilidade, esforço,
  preparo e compromissos. Edição e aceite com verificação de conflitos.

## Ambiente de demonstração e piloto

O Blueprint reúne Next.js e NestJS no Render Free e usa o Neon Free para
PostgreSQL. Provisionamento e smokes externos seguem o [runbook](DEPLOYMENT.md).
Antes do piloto, valide recuperação do banco e rate limiting no proxy real,
e defina verificação de e-mail, recuperação de acesso e ciclo de vida da conta.

## IA

Enriquecer o plano existente com sugestões e explicações, adapter de IA,
tracking em `ai_runs` e o planejador determinístico como fallback.

## Materiais e produto

Upload e processamento de materiais, busca vetorial, resumo e tutor
contextual. Em ciclos seguintes, PWA, notificações, calendários externos e
evolução de analytics.
