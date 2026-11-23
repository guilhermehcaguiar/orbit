# Orbit

**Seu foco em órbita.**

Plataforma acadêmica para organizar disciplinas, tarefas, provas, horários e
sessões de foco. O workspace tem modo visitante, com dados no navegador, e
modo com conta, com dados sincronizados pelo PostgreSQL. Registros do visitante
podem ser importados pela própria conta em Configurações.

## Requisitos

- Node.js 24 LTS, versão 24.15.0 ou superior (definido em `.nvmrc`).
- npm 10.9 ou 11, com npm workspaces definidos no `package.json` raiz.

## Instalação e desenvolvimento

Na raiz do repositório:

```bash
npm install
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001/api/v1/health

A API responde:

```json
{
  "status": "ok",
  "service": "orbit-api",
  "environment": "development"
}
```

## Variáveis de ambiente

`.env.example` documenta somente valores locais, sem segredos.
O desenvolvimento inicial funciona sem criar um arquivo `.env`.

A API usa `ConfigModule` para validar `NODE_ENV`, `API_PORT`, `FRONTEND_URL` e
`DATABASE_URL` (opcional no modo sem conexão).
Os padrões locais são `development`, `3001` e `http://localhost:3000`.
Ao rodar a API separadamente, a porta segue `PORT`, `API_PORT` e o padrão
`3001`, nessa ordem. Se a variável escolhida for inválida, o boot falha.
Variáveis do processo têm prioridade sobre os arquivos opcionais `.env` da API
ou da raiz. Configurações inválidas impedem a inicialização.
Nenhum arquivo `.env` real é necessário ou fornecido.
A web acessa a API pelo servidor do Next.js. O endereço padrão é
`http://localhost:3001/api/v1`. Para usar outro endereço local, defina
`ORBIT_API_URL` em `apps/web/.env.local`.

### Habilitar contas localmente

Crie um banco de desenvolvimento dedicado no PostgreSQL. Aplique as
migrations com o papel de migração e conceda os privilégios ao papel de
runtime, que deve existir com login e sem bypass de RLS.

```bash
DATABASE_URL="$ORBIT_MIGRATION_URL" npm run db:migrate --workspace @orbit/api
psql "$ORBIT_MIGRATION_URL" -v ON_ERROR_STOP=1 -v orbit_runtime=orbit_runtime -f apps/api/drizzle/runtime-grants.sql
DATABASE_URL="$ORBIT_RUNTIME_URL" npm run dev
```

As duas variáveis acima são URLs PostgreSQL locais, com as credenciais de cada
papel. Com a API em execução, abra `/cadastro`. Em Configurações, use **Importar
registros do navegador** caso já tenha dados de visitante.

Nunca versione arquivos de ambiente reais, dependências, builds ou caches.

## Estrutura

```text
apps/
  web/                     Next.js 16, React 19.3, App Router e Tailwind CSS 4
  api/                     NestJS 12 com Fastify
packages/
  contracts/               Validação e regras do workspace compartilhadas
  config-eslint/           Configurações ESLint compartilhadas
  config-typescript/       Configurações TypeScript estritas
  design-system/           Componentes React reutilizáveis e tokens CSS
docs/                      Documentação e decisões técnicas
```

Os materiais preexistentes em `docs/`, `design/`, `starter/`,
`architecture.json` e `START_HERE.md` são referências para a evolução.
Os arquivos em `starter/` não participam do workspace ativo.

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia frontend e API em modo de desenvolvimento |
| `npm run build` | Compila os aplicativos |
| `npm run lint` | Executa ESLint nos aplicativos e na configuração compartilhada |
| `npm run typecheck` | Gera tipos do Next.js e verifica TypeScript |
| `npm run test` | Executa o runner nativo do Node.js nos aplicativos |

O CI executa os gates a cada PR e inclui testes de integração com PostgreSQL
e testes Playwright do visitante, da conta e do planejador. Consulte
[a estratégia de testes](docs/TESTING.md) para executar as suites localmente.

Para iniciar os builds de produção:

```bash
npm run start --workspace @orbit/web
npm run start --workspace @orbit/api
```

## Configuração do monorepo

Os workspaces `apps/*` e `packages/*` são definidos no `package.json` raiz.
Os pacotes locais usam a versão `0.0.0`, correspondente aos workspaces privados;
o npm cria os vínculos locais durante a instalação. Mantenha `package-lock.json`
versionado e use `npm ci` quando esse arquivo estiver disponível e atualizado.
O TypeScript tem configuração estrita
compartilhada e referências aos apps no arquivo raiz; as verificações são
executadas por app via Turborepo.

O frontend usa o alias `@/*` para `src/*`.
A API usa ESM, resolução NodeNext e o alias `#app/*`, também definido em
`package.json#imports` para funcionar no build executado pelo Node.js.

A API NestJS implementa sessão, perfil e sincronização do workspace. As rotas
de disciplinas, tarefas e avaliações também podem ser consumidas diretamente
por clientes autenticados. Consulte os [contratos HTTP](docs/API.md) e o
[modelo de dados](docs/DATABASE.md).

## Hospedagem

O deploy usa um Web Service **Render Free** para Next.js e NestJS e um
banco **Neon Free** para contas e sincronização. O Blueprint
[`render.yaml`](render.yaml) define o serviço. A porta pública atende a web e
o proxy da API na mesma origem.

Para testar a topologia localmente, execute `npm run build:deploy` e
`npm run start:deploy` e abra `http://localhost:3000`. Use a URL de runtime
em `DATABASE_URL` para testar o modo com conta.

Consulte o [runbook de deploy](docs/DEPLOYMENT.md) para provisionar os serviços,
aplicar migrations e validar o ambiente hospedado.

## Usar o MVP local

Execute `npm run dev --workspace @orbit/web` na raiz e acesse
`http://localhost:3000/app`. Cadastre uma disciplina, associe uma tarefa e
uma prova, confira a agenda e experimente o Pomodoro.

| Rota | Funcionalidade |
| --- | --- |
| `/` | Landing e entrada para o workspace local |
| `/app` | Agenda de hoje, tarefas atrasadas, próxima aula e foco rápido |
| `/onboarding` | Disciplina e primeiro compromisso, com convite para importar registros locais |
| `/schedule` | Semestres e horários recorrentes de aula |
| `/subjects` | Gerenciar disciplinas |
| `/tasks` | Gerenciar tarefas, concluir, reabrir e filtrar |
| `/exams` | Gerenciar provas com data e disciplina opcional |
| `/calendar` | Agenda diária, semanal e mensal com tarefas, provas, eventos, aulas e blocos de estudo |
| `/pomodoro` | Cronômetro de foco e pausa com histórico de conclusões |
| `/ai` | Disponibilidade, geração, edição e aceite do plano semanal |
| `/statistics` | Foco por dia e disciplina, sessões e tarefas concluídas |
| `/settings` | Perfil, preferências, importação e saída da conta |
| `/login`, `/cadastro` | Autenticação quando a API tem PostgreSQL configurado |

O tema usa Sora, Inter e o design system em `packages/design-system`. Veja
[Fundação visual](docs/VISUAL_FOUNDATION.md) e
[Fundação da API](docs/BACKEND_FOUNDATION.md) para os registros anteriores.
