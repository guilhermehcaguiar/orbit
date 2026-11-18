# Segurança — Orbit

## Regras obrigatórias

- secrets apenas no servidor/CI.
- validar JWT em toda rota protegida.
- authorization por ownership em todos os recursos.
- RLS no PostgreSQL como defesa adicional antes de aceitar dados reais. Use identidade derivada da sessão, restrita à transação quando houver pooling, e papel de runtime sem bypass. Teste isolamento entre duas contas.
- `DATABASE_URL` do pooler apenas no runtime da API no Render, com `sslmode=verify-full` e papel restrito. Reserve uma URL direta com papel de migração para o operador. Mantenha ambas fora da Vercel web.
- upload com allowlist de MIME/tamanho.
- nomes de arquivo não devem definir storage path diretamente.
- rate limit em login, upload e IA.
- CORS restrito.
- headers de segurança.
- logs sem tokens, senhas ou conteúdo integral de documentos.
- dependabot/renovate e auditoria de dependências.
- CSP no web quando compatível com a stack.

O rate limiter em memória e o Helmet já estão configurados. Antes de
autenticação real, verifique qual IP chega pelo proxy do Render, estabeleça uma
fronteira confiável para headers encaminhados e valide os limites aplicados à
origem correta. O middleware atual oculta alguns headers sensíveis, mas ainda
registra a URL completa e os demais headers. Limite os logs a campos
operacionais permitidos antes de receber dados de usuários.

## IA

Tratar texto de material como **dados não confiáveis**. Instruções encontradas dentro de PDFs não podem alterar o system prompt nem autorizar ferramentas.

## LGPD / privacidade

- coleta mínima;
- exclusão da conta deve excluir ou anonimizar dados pessoais aplicáveis;
- exportação futura;
- política clara de retenção;
- consentimento separado para marketing;
- conteúdo acadêmico privado por padrão.
