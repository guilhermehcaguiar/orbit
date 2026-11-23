# Deploy do Orbit

A demonstração usa dois recursos gratuitos. Um Web Service **Render Free**
executa o Next.js e o NestJS. Um projeto **Neon Free** armazena os dados em
PostgreSQL e habilita contas. O modo visitante pode ser publicado só com o
serviço do Render.

O Next.js recebe tráfego público na porta `PORT` da plataforma. O NestJS
escuta em loopback e atende o proxy do Next.js. O comando de start supervisiona
os dois processos e encerra o serviço se um deles cair. O navegador usa a
mesma origem para a interface, o cookie de sessão e as chamadas à API.

## Neon PostgreSQL Free

1. Crie um projeto com banco dedicado à demonstração, em uma região próxima
   ao Web Service. Use dados sintéticos na primeira validação.
2. Separe a credencial de migração da credencial de runtime. Crie um papel
   PostgreSQL para runtime com login e sem superusuário ou `BYPASSRLS`.
3. Aplique as migrations do repositório pela URL direta, com o papel de
   migração e `sslmode=verify-full`. Confirme projeto, branch e banco.
4. Conceda os privilégios do arquivo SQL ao papel de runtime. Use a URL
   do pooler com esse papel e `sslmode=verify-full` no Render.

Na raiz do repositório, com a URL direta já carregada em
`ORBIT_MIGRATION_URL` e o papel de runtime chamado `orbit_runtime`:

```sh
test -n "${ORBIT_MIGRATION_URL:-}" &&
  DATABASE_URL="$ORBIT_MIGRATION_URL" npm run db:migrate --workspace @orbit/api
test -n "${ORBIT_MIGRATION_URL:-}" &&
  psql "$ORBIT_MIGRATION_URL" -v ON_ERROR_STOP=1 -v orbit_runtime=orbit_runtime -f apps/api/drizzle/runtime-grants.sql
```

Execute as migrations antes do deploy e valide o papel de runtime no banco
isolado. A URL direta fica com o operador.

[Conexões seguras no Neon](https://neon.com/docs/connect/connect-securely) · [Pooler do Neon](https://neon.com/docs/connect/connection-pooling)

## Render Free

Após enviar a revisão ao GitHub, crie um Blueprint no Render a partir do
[`render.yaml`](../render.yaml) da raiz. O Blueprint cria um Web Service
`orbit` no plano Free. Para uma demonstração apenas em modo visitante,
configure o mesmo Web Service manualmente e deixe `DATABASE_URL` ausente.

| Campo | Valor |
| --- | --- |
| Runtime | Node nativo, com a versão do `.nvmrc` na raiz |
| Raiz | Raiz do repositório |
| Build | `npm ci --include=dev && npm run build:deploy` |
| Start | `node scripts/start-deploy.mjs` |
| Health check | `/api/orbit/health` |
| `DATABASE_URL` | URL do pooler com papel restrito. Cadastre como segredo para habilitar contas. |
| `ORBIT_WEB_ORIGIN` | Opcional. Para domínio próprio, configure a origem HTTPS exata, sem barra final. Por padrão o launcher usa `RENDER_EXTERNAL_URL`. |

O build compila a API NestJS e gera a web Next.js com Webpack. O launcher fornece a URL interna
da API ao Next.js e repassa a credencial do banco somente ao NestJS. O deploy
automático começa desativado no Blueprint.

[Blueprint do Render](https://render.com/docs/blueprint-spec) · [Porta pública do Render](https://render.com/docs/web-services#port-binding) · [Variáveis do Render](https://render.com/docs/environment-variables)

## Verificação e recuperação

- **Local.** Execute `npm run build:deploy` e `npm run start:deploy`. Use
  `http://localhost:3000/api/orbit/health` e visite `/app`. Para verificar contas,
  rode a suíte em [Testes](TESTING.md#postgresql-e-navegador).
- **Render.** Acesse `/api/orbit/health` na origem HTTPS publicada. HTTP 200
  confirma que Next.js e NestJS responderam. Com banco configurado,
  `database: up` registra que a conexão passou no boot da API.
- **Contas.** Cadastre uma conta sintética, crie dados e confirme a
  sincronização em outro navegador. Valide o isolamento com uma segunda
  conta e meça a resposta após inatividade.
- **Rollback.** Volte a uma revisão compatível com o schema aplicado. Em
  caso de perda de dados, valide a restauração em um ambiente isolado.

## Limites dos planos gratuitos

Next.js e NestJS compartilham os recursos da instância Render Free. Meça o
consumo de memória e o tempo de retomada antes de habilitar um piloto. No
Neon, acompanhe as cotas de armazenamento e computação e teste a recuperação
do banco. Os limites e as cotas vigentes estão nas páginas dos provedores.

[Render Free](https://render.com/docs/free) · [Recursos de computação do Render](https://render.com/docs/compute-plans) · [Neon Free](https://neon.com/pricing)
