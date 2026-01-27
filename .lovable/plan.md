
# Plano: Corrigir Calculo de Dias Restantes para Orcamentos Personalizados Multi-Mes

## Problema Identificado

O calculo de dias restantes para orcamentos personalizados esta incorreto quando o periodo cruza meses diferentes. O codigo atual usa apenas o dia do mes (`endDate.getDate()`) ao inves de calcular a diferenca real entre as datas.

**Exemplo do bug:**
- Orcamento personalizado: 25/01/2026 a 28/02/2026
- Hoje: 26/01/2026
- Calculo errado: `28 - 26 + 1 = 3 dias`
- Calculo correto: `34 dias` (de 26/01 ate 28/02)

## Arquivos Afetados

### 1. src/workers/metaReviews.worker.ts (PRINCIPAL)
Funcao `calculateBudget` nas linhas 23-69

**Codigo com bug:**
```typescript
if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
  budgetStartDay = startDate.getDate();
  budgetEndDay = endDate.getDate(); // BUG: ignora mes diferente
}
const remainingDays = Math.max(budgetEndDay - currentDay + 1, 1);
```

**Correcao:**
Substituir toda a logica de calculo de dias restantes para usar diferenca real entre datas:

```typescript
const calculateBudget = (input: {...}) => {
  const now = new Date();
  let remainingDays: number;
  
  if (input.customBudgetStartDate && input.customBudgetEndDate) {
    // Orcamento personalizado: calcular diferenca real entre datas
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(input.customBudgetStartDate);
    const endDate = new Date(input.customBudgetEndDate);
    
    // Se hoje eh antes do inicio, usar periodo completo
    if (today < startDate) {
      const diffTime = endDate.getTime() - startDate.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } 
    // Se hoje eh depois do fim, nao ha dias restantes
    else if (today > endDate) {
      remainingDays = 0;
    } 
    // Calcular dias de hoje ate o fim
    else {
      const diffTime = endDate.getTime() - today.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  } else {
    // Orcamento mensal padrao
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    remainingDays = daysInMonth - currentDay + 1;
  }
  
  remainingDays = Math.max(remainingDays, 1);
  // ... resto do calculo
};
```

### 2. src/components/improved-reviews/hooks/useUnifiedReviewsData.ts (FALLBACK)
Linhas 117-140 - Mesmo bug, mesma correcao

**Codigo com bug (linhas 125-137):**
```typescript
if (customBudgetStartDate && customBudgetEndDate) {
  const startDate = new Date(customBudgetStartDate);
  const endDate = new Date(customBudgetEndDate);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
    budgetStartDay = startDate.getDate();
    budgetEndDay = endDate.getDate(); // BUG
  }
}
const remainingDays = Math.max(budgetEndDay - currentDay + 1, 1);
```

**Correcao:**
Aplicar a mesma logica corrigida, calculando diferenca real entre datas.

---

## Referencia: Codigo Correto Ja Existente

O arquivo `src/utils/budgetCalculations.ts` ja possui a implementacao correta usando `date-fns`:

```typescript
export function calculateRemainingDays(
  customBudgetEndDate?: string,
  customBudgetStartDate?: string
): number {
  const today = startOfDay(new Date());
  
  if (customBudgetEndDate && customBudgetStartDate) {
    const endDate = startOfDay(parseISO(customBudgetEndDate));
    const startDate = startOfDay(parseISO(customBudgetStartDate));
    
    if (isBefore(today, startDate)) {
      return differenceInDays(endDate, startDate) + 1;
    }
    if (isAfter(today, endDate)) {
      return 0;
    }
    return differenceInDays(endDate, today) + 1;
  }
  
  // Logica mensal padrao...
}
```

O Google Ads tambem calcula corretamente em `useGoogleAdsBudgetCalculation.ts`:
```typescript
const timeDiff = endDate.getTime() - today.getTime();
return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
```

---

## Resumo das Alteracoes

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/workers/metaReviews.worker.ts` | Correcao | Alterar `calculateBudget` para usar diferenca real entre datas |
| `src/components/improved-reviews/hooks/useUnifiedReviewsData.ts` | Correcao | Alterar calculo de `remainingDays` no fallback da main thread |

---

## Resultado Esperado

Apos a correcao:
- Orcamento 25/01/2026 a 28/02/2026, hoje 26/01/2026:
  - Antes: 3 dias (errado)
  - Depois: 34 dias (correto)

- O calculo de orcamento diario ideal sera preciso
- Os alertas de ajuste serao exibidos corretamente
- Consistencia com o calculo do Google Ads que ja funciona
