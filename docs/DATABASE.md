# Modelo de Dados — Orbit

## Convenções

- UUID como PK.
- `created_at`, `updated_at` em tabelas mutáveis.
- timestamps em UTC.
- `user_id` em todas as entidades pertencentes ao usuário.
- RLS obrigatório nas tabelas de usuário antes de receber dados reais. O schema atual de demonstração ainda não implementa RLS.
- enums preferencialmente modelados como texto validado ou enum de banco quando estável.

## Camada de Persistência (etapa 3B)

### ORM e Ferramentas
- **Drizzle ORM** — type-safe, leve, compatível com PostgreSQL.
- **drizzle-kit** — geração de migrations, introspecção e verificação do histórico local de migrations.
- **node-postgres (`pg`)** — driver PostgreSQL usado pelo adapter `drizzle-orm/node-postgres`, com pool de conexões.

### Estrutura do projeto
```
apps/api/
  drizzle.config.ts          # configuração do drizzle-kit
  drizzle/                   # migrations geradas
  src/
    database/
      database.module.ts     # módulo global de banco
      database.service.ts    # conexão, lifecycle, pool
      schema/
        profiles.ts          # tabela profiles
      repositories/
        profiles.repository.ts
```

### Configuração (`drizzle.config.ts`)
O Drizzle Kit usa os arquivos em `src/database/schema/` e grava migrations
em `drizzle/`. Ele lê `DATABASE_URL` do processo. Se a variável estiver ausente,
o arquivo de configuração tem um fallback para o banco `orbit` em
`localhost:5432`.

### Scripts de banco
| Comando | Descrição |
|---------|-----------|
| `npm run db:generate` | Gera migration SQL a partir do schema TypeScript |
| `npm run db:migrate`  | Aplica migrations pendentes no banco alvo |
| `npm run db:check`    | Verifica a consistência do histórico local de migrations |

Um operador autorizado executa migrations separadamente, fora do build e do start. No Neon, use uma URL direta com `sslmode=verify-full` e papel de migração. Confirme a branch e o banco antes de aplicar. Interrompa a execução se a variável estiver ausente ou vazia em ambiente hospedado. Consulte o [runbook](DEPLOYMENT.md).

### Schema inicial — `profiles`
Tabela mínima para validar a arquitetura. O chamador fornece o UUID. O schema atual não tem chave estrangeira para identidade nem RLS.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, NOT NULL |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `name` | `varchar(255)` | NOT NULL |
| `avatar_url` | `text` | NULL |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |

Índice único em `email` para lookup rápido.

```sql
CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "avatar_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");
```

### Repository Pattern
`ProfilesRepository` expõe apenas operações necessárias:
- `findById(id)`
- `findByEmail(email)`
- `create(profile)`
- `update(id, { name, avatarUrl })`

Controllers **não** acessam repository diretamente. Fluxo:
```
Controller → UsersService → ProfilesRepository → Database
```

### Variáveis de ambiente
| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Não (local) | URL de conexão PostgreSQL (`postgresql://` ou `postgres://`). Vazio desabilita persistência. |

Validada em `validateEnvironment()`; formato inválido falha no boot.
Quando configurada, a API verifica a conexão com `SELECT 1` na inicialização.
Uma falha encerra o pool e impede o boot. O ORM é criado antes dos hooks de
lifecycle para que o provider `DATABASE` receba a instância correta.
O campo `database: up` no healthcheck indica que essa verificação inicial passou;
não representa uma nova consulta ao banco a cada requisição. Sem URL, o campo
`database` é omitido. Se a verificação falhar com URL configurada, a API não
inicia. Confira tabela, índice e permissões com um smoke diretamente no banco.

No Render, configure `DATABASE_URL` com o pooler, `sslmode=verify-full` e
um papel de runtime com privilégios mínimos. Guarde a URL direta separadamente
para migrations. O frontend na Vercel não recebe credenciais de banco.

## Entidades principais (futuras)

### profiles
- id (UUID interno associado à futura identidade externa)
- display_name
- timezone
- locale
- avatar_url
- onboarding_completed_at

### semesters
- id
- user_id
- name
- start_date
- end_date
- status

### subjects
- id
- user_id
- semester_id
- name
- code
- professor
- color
- workload_minutes
- absence_limit
- archived_at

### subject_schedules
- id
- subject_id
- weekday
- starts_at_local
- ends_at_local
- location
- recurrence_start
- recurrence_end

### tasks
- id
- user_id
- subject_id nullable
- title
- description
- due_at
- priority
- status
- estimated_minutes
- completed_at

### task_items
- id
- task_id
- title
- sort_order
- completed_at

### assessments
- id
- user_id
- subject_id
- title
- type
- starts_at
- weight
- max_score
- achieved_score nullable
- preparation_level
- notes

### assessment_topics
- id
- assessment_id
- title
- mastery_level

### focus_sessions
- id
- user_id
- subject_id nullable
- task_id nullable
- assessment_id nullable
- started_at
- ended_at
- planned_minutes
- focused_minutes
- status
- interruption_count

### availability_windows
- id
- user_id
- weekday
- starts_at_local
- ends_at_local
- max_focus_minutes

### study_plans
- id
- user_id
- start_date
- end_date
- status
- source
- rationale_summary
- generated_by_model nullable

### study_plan_items
- id
- study_plan_id
- subject_id nullable
- task_id nullable
- assessment_id nullable
- title
- starts_at
- ends_at
- item_type
- priority_score
- status

### materials
- id
- user_id
- subject_id nullable
- file_name
- mime_type
- storage_path
- processing_status
- checksum

### material_chunks
- id
- material_id
- chunk_index
- content
- embedding vector nullable
- metadata jsonb

### ai_runs
- id
- user_id
- feature
- provider
- model
- prompt_version
- input_tokens nullable
- output_tokens nullable
- latency_ms nullable
- status
- metadata jsonb
- created_at

## Índices

Criar índices para:
- `(user_id, due_at)` em tasks;
- `(user_id, starts_at)` em assessments;
- `(subject_id, starts_at)` quando aplicável;
- `(user_id, started_at)` em focus_sessions;
- `(study_plan_id, starts_at)` em study_plan_items;
- `material_id` em material_chunks;
- índice vetorial somente quando RAG for ativado.

## Controle de acesso planejado

A API valida a sessão e associa a identidade externa ao UUID interno. Aplique
ownership a leituras e mutações. Projete as políticas RLS a partir dessa
identidade, limitada à transação quando houver pooling, e teste o isolamento
entre duas contas com um papel de runtime sem bypass de RLS.

Para entidades filhas sem `user_id`, validar ownership através da entidade pai ou incluir `user_id` para simplificar autorização.
