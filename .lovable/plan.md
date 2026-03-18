

# Reduzir altura vertical dos cards

## Mudanças

### 1. Trocar círculo por barra de progresso horizontal
O SVG circular (80x80px + margin) ocupa ~100px de altura. Substituir por uma barra horizontal fina com o percentual ao lado, economizando ~70px verticais.

**Linhas 568-580** — substituir o bloco do círculo por:
```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${statusInfo.barColor}`} 
         style={{ width: `${Math.min(spentPercentage, 100)}%`, transition: "width 0.5s ease-in-out" }} />
  </div>
  <span className={`text-sm font-bold ${statusInfo.textColor} whitespace-nowrap`}>
    {Math.round(spentPercentage)}%
  </span>
</div>
```

Adicionar `barColor` ao `getStatusInfo()`:
- warning: `bg-amber-500`
- ok: `bg-emerald-500`  
- ignored: `bg-gray-400`

### 2. Remover texto "Aumentar/Reduzir orçamento" do badge de status
**Linha 146** — trocar `"Aumentar orçamento"` / `"Reduzir orçamento"` por simplesmente o valor com sinal:
```tsx
status: budgetDifference > 0 
  ? `+${formatCurrency(Math.abs(budgetDifference))}` 
  : `-${formatCurrency(Math.abs(budgetDifference))}`,
```

O badge já tem cor verde/âmbar que indica a direção, e o sinal +/- complementa.

## Arquivo editado
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

