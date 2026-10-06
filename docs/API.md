# API — Contrato Inicial

Base: `/api/v1`

## Implementado na etapa 3A

`GET /api/v1/health` retorna HTTP 200:

```json
{
  "status": "ok",
  "service": "orbit-api",
  "environment": "development"
}
```

O ambiente vem de `NODE_ENV` validado. O CORS usa `FRONTEND_URL`. DTOs futuros
passam pela validação global. O formato atual de erro é:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid input",
  "path": "/api/v1/...",
  "timestamp": "2026-10-06T12:00:00.000Z"
}
```

`message` também pode ser uma lista de mensagens de validação. Falhas internas
recebem mensagem genérica, sem stack trace. Não há endpoints de negócio.

## Planejamento futuro

As convenções e rotas abaixo são referências para próximas etapas, não contratos
implementados. Os caminhos são relativos a `/api/v1`.

### Convenções
- JSON.
- datas ISO 8601.
- autenticação Bearer JWT.
- erros no formato Problem Details-like.
- paginação por cursor nas coleções grandes.
- idempotency key em operações críticas futuras.

## Endpoints planejados

### System
- `GET /health` (já implementado)
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

## Exemplo futuro de erro (não implementado)

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
