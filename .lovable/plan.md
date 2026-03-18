
Objetivo: corrigir o cálculo de “dias restantes” do Meta para orçamentos personalizados ativos, mantendo o Google como referência correta.

Diagnóstico
- Confirmei no banco que o cliente Rehab Odontologia está com as mesmas datas nos dois canais:
  - Meta: 2026-03-17 até 2026-03-20
  - Google: 2026-03-17 até 2026-03-20
- Portanto, o problema não está nos dados salvos.
- O Google já usa a função compartilhada `calculateRemainingDays()` em `src/components/improved-reviews/hooks/useGoogleAdsData.ts`.
- O Meta ainda usa uma lógica duplicada e antiga em 2 lugares:
  1. `src/workers/metaReviews.worker.ts`
  2. `src/components/improved-reviews/hooks/useUnifiedReviewsData.ts` (fallback na main thread)
- Nesses dois pontos, o código faz `new Date("YYYY-MM-DD")`, o que gera deslocamento de fuso e faz o Meta contar 1 dia a menos em orçamento personalizado.

O que vou implementar
1. Substituir a lógica manual de datas no worker do Meta
- Em `src/workers/metaReviews.worker.ts`, trocar o cálculo com `new Date(...)` por uso da lógica compartilhada baseada em `parseLocalDate` / `calculateRemainingDays`.
- Isso fará o Meta contar o dia de hoje igual ao Google.

2. Corrigir também o fallback do Meta
- Em `src/components/improved-reviews/hooks/useUnifiedReviewsData.ts`, remover a duplicação do cálculo manual e usar a mesma função compartilhada.
- Assim, mesmo se o worker falhar ou não estiver disponível, o resultado continua consistente.

3. Unificar a origem da regra de negócio
- Idealmente, usar também `calculateIdealDailyBudget` no Meta onde fizer sentido, para reduzir chance de divergência futura entre Meta e Google.
- Resultado esperado: uma única regra para “dias restantes” e orçamento ideal.

Validação esperada
- Rehab deve mostrar o mesmo número de dias restantes em Meta e Google.
- Casos a validar:
  - orçamento personalizado ativo: incluir hoje
  - orçamento futuro: usar período completo
  - orçamento encerrado: 0 dias
  - orçamento mensal comum: manter comportamento atual

Arquivos a ajustar
- `src/workers/metaReviews.worker.ts`
- `src/components/improved-reviews/hooks/useUnifiedReviewsData.ts`
- possivelmente reaproveitando `src/utils/budgetCalculations.ts` como fonte única da regra

Resultado esperado
- Meta e Google passam a exibir exatamente o mesmo “dias restantes” para o mesmo intervalo personalizado.
- O bug deixa de depender de timezone e não volta no fallback.