

# Corrigir detecção de "sem conta" para clientes com registro vazio

## Problema
O `useGoogleAdsData` (e possivelmente `useUnifiedReviewsData`) verifica se existem registros em `client_accounts`, mas não valida se o `account_id` está preenchido. Se um cliente como "Aracuri" tem um registro na tabela `client_accounts` para Google com `account_id` vazio (ex: `""`), o código na linha 218 entra no branch `clientAccounts.length > 0` e marca `hasAccount: true`. Resultado: card com métricas zeradas em vez do aviso "Nenhuma conta cadastrada".

## Solução

### `src/components/improved-reviews/hooks/useGoogleAdsData.ts`
Filtrar contas com `account_id` vazio antes de processar:

```typescript
// Linha ~216
const clientAccounts = (accountsByClient.get(client.id) || [])
  .filter(acc => acc.account_id && acc.account_id.trim() !== '');
```

Isso garante que registros com ID vazio sejam ignorados, fazendo o cliente cair no branch `hasAccount: false` e exibir o card correto.

### `src/components/improved-reviews/hooks/useUnifiedReviewsData.ts`
Aplicar o mesmo filtro na lógica equivalente para Meta, para consistência. Preciso verificar onde as contas são iteradas e adicionar o mesmo filtro de `account_id` não-vazio.

## Resultado
Clientes com registros de conta sem ID preenchido mostrarão o card "Nenhuma conta cadastrada" com botão de cadastro, em vez de um card com métricas zeradas.

