# Testes do Orbit

## Gates de CI

O [workflow](../.github/workflows/ci.yml) roda lint, typecheck, build,
testes unitários, verificação de migrations, integração com PostgreSQL e
testes Playwright em pull requests e na branch principal.

```bash
npm run lint
npm run typecheck
npm run build:deploy
npm run test
npm run db:check --workspace @orbit/api
```

A API usa o runner nativo do Node e injeção HTTP do Fastify. Os contratos
compartilhados têm testes de disponibilidade, prazos, conflitos e importação.

## PostgreSQL e navegador

Os testes com conta exigem um banco isolado, preparado com as migrations e
com [os privilégios de runtime](DEPLOYMENT.md#neon-postgresql-free). Depois de
compilar a API e a web, aponte `ORBIT_TEST_DATABASE_URL` para esse papel.

```bash
npm run test:integration --workspace @orbit/api
npm exec --workspace @orbit/web -- playwright install chromium
npm run test:e2e --workspace @orbit/web
```

O teste de integração valida sessão, revisões e isolamento entre duas contas
pela API e diretamente pelo PostgreSQL. O Playwright usa o launcher do Render para
verificar o health público, a rotina do visitante, o planejador e a sincronização
com duas contas.
Sem `ORBIT_TEST_DATABASE_URL`, o Playwright roda os fluxos de visitante.

O [runbook](DEPLOYMENT.md#verificação-e-recuperação) documenta os smokes externos.
