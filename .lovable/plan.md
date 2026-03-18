

# Corrigir erro ao cadastrar conta quando já existe registro vazio

## Problema
Quando o usuário apagou os números do Aracuri Google em "orçamentos" e salvou, ficou um registro na tabela `client_accounts` com `account_id` vazio, `is_primary: true`, plataforma `google`. Agora ao tentar cadastrar uma nova conta pelo card "Nenhuma conta cadastrada", o INSERT falha porque:
1. Já existe um registro `is_primary: true` para esse `client_id + platform` (constraint `unique_primary_per_platform`)
2. Já existe um registro com `account_id = ""` para essa platform (constraint `unique_account_per_platform`)

Além disso, o erro exibe `[object Object]` porque `String(error)` não serializa o erro do Supabase corretamente.

## Solução

### 1. `src/components/improved-reviews/clients/CircularBudgetCard.tsx`
Na mutation `registerAccountMutation`, antes de inserir, fazer um **upsert**: verificar se já existe um registro para esse `client_id + platform` com `account_id` vazio e, se sim, **atualizar** esse registro em vez de inserir um novo.

```typescript
mutationFn: async (data) => {
  // Verificar se já existe registro vazio para este client+platform
  const { data: existing } = await supabase
    .from("client_accounts")
    .select("id")
    .eq("client_id", client.id)
    .eq("platform", data.platform)
    .maybeSingle();

  if (existing) {
    // Atualizar registro existente
    const { error } = await supabase
      .from("client_accounts")
      .update({
        account_id: data.accountId,
        account_name: data.accountName,
        budget_amount: data.budgetAmount,
        status: 'active'
      })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    // Inserir novo
    const { error } = await supabase
      .from("client_accounts")
      .insert({ ... });
    if (error) throw error;
  }
}
```

### 2. Corrigir exibição do erro
Trocar `String(error)` por `error?.message || JSON.stringify(error)` no `onError` para mostrar a mensagem real em vez de `[object Object]`.

### Arquivos editados
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

