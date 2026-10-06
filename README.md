# Orbit

**Seu foco em órbita.**

Plataforma acadêmica para estudantes, planejada para organizar matérias, horários,
provas, tarefas, Pomodoro e recursos de IA. Esta etapa contém apenas a fundação do
monorepo, um dashboard visual com dados mockados, o design system e o endpoint
de saúde da API. Os módulos de navegação adicionais são prévias visuais.

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

A API usa `ConfigModule` para validar `NODE_ENV`, `API_PORT` e `FRONTEND_URL`.
Os padrões locais são `development`, `3001` e `http://localhost:3000`.
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
healthcheck, configuração, CORS, validação e erros. O Turborepo compila cada app
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
Não há banco de dados, autenticação ou serviços externos configurados nesta etapa.

## Fundação visual

O dashboard inicia em modo escuro e usa Sora nos títulos e Inter na interface,
hospedadas localmente pelo Next.js. Tokens e componentes ficam em
`packages/design-system`; mocks, layouts e componentes do dashboard ficam em
`apps/web/src`. As interações usam apenas estado local, sem persistência ou
chamadas ao backend.

Consulte `docs/VISUAL_FOUNDATION.md` para o inventário de arquivos, componentes,
decisões e validações da segunda etapa.

Consulte `docs/BACKEND_FOUNDATION.md` para a estrutura e as decisões da etapa 3A.
