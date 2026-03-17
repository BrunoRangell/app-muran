
Problema confirmado: o backend do Google Ads está funcionando, mas o frontend da aba Google não está trazendo esse detalhamento.

O que verifiquei:
- Os logs da edge function `daily-google-review` mostram `googleCampaignBudgets` preenchido.
- O banco também confirma isso: já existem revisões Google com `campaign_budgets` contendo campanhas.
- O componente `CircularBudgetCard` já tenta renderizar `client.review?.campaign_budgets`.
- A quebra está em `src/components/improved-reviews/hooks/useGoogleAdsData.ts`: a query de `budget_reviews` para Google não seleciona `campaign_budgets`, e o objeto `review` retornado ao card também não inclui esse campo.

Plano de correção:
1. Atualizar `useGoogleAdsData.ts`
   - Incluir `campaign_budgets` no `.select(...)` da query em `budget_reviews`
   - Propagar `campaign_budgets` dentro de `review` no objeto retornado para cada cliente

2. Ajustar tipagem local
   - Expandir a interface `GoogleAdsClientData.review` para incluir `campaign_budgets`
   - Preferencialmente tipar como array de itens com `name`, `budget`, `source`

3. Validar compatibilidade
   - Garantir que o popover do Google use exatamente o mesmo shape salvo no banco
   - Manter fallback “Detalhamento não disponível” só para revisões antigas ou contas sem composição salva

4. Resultado esperado
   - Após a correção, os clientes Google que já têm `campaign_budgets` salvos passarão a mostrar as campanhas no popover sem depender de nova revisão

Detalhe técnico:
Hoje a query Google está assim, sem o campo necessário:
```ts
.select('client_id, account_id, total_spent, daily_budget_current, last_five_days_spent, custom_budget_amount, using_custom_budget, warning_ignored_today, review_date')
```

Ela precisa incluir `campaign_budgets`, e depois o retorno precisa montar:
```ts
review: {
  total_spent,
  daily_budget_current,
  campaign_budgets: latestReview?.campaign_budgets || []
}
```

Impacto:
- Sem mudança de banco
- Sem mudança na edge function
- Correção pequena e localizada no hook de dados da aba Google

<lov-actions>
<lov-suggestion message="Teste isso ponta a ponta na aba Google Ads e verifique se o popover do orçamento agora lista as campanhas salvas no banco.">Verifique ponta a ponta</lov-suggestion>
<lov-suggestion message="Implemente a correção no useGoogleAdsData para incluir campaign_budgets na query e no objeto review retornado ao CircularBudgetCard.">Corrigir carregamento do Google</lov-suggestion>
<lov-suggestion message="Padronize os tipos de campaign_budgets entre Meta e Google para evitar divergências futuras no popover de composição do orçamento.">Padronizar tipagem</lov-suggestion>
</lov-actions>
