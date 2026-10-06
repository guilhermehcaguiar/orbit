# Modelo de Dados — Orbit

## Convenções

- UUID como PK.
- `created_at`, `updated_at` em tabelas mutáveis.
- timestamps em UTC.
- `user_id` em todas as entidades pertencentes ao usuário.
- RLS obrigatório nas tabelas de usuário.
- enums preferencialmente modelados como texto validado ou enum de banco quando estável.

## Entidades principais

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
