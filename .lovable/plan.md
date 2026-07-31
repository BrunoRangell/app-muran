## Objetivo

Completar o onboarding parcial do cliente **Olinda** no ClickUp: só a lista "Onboarding" foi criada; as demais listas do template estão faltando.

## O que será feito

1. Garantir que a edge function `retry-clickup-onboarding` está deployada (ela já existe no código e faz exatamente esse diff).
2. Disparar a função com `clientName: "Olinda"`:
   - localiza a pasta existente do cliente no Space;
   - compara as listas do template com as já criadas;
   - cria só as faltantes, copiando as tarefas do template (assignees, tags, status, due date).
3. Ler o resumo retornado (`created` / `skipped` / `errors`) e os logs da função para confirmar o que foi criado.
4. Se aparecer `HLIMIT_005` novamente, reportar: o Space do ClickUp está no limite de listas do plano e é preciso arquivar listas antigas ou fazer upgrade antes de retentar.
5. Se alguma tarefa individual falhar (timeout/rate limit), retentar apenas as listas afetadas.

## Detalhes técnicos

- Nenhuma alteração de código prevista; apenas deploy (se necessário) e invocação da função existente `supabase/functions/retry-clickup-onboarding/index.ts`.
- Sem migrações de banco.
- Usa os secrets já configurados: `CLICKUP_TOKEN`, `CLICKUP_SPACE_ID`, `CLICKUP_TEMPLATE_FOLDER_ID`.

## Observação

A pasta no ClickUp precisa ter o nome exatamente "Olinda" (comparação é case-insensitive e ignora espaços). Se o nome no ClickUp for diferente (ex: "Olinda Imóveis"), a função retorna 404 e eu ajusto o nome na chamada.
