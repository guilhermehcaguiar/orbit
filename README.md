# Orbit

**Seu foco em órbita.**

Plataforma acadêmica para organizar disciplinas, provas, tarefas e sessões de
foco. O MVP funciona no navegador, sem necessidade de conta ou API. Os
registros persistem no perfil atual do navegador e são removidos se os dados
do site forem limpos. A landing inclui uma prévia ilustrativa do produto.

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
A porta efetiva segue `PORT` (injetada pelo Render), `API_PORT` e o padrão
`3001`, nessa ordem. Se a variável escolhida for inválida, o boot falha.
Variáveis do processo têm prioridade sobre os arquivos opcionais `.env` da API
ou da raiz. Configurações inválidas impedem a inicialização.
Nenhum arquivo `.env` real é necessário ou fornecido.
O frontend reserva `NEXT_PUBLIC_API_URL` para a integração futura e pode ler
variáveis locais em `apps/web/.env.local`.

Nunca versione arquivos de ambiente reais, dependências, builds ou caches.

## Estrutura

```text
apps/
  web/                     Next.js 16, React 19.3, App Router e Tailwind CSS 4
  api/                     NestJS 12 com Fastify
packages/
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

Os testes da API usam `node:test` e a injeção HTTP do Fastify para verificar
healthcheck, configuração, CORS, validação e erros, além de testes de persistência. O Turborepo compila cada app
antes de seus testes. O frontend ainda não tem testes automatizados próprios.

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

Há módulos mínimos para os domínios futuros, sem endpoints de negócio.
A camada de banco Drizzle/PostgreSQL, schema, migrations e repository de profiles
já está preparada; consulte `docs/DATABASE.md`. Não há autenticação real nem
integração do frontend com o banco ou serviços externos.

## Hospedagem planejada

Vercel Hobby para a web, Render Free para a API e Neon PostgreSQL Free para o
banco. Consulte o [runbook de deploy](docs/DEPLOYMENT.md) e o [ADR-006](docs/DECISIONS.md#adr-006--postgresql-convencional-e-hospedagem-da-demonstração).
O provisionamento e os testes nos provedores pertencem a uma etapa posterior.

## Usar o MVP local

Execute `npm run dev --workspace @orbit/web` na raiz e acesse
`http://localhost:3000/app`. Cadastre uma disciplina, associe uma tarefa e
uma prova, confira a agenda e experimente o Pomodoro.

| Rota | Funcionalidade |
| --- | --- |
| `/` | Landing e entrada para o workspace local |
| `/app` | Dashboard com dados do navegador |
| `/subjects` | Gerenciar disciplinas |
| `/tasks` | Gerenciar tarefas, concluir, reabrir e filtrar |
| `/exams` | Gerenciar provas com data e disciplina opcional |
| `/calendar` | Agenda mensal de tarefas, provas e eventos próprios |
| `/pomodoro` | Cronômetro de foco e pausa com histórico de conclusões |
| `/ai` | Plano de estudos local ordenado por prazos |
| `/statistics` | Tempo de foco, sessões e tarefas concluídas |
| `/settings` | Nome de exibição e duração de foco e pausa |
| `/login`, `/cadastro` | Protótipos visuais de autenticação |

O tema usa Sora, Inter e o design system em `packages/design-system`. Veja
[Fundação visual](docs/VISUAL_FOUNDATION.md) e
[Fundação da API](docs/BACKEND_FOUNDATION.md) para os registros anteriores.
