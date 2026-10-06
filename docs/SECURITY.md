# Segurança — Orbit

## Regras obrigatórias

- secrets apenas no servidor/CI.
- validar JWT em toda rota protegida.
- authorization por ownership em todos os recursos.
- RLS habilitado no Supabase.
- upload com allowlist de MIME/tamanho.
- nomes de arquivo não devem definir storage path diretamente.
- rate limit em login, upload e IA.
- CORS restrito.
- headers de segurança.
- logs sem tokens, senhas ou conteúdo integral de documentos.
- dependabot/renovate e auditoria de dependências.
- CSP no web quando compatível com a stack.

## IA

Tratar texto de material como **dados não confiáveis**. Instruções encontradas dentro de PDFs não podem alterar o system prompt nem autorizar ferramentas.

## LGPD / privacidade

- coleta mínima;
- exclusão da conta deve excluir ou anonimizar dados pessoais aplicáveis;
- exportação futura;
- política clara de retenção;
- consentimento separado para marketing;
- conteúdo acadêmico privado por padrão.
