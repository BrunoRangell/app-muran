

# Alinhar seções dos cards Google com Meta

## O que mudar

No `CircularBudgetCard.tsx`, adicionar uma seção de "Saldo da Conta" para Google Ads no mesmo local onde Meta exibe o saldo (linhas 465-542). A seção do Google mostrará um aviso de "Visualização de saldo indisponível" com o mesmo estilo visual (fundo, borda, ícone), mantendo a altura consistente.

## Mudança concreta

Após a seção de saldo do Meta (linha 542), adicionar um bloco equivalente para Google:

```tsx
{/* Placeholder de Saldo para Google Ads */}
{platform === "google" && (
  <div className="mb-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
    <div className="flex items-center gap-2">
      <BadgeDollarSign className="h-3.5 w-3.5 text-gray-400" />
      <span className="text-xs font-medium text-gray-500">Saldo da Conta</span>
    </div>
    <span className="text-xs text-gray-400 mt-1 block">
      Visualização de saldo indisponível
    </span>
  </div>
)}
```

A seção de campanhas do Google (linhas 592-638) já está na mesma posição relativa que a do Meta, então nenhuma outra mudança de ordem e necessária. Apenas o placeholder de saldo resolve o desalinhamento.

## Arquivo editado
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

