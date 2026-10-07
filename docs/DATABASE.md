# Modelo de Dados — Orbit

## Convenções

- UUID como PK.
- `created_at`, `updated_at` em tabelas mutáveis.
- timestamps em UTC.
- `user_id` em todas as entidades pertencentes ao usuário.
- RLS obrigatório nas tabelas de usuário.
- enums preferencialmente modelados como texto validado ou enum de banco quando estável.

## Camada de Persistência (etapa 3B)

### ORM e Ferramentas
- **Drizzle ORM** — type-safe, leve, compatível com PostgreSQL.
- **drizzle-kit** — geração de migrations, introspecção, check de schema.
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
```ts
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/*.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL },
  verbose: true,
  strict: true,
});
```

### Scripts de banco
| Comando | Descrição |
|---------|-----------|
| `npm run db:generate` | Gera migration SQL a partir do schema TypeScript |
| `npm run db:migrate`  | Aplica migrations pendentes no banco alvo |
| `npm run db:check`    | Verifica se schema TypeScript está sincronizado com o banco |

Migrations **não** são executadas automaticamente em produção. O deploy deve rodar `db:migrate` explicitamente.

### Schema inicial — `profiles`
Tabela mínima para validar a arquitetura. Compatível com `auth.users` do Supabase (PK `uuid`).

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
não representa uma nova consulta ao banco a cada requisição.

## Entidades principais (futuras)

### profiles
- id (FK auth.users)
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

## RLS mínima

Política conceitual para tabelas do usuário:

```sql
using (user_id = auth.uid())
with check (user_id = auth.uid())
```

Para entidades filhas sem `user_id`, validar ownership através da entidade pai ou incluir `user_id` para simplificar autorização.
