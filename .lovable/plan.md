## Problema

Na aba **Todas as plataformas**, o filtro "Ajuste de orçamento" mostra clientes que aparecem como **OK** (verde, "Sem ação necessária") no card.

A causa é uma divergência entre dois pontos do código:

- **Card `CircularBudgetCard`** recalcula `needsAdjustment` levando em conta:
  - `considerTaxes` (tributos 12,15% → reduz orçamento efetivo, recalcula diário ideal).
  - `budgetCalculationMode` (`weighted` usa média ponderada no Google em vez do diário atual).
  - `warningIgnoredToday` (se o aviso foi ocultado, o card vira cinza/“Ajuste ocultado hoje”).
- **`useAllPlatformsData.matchesFilter`** usa o `d.needsAdjustment` cru vindo de `useUnifiedReviewsData`/`useGoogleAdsData`, calculado sempre com tributos desligados, sem média ponderada e sem considerar o "ignorar aviso".

Resultado: clientes ficam OK no card mas continuam batendo no filtro.

## Solução

Reaproveitar exatamente a mesma lógica do card dentro do `matchesFilter` do hook `useAllPlatformsData`, e também aplicar a mesma correção no `ClientsList` (Meta/Google) para manter consistência.

### Passos

1. **Extrair helper** `computeNeedsAdjustment(client, platform, { considerTaxes, budgetCalculationMode })` em um arquivo utilitário novo (`src/components/improved-reviews/utils/needsAdjustment.ts`), replicando:
   ```text
   TAX_RATE = 0.1215
   effectiveBudget = considerTaxes ? budget * (1 - TAX_RATE) : budget
   idealDailyBudget = considerTaxes
     ? max(effectiveBudget - spent, 0) / max(remainingDays, 1)
     : client.budgetCalculation.idealDailyBudget
   comparisonValue = (platform === "google" && mode === "weighted" && weightedAverage > 0)
     ? weightedAverage
     : client.review.daily_budget_current
   needsAdjustment = abs(idealDailyBudget - comparisonValue) >= 5
   ```
   E também devolver `warningIgnoredToday` (de `client.budgetCalculation?.warningIgnoredToday`) para o filtro descartar quem ocultou o aviso.

2. **Usar o helper em `CircularBudgetCard.tsx`** no lugar do cálculo inline (mesma fórmula, só centralizada — sem mudança visual).

3. **Atualizar `useAllPlatformsData.ts`**:
   - Passar `considerTaxes` e `budgetCalculationMode` para `matchesFilter`.
   - No case `"adjustments"`: retornar `helper.needsAdjustment && !helper.warningIgnoredToday`.
   - Recalcular `clientsNeedingAdjustment` da seção de métricas usando o helper para refletir o que o filtro mostra.

4. **Atualizar `ClientsList.tsx`** (abas Meta/Google) para o filtro `"adjustments"` usar o mesmo helper, mantendo a paridade com o card.

5. **Validar** abrindo `/revisao-diaria-avancada#all-platforms`, ativando "Ajuste de orçamento" com tributos ligados/desligados e modo ponderado/atual, e conferindo que só aparecem cards âmbar (não verdes nem cinzas).

## Fora do escopo

- Sem mudança visual nos cards.
- Sem mudanças nos demais filtros (campanhas, sem conta, saldo).
- Sem alteração em edge functions ou banco.
