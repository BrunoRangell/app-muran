

# Plano: Corrigir ajustes no Google Ads para respeitar modo de cálculo

## Problema

No `CircularBudgetCard.tsx` (linhas 89-92), o cálculo local de `budgetDifference` e `needsAdjustment` **sempre usa `currentDailyBudget`**, ignorando o `budgetCalculationMode`:

```tsx
// Linha 90-92 atual:
const budgetDifference = idealDailyBudget - currentDailyBudget; // ← sempre "orç. atual"
const needsAdjustment = Math.abs(budgetDifference) >= 5;
```

O hook `useGoogleAdsData` calcula corretamente baseado no modo, mas o card sobrescreve esse valor.

## Solução

### `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

Alterar linhas 89-92 para usar `weightedAverage` quando o modo for "weighted" no Google Ads:

```tsx
// Para Google Ads no modo "weighted", comparar com média ponderada
const comparisonValue = (platform === "google" && budgetCalculationMode === "weighted" && weightedAverage > 0)
  ? weightedAverage
  : currentDailyBudget;

const budgetDifference = idealDailyBudget - comparisonValue;
const needsAdjustment = Math.abs(budgetDifference) >= 5;
```

Isso garante que:
- Os cards mostrem o ajuste correto baseado no modo selecionado
- O filtro "Ajuste de orçamento" funcione corretamente (pois `client.needsAdjustment` do hook já está correto, e agora o card visual também reflete o mesmo)

