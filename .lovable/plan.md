

# Corrigir dias restantes no Google Ads + Alinhar layout dos cards

## Problema 1: Dias restantes divergentes

**Causa raiz**: No `useGoogleAdsData.ts` (linha 213), os dias restantes são sempre calculados como `daysInMonth - currentDay + 1` (até fim do mês), ignorando completamente orçamentos personalizados. Já o Meta usa `calculateRemainingDays()` que considera datas customizadas.

**Correção** em `src/components/improved-reviews/hooks/useGoogleAdsData.ts`:
- Importar `calculateRemainingDays` e `calculateIdealDailyBudget` de `@/utils/budgetCalculations`
- Dentro do loop de accounts (linha ~220-260), verificar se o review tem `using_custom_budget` e datas customizadas
- Se sim, usar `calculateRemainingDays(customEndDate, customStartDate)` em vez do cálculo fixo mensal
- Recalcular `idealDailyBudget` usando a mesma função utilitária

Linhas afetadas: ~210-260.

## Problema 2: Desalinhamento vertical entre cards

**Causa**: Cards de Meta com tributos ativos exibem uma linha extra (breakdown de tributos) que empurra "Dias restantes" e "Diário" para baixo. Cards Google não têm essa linha, ficando desalinhados visualmente.

**Recomendação**: Reservar espaço fixo para a área de tributos — quando não há tributos (Google ou Meta sem toggle), renderizar um placeholder invisível com a mesma altura (`min-h-[16px]` ou similar). Isso mantém "Dias restantes" e "Diário" sempre na mesma posição vertical em todos os cards.

**Correção** em `src/components/improved-reviews/clients/CircularBudgetCard.tsx` (linhas ~660-666):
- Trocar o `{considerTaxes && (...)}` condicional por um bloco que sempre ocupa espaço:
```tsx
<div className="min-h-[16px]">
  {considerTaxes && platform === "meta" ? (
    <p className="text-[10px] text-gray-400 leading-tight">
      {formatCurrency(budgetAmount)} − {formatCurrency(taxAmount)} tributos
    </p>
  ) : null}
</div>
```

## Arquivos editados
1. `src/components/improved-reviews/hooks/useGoogleAdsData.ts` — usar `calculateRemainingDays` com datas do orçamento personalizado
2. `src/components/improved-reviews/clients/CircularBudgetCard.tsx` — placeholder de altura fixa para tributos

