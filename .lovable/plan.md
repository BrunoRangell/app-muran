
Objetivo: eliminar o erro “Não foi possível revisar este cliente” que agora aparece em revisões Meta e Google.

Diagnóstico (com base nos logs atuais):
1) Meta: o navegador registra `FunctionsFetchError: Failed to fetch` na chamada `unified-meta-review`, mas a Edge Function continua processando no servidor em alguns casos. Ou seja, existe falha de transporte/resposta no cliente (não necessariamente falha de negócio da revisão).
2) Google: há erro real no backend `duplicate key ... unique_review_per_account_date` (23505) em `daily-google-review`, causando falha consistente em parte das revisões.
3) Frontend: `useBatchOperations.reviewClient` captura erro e não propaga; o card ainda imprime “concluída com sucesso” depois de falha, gerando diagnóstico confuso.

Plano de implementação

1. Robustecer revisão individual no frontend
- Arquivo: `src/components/improved-reviews/hooks/useBatchOperations.ts`
- Criar helper de invocação com retry curto para erro transitório de rede (`FunctionsFetchError` / `TypeError Failed to fetch`).
- Se após retry ainda falhar, fazer verificação de confirmação no banco (`budget_reviews` do dia para `client_id + account_id + platform`):
  - Se existir revisão recém-criada, tratar como sucesso (sem toast destrutivo).
  - Se não existir, mostrar erro real.
- Retornar resultado explícito (`{ success: boolean; reason?: string }`) em vez de apenas `void`.

2. Corrigir feedback enganoso no card
- Arquivo: `src/components/improved-reviews/clients/CircularBudgetCard.tsx`
- `handleReviewClick` deve avaliar o retorno de `reviewClient` antes de logar sucesso.
- Não registrar “concluída com sucesso” quando houver falha confirmada.

3. Corrigir conflito de chave única no Google
- Arquivo: `supabase/functions/daily-google-review/index.ts`
- Substituir fluxo frágil de delete + insert por `upsert` em `budget_reviews` com conflito na chave única (conta+data; respeitando a constraint existente).
- Isso elimina erro 23505 em chamadas repetidas/concorrentes.

4. Ajustar escopo de orçamento personalizado por conta nas revisões
- Arquivos:
  - `supabase/functions/unified-meta-review/database.ts`
  - `supabase/functions/daily-google-review/index.ts`
- Ao buscar `custom_budgets`, priorizar:
  - orçamento da conta (`account_id = conta_uuid`),
  - fallback para global do cliente (`account_id is null`).
- Evita efeitos colaterais e mantém consistência com a alteração recente do formulário.

5. Padronizar classificação de erro para UI
- Frontend deve diferenciar:
  - erro de transporte (rede/resposta),
  - erro de negócio/backend (ex.: conflito de chave).
- Mensagem final mais clara para operação (“instabilidade de conexão” vs “falha de processamento”).

Validação (fim a fim):
1) Testar revisão individual Meta em 2 clientes seguidos e confirmar ausência de falso negativo.
2) Testar revisão individual Google repetindo rapidamente no mesmo cliente; não deve haver 23505.
3) Confirmar atualização de `budget_reviews` e invalidação de cache em tela.
4) Verificar Edge logs sem novos erros críticos para `daily-google-review` e `unified-meta-review`.
