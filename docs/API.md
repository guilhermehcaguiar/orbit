# API — Contrato Inicial

Base: `/api/v1`

## Convenções
- JSON.
- datas ISO 8601.
- autenticação Bearer JWT.
- erros no formato Problem Details-like.
- paginação por cursor nas coleções grandes.
- idempotency key em operações críticas futuras.

## Endpoints

### System
- `GET /health`
- `GET /ready`

### Me
- `GET /me`
- `PATCH /me`

### Semesters
- `GET /semesters`
- `POST /semesters`
- `GET /semesters/:id`
- `PATCH /semesters/:id`
- `DELETE /semesters/:id`

### Subjects
- `GET /subjects`
- `POST /subjects`
- `GET /subjects/:id`
- `PATCH /subjects/:id`
- `DELETE /subjects/:id`
- `GET /subjects/:id/overview`

### Schedules
- `GET /schedule?from=&to=`
- `POST /subjects/:id/schedules`
- `PATCH /subject-schedules/:id`
- `DELETE /subject-schedules/:id`

### Tasks
- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `POST /tasks/:id/complete`
- `DELETE /tasks/:id`

### Assessments
- `GET /assessments`
- `POST /assessments`
- `GET /assessments/:id`
- `PATCH /assessments/:id`
- `DELETE /assessments/:id`

### Focus
- `POST /focus-sessions/start`
- `POST /focus-sessions/:id/finish`
- `POST /focus-sessions/:id/cancel`
- `GET /focus-sessions`
- `GET /focus/summary`

### Study plans
- `GET /study-plans/current`
- `POST /study-plans/generate`
- `POST /study-plans/:id/accept`
- `PATCH /study-plan-items/:id`

### Materials
- `POST /materials/upload-url`
- `POST /materials/:id/process`
- `GET /materials`
- `GET /materials/:id`
- `DELETE /materials/:id`

### Analytics
- `GET /analytics/dashboard`
- `GET /analytics/study?from=&to=`

## Error example

```json
{
  "type": "https://orbit.app/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_ERROR",
  "errors": [{"path":"dueAt","message":"Must be in the future"}],
  "requestId": "..."
}
```
