

# Corrigir gasto total para usar período do orçamento personalizado

## Problema
Quando um orçamento personalizado está ativo (ex: 17/03 a 20/03), o sistema busca o gasto total desde o dia 1 do mês em vez de buscar apenas o gasto entre as datas do orçamento personalizado. Isso faz o "orçamento diário ideal" ficar errado porque inclui gastos fora do período configurado.

## Causa raiz
Ambas as edge functions sempre usam `firstDayOfMonth` como data inicial para buscar gastos:

- **Meta** (`supabase/functions/unified-meta-review/meta-api.ts`, linhas 768-770): `const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)` — ignora o `customBudget` recebido como parâmetro.
- **Google** (`supabase/functions/daily-google-review/index.ts`, linhas 818-819): `const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)` — mesmo problema.

## Correção

### 1. `supabase/functions/unified-meta-review/meta-api.ts` (linhas 764-773)
Quando `customBudget` é passado, usar `customBudget.start_date` como data inicial em vez de `firstDayOfMonth`:

```typescript
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

// Se há orçamento personalizado, usar a data de início dele
const periodStart = customBudget?.start_date
  ? new Date(customBudget.start_date + 'T00:00:00')
  : new Date(today.getFullYear(), today.getMonth(), 1);

const sinceParam = periodStart.toISOString().split('T')[0];
const untilParam = yesterday.toISOString().split('T')[0];

let totalSpent = 0;

if (yesterday < periodStart) {
  console.log(`📅 [META-API] Início do período - gasto confirmado até ontem = R$ 0`);
} else {
  // fetch insights normalmente
}
```

### 2. `supabase/functions/daily-google-review/index.ts` (linhas 817-820)
Mesmo ajuste — usar `customBudget.start_date` quando disponível:

```typescript
// Buscar gasto total do período relevante
const periodStart = customBudget?.start_date
  ? new Date(customBudget.start_date + 'T00:00:00')
  : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

const startDate = periodStart.toISOString().split('T')[0];
const endDate = currentDate.toISOString().split('T')[0];
```

O `customBudget` já está disponível em ambas as funções no escopo onde a alteração será feita.

## Arquivos editados
1. `supabase/functions/unified-meta-review/meta-api.ts` — usar `customBudget.start_date` como início do período de gastos
2. `supabase/functions/daily-google-review/index.ts` — usar `customBudget.start_date` como início do período de gastos

