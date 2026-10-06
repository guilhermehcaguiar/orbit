# Fundação do monorepo

Esta etapa implementa somente a base técnica: página inicial e GET /health.
Os recursos descritos nos demais documentos são planejamento para etapas futuras.

## Decisões

- Node.js 24 LTS, mínimo 24.15.0 para as dependências instaladas do Nest CLI,
  e npm 10.9 ou 11 como único gerenciador de pacotes.
- Next.js 16, React 19.3 e Tailwind CSS 4 no frontend.
- NestJS 12 com Fastify, ESM e resolução NodeNext na API.
- TypeScript 5.9 para compatibilidade com as ferramentas desta fundação.
- ESLint 9 com configuração flat compartilhada, TypeScript strict e EditorConfig.
- npm workspaces definidos por apps/* e packages/* no package.json raiz.
- Pacotes internos privados vinculados pela versão local 0.0.0.
- Referências TypeScript na raiz; Turborepo executa verificações por app.
- Alias @/* no frontend e #app/* na API, com imports nativos do Node.js.
- Runner nativo node:test preparado nos scripts, sem testes nesta etapa.
- Sem carregador de .env na API: API_PORT vem do processo e tem padrão 3001.
- Documentação e materiais preexistentes preservados; starter/ é referência.

## Validação desta execução

Esta revisão migra a configuração para npm workspaces e Turborepo.
Os diretórios de dependências antigos da raiz, apps e configuração ESLint foram
removidos, assim como os caches do Turborepo, apps/web/.next e apps/api/dist.
Os demais diretórios temporários solicitados não estavam presentes.

Na verificação final de 06/10/2026, o ambiente usa Node 24.21.0 LTS e npm 10.9.2.
`npm install` concluiu com sucesso: dependências atualizadas e 540 pacotes
auditados. `package-lock.json` e `node_modules` estão presentes; o lockfile
permanece fora do `.gitignore` e node_modules está ignorado.
O campo packageManager corresponde ao npm instalado. A faixa de Node
`>=24.15.0 <25` foi preservada: permite a linha 24 LTS a partir do mínimo
exigido pelas dependências instaladas do Nest CLI, sem fixar um patch exato.

`npm run lint`, `npm run typecheck` e `npm run build` concluíram com código zero,
executados com `--force` do Turborepo para validar sem reutilizar o cache.
Lint validou os dois apps e a configuração compartilhada; typecheck e build
validaram os dois apps. O frontend foi compilado e pré-renderizado.
Os outputs do typecheck no Turborepo agora incluem dist/tsconfig.tsbuildinfo,
correspondente ao arquivo incremental da API, eliminando o aviso de cache.
A busca final não encontrou referências ao gerenciador anterior nos arquivos
mantidos do projeto; as ocorrências restantes pertencem às dependências e aos
artefatos gerados por elas.

Os dois apps foram iniciados pelos scripts de produção e também pelo comando
raiz `npm run dev`. Em ambos os modos, o frontend retornou HTTP 200 contendo
"Orbit" e "Seu foco em órbita."; GET /health retornou HTTP 200 com
`{"status":"ok","service":"orbit-api"}`. Os servidores de teste foram encerrados.
Não foram encontrados arquivos indevidos na raiz; docs, design e starter foram
preservados. A revisão das configurações não exigiu novas correções.

O npm audit reportou cinco achados altos: eslint-config-next, dependência direta
do pacote de configuração ESLint, e as transitivas @next/eslint-plugin-next,
fast-glob, micromatch e braces. A proposta automática troca eslint-config-next
16.3.8 por 14.2.35, mudança principal regressiva que não foi considerada uma
correção segura para aplicar sem avaliação de compatibilidade.
Não foram executados npm audit fix nem atualizações forçadas.
Permanecem pendentes a revisão desses achados e a avaliação de atualização do
ESLint 9, cuja versão instalada foi marcada como fora de suporte pelo npm.
