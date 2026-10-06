# Padrões de Código

- TypeScript strict.
- Evitar `any`.
- Nomes de domínio em inglês no código; UI em pt-BR inicialmente.
- Funções pequenas e explícitas.
- DTO/schema na borda; entidades do domínio não devem ser objetos HTTP.
- Sem acesso ao banco dentro de controller/component.
- Repositórios atrás de interfaces nos módulos relevantes.
- Componentes de UI preferencialmente puros.
- Server Components por padrão no Next.js; Client Components apenas quando interatividade exigir.
- Não duplicar schemas: compartilhar contratos no package `contracts` quando fizer sentido.
- Não criar abstração antes de existir repetição ou motivo arquitetural.
- Comentários explicam o porquê, não o óbvio.

## Commits sugeridos

Conventional Commits:
- `feat:`
- `fix:`
- `refactor:`
- `test:`
- `docs:`
- `chore:`

Um commit deve representar uma unidade lógica revisável.
