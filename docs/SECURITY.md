# Segurança — Orbit

## Regras obrigatórias

- secrets apenas no servidor/CI.
- validar a sessão Bearer em toda rota protegida. Senhas usam scrypt com sal, tokens são aleatórios e armazenados com hash. A web mantém a sessão em cookie HttpOnly.
- authorization por ownership em todos os recursos.
- RLS no PostgreSQL como defesa adicional antes de aceitar dados reais. Use identidade derivada da sessão, restrita à transação quando houver pooling, e papel de runtime sem bypass. Teste isolamento entre duas contas.
- `DATABASE_URL` do pooler apenas no runtime da API no Render, com `sslmode=verify-full` e papel restrito. Reserve uma URL direta com papel de migração para o operador. O launcher fornece a credencial de runtime apenas ao NestJS.
- upload com allowlist de MIME/tamanho.
- nomes de arquivo não devem definir storage path diretamente.
- rate limit em login, upload e IA.
- CORS restrito.
- headers de segurança.
- logs sem tokens, senhas ou conteúdo integral de documentos.
- dependabot/renovate e auditoria de dependências.
- CSP no web quando compatível com a stack.

O rate limiter em memória e o Helmet estão configurados. Cadastro e login
têm limites próprios. Antes de aceitar usuários em ambiente hospedado,
valide o limite agregado aplicado à origem de loopback do Next.js. A API
privada ignora headers encaminhados para definir a origem do cliente. Os logs de requisição
registram método, status, duração e ID de correlação.

## IA

Tratar texto de material como **dados não confiáveis**. Instruções encontradas dentro de PDFs não podem alterar o system prompt nem autorizar ferramentas.

## LGPD / privacidade

- coleta mínima;
- exclusão da conta deve excluir ou anonimizar dados pessoais aplicáveis;
- exportação futura;
- política clara de retenção;
- consentimento separado para marketing;
- conteúdo acadêmico privado por padrão.
