

# Plano: Filtrar orçamento personalizado por conta no frontend

## Problema

O mapa `customBudgetsByClientId` indexa orçamentos personalizados apenas por `client_id`. Quando um orçamento é vinculado a uma conta específica (ex: Ford Amazon conta A), o frontend aplica esse orçamento a **todas** as contas do cliente (conta A e conta B). Isso acontece em dois arquivos que processam os dados de revisão.

## Causa raiz

Em `useUnifiedReviewsData.ts` (linha 53-56) e `metaReviews.worker.ts` (linha 165-168):
```ts
customBudgetsByClientId.set(budget.client_id, budget);
```
Ignora completamente `budget.account_id`. Na hora de aplicar (linhas 108-115 / 218-225), não verifica se o orçamento pertence à conta específica sendo processada.

## Solução

### 1. `src/components/improved-reviews/hooks/useUnifiedReviewsData.ts`

Alterar a lógica de lookup do mapa (linhas 53-56 e 108-115):

- Indexar budgets por chave composta `client_id + account_id` **e** por `client_id` (para budgets globais com `account_id = null`)
- Na hora de aplicar, buscar primeiro por conta específica, depois fallback para global

```ts
// Criar mapa com prioridade: específico da conta > global do cliente
const specificBudgets = new Map(); // key: client_id_account_id
const globalBudgets = new Map();   // key: client_id (account_id is null)

activeCustomBudgets.forEach(budget => {
  if (budget.account_id) {
    specificBudgets.set(`${budget.client_id}_${budget.account_id}`, budget);
  } else {
    globalBudgets.set(budget.client_id, budget);
  }
});

// Na aplicação (dentro do loop de accounts):
const specificKey = `${client.id}_${account.id}`;
const matchingBudget = specificBudgets.get(specificKey) || globalBudgets.get(client.id);

if (matchingBudget) {
  // aplicar orçamento
}
```

### 2. `src/workers/metaReviews.worker.ts`

Mesma alteração (linhas 165-168 e 218-225): replicar a lógica de prioridade específico > global.

## Impacto

- Orçamento vinculado à conta A aparece **apenas** no card da conta A
- Orçamento global (sem conta específica) continua aparecendo para todas as contas
- Nenhuma alteração no backend necessária

