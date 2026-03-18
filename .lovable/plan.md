

# Restaurar ajuste recomendado + melhorar label "dias restantes"

## Problemas identificados

1. **Ajuste recomendado removido**: A caixa verde/vermelha com "Aumentar/Reduzir orçamento por R$ X" foi removida na compactação anterior. Precisa voltar, mas de forma compacta.
2. **"Restante: X dias"** é vago — precisa de um label mais descritivo como "Dias restantes".

## Solução

### 1. Restaurar recomendação de ajuste (compacta, inline)
Em vez da caixa grande anterior, adicionar uma linha compacta entre as métricas e o botão "Analisar". Usar o mesmo estilo do `CompactBudgetRecommendation` existente (fundo verde/vermelho claro, ícone TrendingUp/Down, texto curto):

```
┌─────────────────────────────────────────┐
│ ↑ Aumentar orçamento: +R$ 15,00        │
└─────────────────────────────────────────┘
```

Condição: só aparece quando `needsAdjustment && !warningIgnoredToday`.

Será inserido entre o grid de métricas (linha ~690) e o botão "Analisar" (linha ~693).

### 2. Trocar label "Restante" por "Dias restantes"
Na linha 580, trocar:
```
"Restante" → "Dias restantes"
```

## Arquivo editado
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

