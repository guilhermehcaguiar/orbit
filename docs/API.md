# API — Contrato Inicial

Base: `/api/v1`

## Contrato implementado

`GET /api/v1/health` retorna HTTP 200:

```json
{
  "status": "ok",
  "service": "orbit-api",
  "environment": "development"
}
```

O ambiente vem de `NODE_ENV` validado. Com banco configurado, `database: up`
indica que `SELECT 1` passou durante o boot. Sem banco configurado, o campo é
omitido. Uma falha de conexão inicial impede o boot. O endpoint não consulta
o banco a cada requisição.

O CORS usa `FRONTEND_URL`. DTOs futuros
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
recebem mensagem genérica, sem stack trace.

### Sessão e workspace

| Método e caminho | Contrato |
| --- | --- |
| `POST /auth/register` | Cria a conta a partir de `name`, `email` e `password`. Retorna `account` e `token` para o cliente servidor. |
| `POST /auth/login` | Autentica com `email` e `password`. Retorna `account` e `token`. |
| `POST /auth/logout` | Revoga a sessão apresentada. Retorna HTTP 204. |
| `GET /me` | Retorna `id`, `name` e `email` da conta autenticada. |
| `GET /workspace` | Retorna `{ revision, workspace }`. |
| `PUT /workspace` | Valida e salva atomicamente `{ revision, workspace }`. Responde HTTP 409 quando a revisão diverge. |
| `POST /workspace/import` | Mescla os registros de `{ revision, workspace }` por identificador e preserva os registros da conta. |
| `GET /subjects`, `/tasks`, `/assessments` | Lista a coleção da conta e sua revisão. Com `/:id`, retorna um único registro. |
| `POST`, `PATCH` e `DELETE` nas coleções | Criação com `{ revision, record }`, alteração parcial em `/:id` com o mesmo envelope e remoção com `{ revision }`. |

Rotas protegidas usam `Authorization: Bearer <token>`. A web usa
`/api/orbit/*` na própria origem, com cookie HttpOnly e verificação de origem
para mutações. O servidor web apresenta o token à API. Opcionalmente,
`X-Orbit-Account` detecta uma troca de conta entre a leitura e a escrita.

## Planejamento futuro

As convenções e rotas abaixo são referências para próximas etapas, não contratos
implementados. Os caminhos são relativos a `/api/v1`.

### Convenções
- JSON.
- datas ISO 8601.
- autenticação Bearer com sessão opaca rotativa a cada login.
- erros no formato Problem Details-like.
- paginação por cursor nas coleções grandes.
- idempotency key em operações críticas futuras.

## Endpoints planejados

### System
- `GET /health` (já implementado)
- `GET /ready` (prontidão futura, com verificação de dependências críticas)

### Me
- `PATCH /me`

### Semesters
- `GET /semesters`
- `POST /semesters`
- `GET /semesters/:id`
- `PATCH /semesters/:id`
- `DELETE /semesters/:id`

### Subjects
- `GET /subjects/:id/overview`

### Schedules
- `GET /schedule?from=&to=`
- `POST /subjects/:id/schedules`
- `PATCH /subject-schedules/:id`
- `DELETE /subject-schedules/:id`

### Tasks
- `POST /tasks/:id/complete`

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
