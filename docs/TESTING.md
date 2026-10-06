# Estratégia de Testes

## Pirâmide

### Unitários
- scoring de prioridade;
- cálculo de disponibilidade;
- regras de conflito;
- casos de uso de domínio;
- validadores.

### Integração
- repositories + Postgres;
- autenticação/authorization;
- geração/aceite de study plan com provider fake;
- storage adapters.

### E2E
Playwright cobrindo fluxos críticos:
1. cadastro/login;
2. onboarding;
3. criar disciplina;
4. criar prova e tarefa;
5. iniciar/finalizar Pomodoro;
6. visualizar dashboard atualizado;
7. gerar e aceitar plano inteligente.

## Gates no CI

- format check;
- lint;
- typecheck;
- unit/integration;
- build web;
- build api;
- E2E em PRs principais.

## Meta inicial

Cobertura deve proteger regras críticas, não perseguir 100% artificial. Exigir cobertura elevada no domínio e menor em componentes puramente visuais.
