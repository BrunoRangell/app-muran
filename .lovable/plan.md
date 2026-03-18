

# Corrigir salvamento do ID da conta na página de orçamentos

## Problema
Na mutation de salvar (linha 322-333 de `useBudgetSetup.ts`), ao atualizar contas existentes, o código só salva `budget_amount` e ignora `account_id`. Qualquer alteração no ID da conta (incluindo apagar) é descartada.

## Solução
No bloco `else` (contas existentes), incluir `account_id` no update do Supabase:

```typescript
// Linha 324-328 de useBudgetSetup.ts
const { error } = await supabase
  .from("client_accounts")
  .update({
    account_id: values.account_id?.trim() || "",
    budget_amount: budgetAmount
  })
  .eq("id", accountId);
```

## Arquivo editado
- `src/components/daily-reviews/hooks/useBudgetSetup.ts` — adicionar `account_id` ao update de contas existentes

