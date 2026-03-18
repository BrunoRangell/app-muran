

# Corrigir datas UTC em orçamentos personalizados

## Problema 1: Modal de edição mostra datas 1 dia a menos
**Causa**: Em `CustomBudgetDialog.tsx` (linha 37-38), `new Date("2026-03-18")` interpreta a string como UTC midnight, que no fuso do Brasil (UTC-3) vira dia 17 às 21h.

**Correção**: Usar `parseLocalDate` de `@/utils/dateHelpers` em vez de `new Date()`:
```typescript
start_date: parseLocalDate(budget.start_date),
end_date: parseLocalDate(budget.end_date),
```

## Problema 2: Meta calcula 1 dia a menos nos dias restantes
**Causa**: Em `budgetCalculations.ts` (linhas 15-16), `parseISO` também cria datas UTC, causando a mesma distorção. `differenceInDays` entre uma data UTC e uma data local gera resultado errado.

**Correção**: Substituir `parseISO` por `parseLocalDate` em `calculateRemainingDays` e `isCustomBudgetActive`:
```typescript
import { parseLocalDate } from "@/utils/dateHelpers";

const endDate = startOfDay(parseLocalDate(customBudgetEndDate));
const startDate = startOfDay(parseLocalDate(customBudgetStartDate));
```

## Arquivos editados
1. `src/components/improved-reviews/tabs/components/CustomBudgetDialog.tsx` — usar `parseLocalDate`
2. `src/utils/budgetCalculations.ts` — trocar `parseISO` por `parseLocalDate`

