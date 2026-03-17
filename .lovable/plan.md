

# Diagnóstico: "Status das Campanhas" não aparece para alguns clientes

## Causa raiz

Em `supabase/functions/unified-meta-review/campaigns.ts` (linha 131-137), a função `updateCampaignHealth` faz:

```ts
.from('client_accounts')
.eq('client_id', clientId)
.eq('platform', 'meta')
.eq('status', 'active')
.single()  // ← PROBLEMA
```

Ford Amazon tem **duas contas Meta** (cnpjCaxias e cnpjSCS). O `.single()` retorna erro quando há múltiplas linhas, então a função aborta silenciosamente e **nenhuma** das duas contas recebe dados de `campaign_health`.

Clientes com apenas uma conta Meta funcionam normalmente — por isso a maioria mostra o badge.

## Solução

### `supabase/functions/unified-meta-review/campaigns.ts`

A função já recebe `accountId` como parâmetro (o account_id do Meta, ex: `3382384108459221`), mas não o usa. Corrigir para:

1. Adicionar filtro `.eq('account_id', accountId)` na query, tornando o resultado único sem depender de `.single()` para clientes com múltiplas contas
2. Manter `.single()` pois agora será de fato único

```ts
const { data: accountData, error: accountError } = await supabase
  .from('client_accounts')
  .select('id, account_id')
  .eq('client_id', clientId)
  .eq('account_id', accountId)   // ← ADICIONAR
  .eq('platform', 'meta')
  .eq('status', 'active')
  .single();
```

Isso é uma correção de uma linha. Após deploy, a próxima revisão do Ford Amazon criará os registros de `campaign_health` para ambas as contas.

## Arquivos impactados
- **`supabase/functions/unified-meta-review/campaigns.ts`**: adicionar filtro por `accountId` na query (1 linha)

