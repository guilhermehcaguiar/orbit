# Deploy e ambientes

Este runbook descreve o deploy futuro da demonstração. Provisionamento, aplicação de migrations e publicação precisam de autorização própria. Confirme que o uso é pessoal ou não comercial para a Vercel Hobby e verifique se há dados legados antes de criar o banco de demonstração.

## Ambientes e ordem de publicação

1. Valide a revisão localmente com Node 24 a partir de `24.15.0` e npm 10.9 ou 11.
2. Reserve a origem HTTPS estável da web. Crie um ambiente Neon isolado e use somente dados sintéticos.
3. Aplique a migration autorizada e valide o banco. Publique a API e valide seu healthcheck. Publique a web e confirme os endereços.
4. Mantenha autodeploy desativado na configuração inicial até concluir os smokes. Previews da web ficam demonstrativos até existir ambiente isolado para integração.

## Neon PostgreSQL Free

Escolha regiões próximas para o Render e o Neon. Separe as credenciais por uso e por ambiente.

| Uso | Endpoint | Privilégios |
| --- | --- | --- |
| Runtime da API | Pooler Neon, com `sslmode=verify-full` | Papel restrito às operações da aplicação, sem DDL |
| Migrations | Endpoint direto, com `sslmode=verify-full` | Papel com os privilégios de DDL exigidos pelas migrations versionadas |

O operador deve obter a URL direta por um meio seguro e injetá-la na própria sessão de execução, sem expor a credencial no terminal ou no histórico. Confirme no console o projeto, a branch, o banco e o papel. O CLI lê a variável do processo e o arquivo de configuração oferece um fallback local quando ela está ausente. Interrompa uma execução hospedada com valor ausente ou vazio. Aplique a partir da raiz, com um único executor e fora do build e do start.

```sh
test -n "${DATABASE_URL:-}" && npm run db:migrate --workspace @orbit/api
```

Antes de liberar a API, use um cliente PostgreSQL com validação de certificado e hostname para conectar à branch prevista. Confirme banco e papel, tabela `profiles` e índice único `profiles_email_idx`. Valide com a credencial de runtime que as operações necessárias são permitidas e que a criação de objetos é vedada, usando dados sintéticos. `npm run db:check --workspace @orbit/api` verifica a consistência do histórico local de migrations. A conferência do schema aplicado é feita no banco.

[Conexões seguras](https://neon.com/docs/connect/connect-securely) · [Pooling no Neon](https://neon.com/docs/connect/connection-pooling) · [Drizzle Kit check](https://orm.drizzle.team/docs/drizzle-kit-check)

## Render Free

Crie um Web Service Free no runtime Node nativo. Mantenha a raiz do serviço na raiz do repositório para incluir o lockfile e os pacotes compartilhados. Configure Node compatível com `.nvmrc`.

| Campo | Valor |
| --- | --- |
| Build | `npm ci --include=dev && npm run build --workspace @orbit/api` |
| Start | `npm run start --workspace @orbit/api` |
| Health Check Path | `/api/v1/health` |
| `NODE_ENV` | `production` |
| `PORT` | Injetada pelo Render. A API escuta em `0.0.0.0` |
| `FRONTEND_URL` | Origem HTTPS exata da web, sem caminho nem barra final |
| `DATABASE_URL` | URL do pooler com papel de runtime. Cadastre como segredo do serviço |

As dependências de desenvolvimento são necessárias para compilar a API. O build não precisa acessar o banco. O Render Free não oferece comando de pre-deploy. O healthcheck informa que o processo respondeu. Com banco configurado, `database: up` indica que a consulta inicial passou. Uma falha dessa consulta impede o boot.

[Serviços web](https://render.com/docs/web-services) · [Monorepos](https://render.com/docs/monorepo-support) · [Node.js](https://render.com/docs/node-version) · [Deploy](https://render.com/docs/deploys)

## Vercel Hobby

- Configure o preset Next.js, Root Directory `apps/web` e Node 24.x.
- Habilite **Include source files outside of the Root Directory in the Build Step**. Mantenha a detecção do workspace e do lockfile npm da raiz. Use o build padrão do Next.js para a web e deixe a saída automática.
- A demonstração dispensa variáveis de integração. Quando a web passar a usar a API, `NEXT_PUBLIC_API_URL` conterá somente a URL HTTPS base, por exemplo `https://orbit-api.onrender.com/api/v1`. Mantenha credenciais de banco e variáveis da API fora do projeto Vercel.

[Monorepos da Vercel](https://vercel.com/docs/monorepos/monorepo-faq) · [Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) · [Termos do Hobby](https://vercel.com/legal/terms)

## Smoke e recuperação

- **Local** — compile a API pela raiz. Inicie com `PORT` e `API_PORT` em duas portas livres distintas e `DATABASE_URL` vazia. Confira HTTP 200 na porta indicada por `PORT` e ausência do campo `database`. Encerre o processo ao terminar.
- **Render** — consulte a URL HTTPS do health com verificação normal do certificado, por exemplo `curl -fsS https://orbit-api.onrender.com/api/v1/health`. Inspecione os logs, confirme que segredos não aparecem e verifique o IP observado atrás do proxy. Compare os headers CORS com a origem estável e com uma origem externa. CORS controla acesso pelo navegador.
- **Neon** — confira a conexão PostgreSQL separadamente do HTTPS do Render. Valide a migration e os papéis na branch prevista. Meça a primeira operação após o banco escalar a zero. Meça também o tempo total de resposta após a API ficar ociosa.
- **Vercel** — visite `/`, `/login`, `/cadastro` e `/app`. Confira fontes, navegação, mensagens dos formulários e a ausência de envio de dados na demonstração.
- **Rollback** — volte a uma revisão anterior da aplicação que seja compatível com o schema corrente. Reexecutar o migrador de uma versão antiga não desfaz DDL aplicado. Alterações futuras devem preservar compatibilidade durante a publicação. Recuperação de dados tem fluxo próprio, com restauração verificada em ambiente isolado.

## Limites e acompanhamento

- **Vercel Hobby** — acompanhe cotas no painel. Exceder a franquia pode pausar o projeto. Confirme elegibilidade antes de uso comercial.
- **Render Free** — 0,1 CPU e 512 MB, disco efêmero, suspensão após 15 minutos de inatividade e retomada em cerca de um minuto. As 750 horas gratuitas são compartilhadas por workspace e, quando esgotadas, os serviços Free ficam suspensos até o próximo mês. No workspace Hobby, a franquia mensal de saída é de 5 GB, incluindo chamadas a serviços externos. Excedentes de banda podem gerar cobrança com meio de pagamento vinculado ou suspensão sem ele. Acompanhe também minutos de build.
- **Neon Free** — 1 GB de Postgres, 100 CU-h e 5 GB de transferência pública mensal por projeto. O compute escala a zero após cinco minutos ociosos. A janela de restauração instantânea é de até seis horas. Acompanhe armazenamento, compute e transferência antes de habilitar dados reais. Evite pings para manter a API ou o banco permanentemente ativos.

[Vercel Hobby](https://vercel.com/docs/plans) · [Render Free](https://render.com/docs/free) · [Compute Render](https://render.com/docs/compute-plans) · [Banda Render](https://render.com/docs/outbound-bandwidth) · [Neon Free](https://neon.com/pricing)
