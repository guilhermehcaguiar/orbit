# Camada de IA — Orbit

## Objetivo

A IA deve ajudar a tomar decisões acadêmicas, não ser um chat genérico anexado ao produto.

## Casos de uso prioritários

1. Gerar plano de estudos semanal.
2. Repriorizar plano quando prazos mudarem.
3. Explicar por que uma atividade ganhou prioridade.
4. Resumir materiais.
5. Depois: questões, flashcards e tutor contextual.

## Arquitetura

```text
StudyPlanUseCase
  -> AiPlanningPort
      -> OpenAiPlanningAdapter
```

O domínio conhece a interface, não o SDK do provedor.

## Input do planejador

- timezone;
- intervalo do plano;
- disciplinas;
- provas e seus pesos;
- tarefas/prazos;
- janelas livres;
- histórico recente de foco;
- nível de preparo informado;
- preferências de sessão.

## Output obrigatório

Usar schema estruturado semelhante a:

```json
{
  "summary": "...",
  "warnings": [],
  "items": [
    {
      "title": "Revisar limites",
      "subjectId": "uuid",
      "assessmentId": "uuid-or-null",
      "startsAt": "ISO",
      "durationMinutes": 50,
      "priority": 0.91,
      "reason": "Prova próxima + baixo nível de preparo"
    }
  ]
}
```

Nunca confiar em IDs inventados pelo modelo: validar todos contra o conjunto fornecido.

## Guardrails

- IA nunca grava diretamente no banco.
- saída é validada por schema.
- regras duras de calendário são aplicadas por código, não por prompt.
- plano gerado é uma sugestão até o usuário aceitar.
- limitar volume de contexto.
- remover conteúdo desnecessário e dados pessoais antes do provider.
- logar metadados técnicos, não conteúdo sensível completo.
- timeout, retry controlado e fallback determinístico.

## Algoritmo híbrido recomendado

Não delegar toda a lógica à IA.

1. Código calcula disponibilidade e restrições duras.
2. Código calcula um score-base de urgência.
3. IA recebe opções válidas e melhora a priorização/explicação.
4. Código valida conflitos e duração.
5. Usuário aprova o plano.

Score-base inicial:

```text
priority =
  deadlineUrgency * 0.35 +
  assessmentWeight * 0.20 +
  lowPreparation * 0.20 +
  pendingEffort * 0.15 +
  overduePenalty * 0.10
```

Os pesos devem ser configuráveis e evoluir por dados reais.

## RAG

Para PDFs e materiais:
- upload -> Storage;
- extração -> chunks;
- embeddings -> pgvector;
- busca filtrada por `user_id` e `subject_id`;
- resposta sempre limitada aos materiais do usuário.

## Prompt versioning

Armazenar arquivos de prompt em `apps/api/src/modules/ai/prompts/` e registrar `prompt_version` em `ai_runs`.
