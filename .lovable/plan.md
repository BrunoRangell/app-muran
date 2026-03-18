

# Dois ajustes no CircularBudgetCard

## 1. Mostrar estado "OK" verde quando não precisa de ajuste

Atualmente, a caixa de ajuste recomendado (linhas 694-706) só aparece quando `needsAdjustment && !warningIgnoredToday`. Quando o orçamento está OK, nada aparece.

**Solução**: Trocar a condição para sempre mostrar a caixa:
- **Precisa ajuste** → vermelho (tanto aumentar quanto reduzir), com ícone TrendingUp/TrendingDown
- **Sem ajuste necessário** → verde, com ícone CheckCircle e texto "Orçamento OK"

Também ajustar as cores: atualmente quando `budgetDifference > 0` (aumentar) usa verde e reduzir usa vermelho. Pela solicitação, **ambos os casos de ajuste devem ser vermelho** (pois indicam que algo precisa mudar), e **verde = tudo OK**.

```tsx
// Substituir o bloco linhas 694-706:
{needsAdjustment && !warningIgnoredToday ? (
  <div className="mt-2 p-1.5 rounded-md flex items-center gap-2 text-xs font-medium bg-red-50 text-red-700 border border-dashed border-red-200">
    {budgetDifference > 0 ? <TrendingUp /> : <TrendingDown />}
    <span>{budgetDifference > 0 ? "Aumentar" : "Reduzir"} orçamento: ...</span>
  </div>
) : !warningIgnoredToday ? (
  <div className="mt-2 p-1.5 rounded-md flex items-center gap-2 text-xs font-medium bg-green-50 text-green-700 border border-dashed border-green-200">
    <CheckCircle className="h-3.5 w-3.5" />
    <span>Orçamento OK</span>
  </div>
) : null}
```

## 2. Card simplificado para clientes sem conta

Quando `client.hasAccount === false`, mostrar um card minimalista: apenas nome da empresa, badge da plataforma, e um botão "Cadastrar conta" que leva à página de edição do cliente.

**Solução**: No `CircularBudgetCard`, logo no início do return (linha 278), adicionar um early return para clientes sem conta:

```tsx
if (!client.hasAccount) {
  return (
    <Card className="w-full bg-gray-50 border-gray-200 border-2">
      <CardContent className="p-3 flex flex-col items-center justify-center text-center py-8">
        <h3 className="font-semibold text-gray-900 text-sm">{companyName}</h3>
        <Badge>Meta/Google</Badge>
        <p className="text-xs text-gray-400 mt-2">Nenhuma conta cadastrada</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={...}>
          Cadastrar conta
        </Button>
      </CardContent>
    </Card>
  );
}
```

O botão abrirá `/clients/{client.id}` (página de edição do cliente) em nova aba.

## Arquivo editado
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

