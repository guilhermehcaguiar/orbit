# Roadmap de Implementação

## Fase 0 — Fundação

- Implementado: monorepo, configurações compartilhadas, design system, landing, telas visuais de acesso, shell, dashboard demonstrativo, healthcheck e persistência de perfis.
- Preparação de hospedagem: compatibilidade com `PORT` do Render, pool da API e [runbook](DEPLOYMENT.md) para Vercel Hobby, Render Free e Neon PostgreSQL Free.
- Pendente: provisionar ambiente de demonstração, aplicar a migration autorizada em banco isolado e executar os smokes externos.
- Pendente: configurar CI com lint, typecheck, testes e build.
- Antes de dados reais: integrar identidade e sessão, proteger rotas, testar ownership e RLS, revisar rate limiting atrás do proxy, minimizar dados em logs e definir recuperação do banco.

## MVP local

O workspace em `/app` permite organizar disciplinas, tarefas, provas e eventos,
acompanhar uma agenda mensal, usar o Pomodoro e consultar estatísticas e um
plano por prazos. Preferências e registros são salvos no navegador. Valide o
fluxo com o MVP local antes de integrar identidade, banco e hospedagem.

## Fase 1 — Evolução do core acadêmico
- onboarding;
- semestres;
- disciplinas;
- horários;
- tarefas;
- provas;
- calendário;
- dashboard real.

## Fase 2 — Foco
- Pomodoro;
- histórico;
- estatísticas básicas;
- preferências.

## Fase 3 — IA
- planner híbrido;
- geração de plano;
- aceite/edição;
- tracking de ai_runs;
- fallback determinístico.

## Fase 4 — Materiais/RAG
- upload;
- processamento;
- busca vetorial (pgvector);
- resumo;
- tutor contextual.

## Fase 5 — Produto
- PWA;
- notificações;
- calendários externos;
- refinamento de analytics;
- experimentos de retenção.
