# Fundação modular do backend — etapa 3A

NestJS com Fastify, ESM e TypeScript estrito. O frontend permanece inalterado.

## Estrutura

```text
apps/api/
  src/
    main.ts
    app.module.ts
    common/filters/http-exception.filter.ts
    config/
      environment.ts
      configure-app.ts
    modules/
      auth/          módulo e serviço, sem autenticação
      users/         módulo e serviço, sem persistência
      subjects/      somente módulo
      schedule/      somente módulo
      tasks/         somente módulo
      exams/         somente módulo
      focus/         somente módulo
      study-plans/   somente módulo
      ai/            somente módulo
      health/        módulo, controller e serviço
  test/
    api.test.mjs
    environment.test.mjs
```

Não há controllers vazios, DTOs fictícios ou camada de contratos compartilhados.
DTOs devem ser adicionados junto de endpoints reais e suas validações.

## Configuração

`ConfigModule` global valida e armazena somente as configurações usadas pela API.

| Variável | Padrão local | Validação |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test` ou `production` |
| `API_PORT` | `3001` | Inteiro entre 1 e 65535 |
| `FRONTEND_URL` | `http://localhost:3000` | Origem HTTP/HTTPS exata, sem caminho, credenciais ou wildcard |

Os valores fornecidos inválidos fazem o servidor falhar antes de escutar conexões.
Não é necessário criar `.env`. Quando existir, o arquivo da API tem prioridade
sobre o da raiz; variáveis do processo têm prioridade sobre ambos. Os caminhos
são resolvidos a partir do módulo, independentemente do diretório de execução.
Em produção, configure explicitamente a origem do frontend.

## HTTP

O prefixo global é `api`; o versionamento URI do Nest usa a versão padrão `1`.
O único endpoint implementado é `GET /api/v1/health`, que retorna:

```json
{"status":"ok","service":"orbit-api","environment":"development"}
```

O healthcheck indica que o processo está ativo, sem verificar serviços externos.
`environment` vem da configuração validada. `/health` não é mais exposto.
CORS usa exclusivamente `FRONTEND_URL` e não habilita credenciais.

`ValidationPipe` global transforma DTOs, aceita somente campos declarados e
rejeita campos adicionais. Não habilita conversão implícita indiscriminada.

O filtro global retorna `statusCode`, `error`, `message`, `path` e `timestamp`.
Mensagens de validação podem ser listas. Erros 500 têm mensagem genérica e
nunca incluem stack trace na resposta. Falhas internas são registradas pelo
logger padrão do Nest, sem infraestrutura adicional.

## Testes e comandos

Execute na raiz:

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

O Turborepo compila o próprio app antes de testar. A API usa o runner nativo
`node:test`, sem Jest ou Supertest. O Fastify injeta requisições no pipeline
Nest real, incluindo configuração, controller, serviço, versionamento, CORS e
filtro. Rotas de erro existem somente no módulo de teste.
Há testes adicionais de configuração e validação de entrada.

Para executar o build da API:

```sh
npm run start --workspace @orbit/api
```

Persistência, autenticação e funcionalidades de negócio ficam para próximas etapas.

## Verificação da etapa

- `npm run lint`: aprovado, sem warnings.
- `npm run typecheck`: aprovado.
- `npm run test`: 24 testes da API aprovados; o frontend ainda não possui testes próprios.
- `npm run build`: API e frontend compilados com sucesso.
- API iniciada pelo script `start`, sem exceções; requisição HTTP real ao
  `/api/v1/health` retornou 200 e o ambiente `development`.
- Servidor de verificação encerrado após o teste; nenhum `.env` criado.

A instalação das dependências de configuração e validação manteve o relatório
existente de cinco vulnerabilidades altas na cadeia de lint do Next.js. Nenhuma
correção automática de audit ou alteração fora do escopo foi aplicada.
