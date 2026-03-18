

# Reorganizar métricas do card de orçamento

## Layout proposto

A seção de métricas (grid após a barra de progresso) será reorganizada:

```text
┌─────────────────────────────────────────┐
│ Orçamento mensal          Gasto atual   │
│ R$ 5.000,00               R$ 2.300,00  │
│ (Original R$5.700 | Tributo R$692)     (até ontem)
│                                         │
├─────────────────────────────────────────┤
│         Dias restantes: 15 dias         │  ← largura total, destaque
├─────────────────────────────────────────┤
│ Diário atual              Diário ideal  │  ← lado a lado
│ R$ 180,00                 R$ 200,00     │
└─────────────────────────────────────────┘
```

## Mudanças em `CircularBudgetCard.tsx` (linhas 656-785)

### 1. Orçamento mensal (1ª posição, col esquerda)
- Manter onde está. Reorganizar info de tributos: quando `considerTaxes` ativo, mostrar o valor efetivo como principal e abaixo uma linha limpa tipo `"R$ 5.700 - R$ 692 tributos"` em vez do formato atual com pipes.

### 2. Gasto atual (2ª posição, col direita)
- Já está na posição correta, sem mudança.

### 3. Dias restantes (3ª posição, largura total)
- Mover para fora do grid de 2 colunas, usando `col-span-2` ou um div separado com fundo sutil (ex: `bg-gray-50 rounded p-2`) e texto centralizado ou distribuído, dando mais destaque visual.

### 4 e 5. Diário atual e Diário ideal (lado a lado)
- Colocar ambos na mesma linha do grid 2 colunas, sempre visíveis (remover a condição que oculta "diário ideal" quando igual ao atual — ou mantê-la mas garantir alinhamento). Unificar a lógica Meta/Google para que ambas as métricas apareçam lado a lado independente da plataforma.

### Alinhamento geral
- Labels (`text-xs text-gray-500`) e valores (`text-sm font-semibold`) com espaçamento consistente (`mb-0.5` nos labels).
- Sem aumento significativo de altura — a reorganização apenas redistribui o que já existe.

### Arquivo editado
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx` (linhas ~656-785)

