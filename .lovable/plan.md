

# Plano: Detalhar "Diário Atual" com breakdown por campanha

## Problema
O valor "Diário atual" no card é um número agregado (soma de todos os orçamentos de campanhas ativas). Não há como saber quais campanhas compõem esse valor.

## Solução

### 1. Adicionar coluna JSONB em `budget_reviews`
Nova coluna `campaign_budgets` para armazenar o detalhamento:
```sql
ALTER TABLE budget_reviews ADD COLUMN campaign_budgets jsonb DEFAULT '[]'::jsonb;
```
Formato: `[{ "name": "Campanha X", "budget": 50.00, "source": "campaign" }, { "name": "Adset Y", "budget": 30.00, "source": "adset" }]`

### 2. Edge Function `unified-meta-review/meta-api.ts`
Coletar detalhes de cada campanha/adset durante o cálculo do `daily_budget` (já itera sobre eles). Montar array e retornar junto com `daily_budget`. Propagar até o upsert em `budget_reviews`.

### 3. Edge Function `daily-google-review`
Mesma lógica: ao iterar campanhas Google, coletar nome e budget individual e salvar no campo `campaign_budgets`.

### 4. UI: Popover no "Diário atual" do `CircularBudgetCard.tsx`
Ao clicar/hover no valor "Diário atual", abrir um Popover listando cada campanha e seu orçamento individual. Similar ao padrão já usado para "Status das Campanhas" (linhas 460-506 do mesmo arquivo).

```text
┌─────────────────────────────┐
│ Diário atual: R$ 150,00  ℹ │  ← clicável
└─────────────────────────────┘
        ↓ Popover
┌─────────────────────────────┐
│ Composição do orçamento     │
│                             │
│ Campanha A        R$ 80,00  │
│ Campanha B        R$ 40,00  │
│   └ Adset B1      R$ 20,00 │
│   └ Adset B2      R$ 20,00 │
│ Campanha C        R$ 30,00  │
│─────────────────────────────│
│ Total             R$ 150,00 │
└─────────────────────────────┘
```

### 5. Arquivos impactados
- **Migration SQL**: nova coluna `campaign_budgets`
- **`supabase/functions/unified-meta-review/meta-api.ts`**: coletar e retornar detalhes
- **`supabase/functions/unified-meta-review/types.ts`**: adicionar tipo
- **`supabase/functions/unified-meta-review/individual.ts`** e **`budget-calculation.ts`**: propagar campo
- **`supabase/functions/daily-google-review/index.ts`**: coletar detalhes Google
- **`src/components/improved-reviews/clients/CircularBudgetCard.tsx`**: Popover com breakdown
- **`src/components/improved-reviews/hooks/useUnifiedReviewsData.ts`**: incluir `campaign_budgets` no select
- **`src/workers/metaReviews.worker.ts`**: propagar campo

