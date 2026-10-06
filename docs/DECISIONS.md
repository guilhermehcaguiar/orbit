# ADRs iniciais

## ADR-001 — Modular monolith
**Decisão:** usar modular monolith em vez de microservices.
**Motivo:** menor custo operacional, transações simples e evolução rápida, mantendo fronteiras para extração futura.

## ADR-002 — API dedicada
**Decisão:** Next.js não será o único backend. Regras centrais ficam em NestJS.
**Motivo:** separação clara, futuros clientes mobile, jobs e IA sem acoplar domínio ao framework web.

## ADR-003 — Supabase
**Decisão:** usar Supabase para Postgres, Auth e Storage.
**Motivo:** acelera MVP mantendo PostgreSQL padrão e recursos fortes de autorização/RLS.

## ADR-004 — IA como adapter
**Decisão:** provider de IA atrás de interface.
**Motivo:** evitar lock-in, facilitar testes e permitir modelos diferentes por recurso.

## ADR-005 — Hybrid planner
**Decisão:** regras duras em código; IA ajuda em priorização e explicação.
**Motivo:** confiabilidade e previsibilidade.
