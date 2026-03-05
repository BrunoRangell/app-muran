

# Plano: Toggle "Considerar Tributos" na Revisao Meta Ads

## Resumo

Adicionar um toggle na barra de filtros do Meta Ads que, quando ativo, desconta 12.15% do orcamento mensal de cada cliente. O calculo do diario ideal se adapta automaticamente. No card, exibir o valor do imposto e o orcamento original de forma sutil.

## Arquivos a Modificar

### 1. `src/components/improved-reviews/filters/FilterBar.tsx`

Adicionar nova prop `considerTaxes` e `onConsiderTaxesChange` ao componente. Renderizar um toggle dentro da secao de filtros do Meta Ads:

```tsx
// Novas props:
considerTaxes?: boolean;
onConsiderTaxesChange?: (value: boolean) => void;

// Novo toggle no bloco Meta Ads (apos os ToggleGroupItems existentes):
{onConsiderTaxesChange && (
  <div className="flex items-center space-x-2 ml-auto">
    <Switch checked={considerTaxes} onCheckedChange={onConsiderTaxesChange} />
    <Label className="text-xs text-muted-foreground cursor-pointer">
      Considerar tributos (12,15%)
    </Label>
  </div>
)}
```

### 2. `src/components/improved-reviews/tabs/MetaAdsTab.tsx`

Adicionar estado `considerTaxes` e passa-lo para `FilterBar` e `ClientsList`:

```tsx
const [considerTaxes, setConsiderTaxes] = useState(false);

// Passar para FilterBar:
considerTaxes={considerTaxes}
onConsiderTaxesChange={setConsiderTaxes}

// Passar para ClientsList:
considerTaxes={considerTaxes}
```

### 3. `src/components/improved-reviews/clients/ClientsList.tsx`

Receber prop `considerTaxes` e repassa-la para cada `ClientCard` / `CircularBudgetCard`.

### 4. `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

Receber prop `considerTaxes`. Quando ativo:

- Calcular `effectiveBudget = budgetAmount * (1 - 0.1215)` e usar no lugar de `budgetAmount` para:
  - Porcentagem do grafico circular
  - Calculo do diario ideal (recalcular localmente)
- Na exibicao do orcamento, mostrar informacao do tributo:

```tsx
<div>
  <p className="text-xs text-gray-500 mb-1">Orcamento</p>
  <p className="text-lg font-bold text-gray-900">
    {formatCurrency(considerTaxes ? effectiveBudget : budgetAmount)}
  </p>
  {considerTaxes && (
    <div className="text-[10px] text-gray-400 leading-tight">
      <span>Original: {formatCurrency(budgetAmount)}</span>
      <span className="mx-1">|</span>
      <span>Tributo: {formatCurrency(budgetAmount * 0.1215)}</span>
    </div>
  )}
</div>
```

- Recalcular `idealDailyBudget` localmente quando `considerTaxes` estiver ativo:

```tsx
const effectiveBudget = considerTaxes ? budgetAmount * (1 - 0.1215) : budgetAmount;
const spentPercentage = effectiveBudget > 0 ? (spentAmount / effectiveBudget) * 100 : 0;
const adjustedIdealDaily = considerTaxes
  ? Math.max(effectiveBudget - spentAmount, 0) / Math.max(remainingDays, 1)
  : idealDailyBudget;
```

## Fluxo de Dados

```text
MetaAdsTab (estado: considerTaxes)
  -> FilterBar (toggle visual)
  -> ClientsList (repasse)
     -> CircularBudgetCard (calculo e exibicao)
```

## O que NAO muda

- Nenhuma alteracao no backend/edge function
- Nenhuma alteracao no banco de dados
- O calculo original permanece intacto; o ajuste de tributos e puramente visual/front-end
- Google Ads nao e afetado

