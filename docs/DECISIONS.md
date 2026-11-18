# ADRs iniciais

## ADR-001 — Modular monolith
**Decisão:** usar modular monolith em vez de microservices.
**Motivo:** menor custo operacional, transações simples e evolução rápida, mantendo fronteiras para extração futura.

## ADR-002 — API dedicada
**Decisão:** Next.js não será o único backend. Regras centrais ficam em NestJS.
**Motivo:** separação clara, futuros clientes mobile, jobs e IA sem acoplar domínio ao framework web.

## ADR-003 — Supabase (substituído)
**Decisão:** usar Supabase para Postgres, Auth e Storage.
**Motivo:** acelera MVP mantendo PostgreSQL padrão e recursos fortes de autorização/RLS.
**Substituído por:** ADR-006 — PostgreSQL convencional e hospedagem da demonstração.

## ADR-004 — IA como adapter
**Decisão:** provider de IA atrás de interface.
**Motivo:** evitar lock-in, facilitar testes e permitir modelos diferentes por recurso.

## ADR-005 — Hybrid planner
**Decisão:** regras duras em código; IA ajuda em priorização e explicação.
**Motivo:** confiabilidade e previsibilidade.

## ADR-006 — PostgreSQL convencional e hospedagem da demonstração

**Decisão** — Hospedar o frontend na Vercel Hobby, a API NestJS em um Web Service Node nativo no Render Free e o banco no Neon PostgreSQL Free. Preservar o monólito modular, o driver `pg` e o Drizzle. Usar uma URL do pooler com papel restrito no runtime e uma URL direta com papel de migração na operação autorizada de banco.

**Motivo** — Aproveitar o workspace e o SQL padrão que o Orbit já utiliza. Os provedores dão suporte à demonstração inicial dentro das cotas. A disponibilidade, o cold start e os limites de recuperação devem ser verificados antes de aceitar dados reais. Consulte o [runbook](DEPLOYMENT.md).

Identidade e storage ficam pendentes nos ciclos correspondentes.
