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

## ADR-006 — PostgreSQL convencional e hospedagem inicial da demonstração

A topologia de hospedagem foi substituída pelo ADR-008.

**Decisão** — Hospedar o frontend na Vercel Hobby, a API NestJS em um Web Service Node nativo no Render Free e o banco no Neon PostgreSQL Free. Preservar o monólito modular, o driver `pg` e o Drizzle. Usar uma URL do pooler com papel restrito no runtime e uma URL direta com papel de migração na operação autorizada de banco.

**Motivo** — Aproveitar o workspace e o SQL padrão que o Orbit já utiliza. Os provedores dão suporte à demonstração inicial dentro das cotas. A disponibilidade, o cold start e os limites de recuperação devem ser verificados antes de aceitar dados reais. Consulte o [runbook](DEPLOYMENT.md).

A identidade foi definida no ADR-007. O armazenamento de objetos permanece planejado.


## ADR-007 — Sessões do workspace

**Decisão** — Gerenciar credenciais e sessões na API NestJS, com hash scrypt
para a senha, token opaco revogável no PostgreSQL e cookie HttpOnly na web.
A API resolve a identidade a partir do token e a define dentro da transação
para aplicar as políticas RLS. O Next.js repassa o token à API pelo servidor.

**Motivo** — Habilitar contas e testes de isolamento com os serviços já usados
pelo projeto. Verificação de e-mail e recuperação de acesso entram no
planejamento do ambiente hospedado.


## ADR-008 — Dois recursos gratuitos para a demonstração

**Decisão** — Executar Next.js e NestJS no mesmo Web Service Render Free e
manter o Neon Free como PostgreSQL gerenciado. O Next.js expõe a porta pública
e o NestJS atende o proxy pelo loopback. Um launcher supervisiona os dois
processos.

**Motivo** — Manter a API dedicada e as migrations existentes usando um
recurso de computação e um banco gerenciado. A instância de computação
compartilha CPU e memória entre web e API. O [runbook](DEPLOYMENT.md)
descreve como publicar e validar a topologia.
