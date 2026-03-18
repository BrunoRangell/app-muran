

# Ajustes de Layout no CircularBudgetCard

## Problemas identificados

1. **Orçamento coberto pelo círculo**: O grid `grid-cols-3` na linha 566 faz o texto "R$ 100.400,00" (col 1) invadir o espaço do círculo (col 2) quando o valor é grande, pois `text-lg font-bold` não tem truncamento.

2. **"Ver saldo" muito junto**: Na seção de saldo (linhas 378-399), o "Saldo da Conta", "Ver saldo" e o badge "Pré-paga" estão todos na mesma linha com `justify-between`, ficando apertados em cards menores.

3. **Encavalamento em telas pequenas**: O grid `grid-cols-3 gap-4` (linha 566) nunca quebra — em cards estreitos, as 3 colunas ficam comprimidas.

## Soluções

### 1. Grid principal responsivo (linha 566)
- Trocar `grid grid-cols-3 gap-4` por um layout que empilhe em cards pequenos
- Usar `flex flex-wrap` ou `grid grid-cols-2` com o círculo centralizado em cima
- Layout: círculo + percentual no topo centralizado, depois as infos em 2 colunas abaixo

### 2. Orçamento sem overflow
- Reduzir fonte do valor de `text-lg` para `text-base` 
- Adicionar `truncate` ou `whitespace-nowrap` para evitar quebra

### 3. Seção de saldo — espaçamento
- Separar "Ver saldo" e badge "Pré-paga" em uma linha própria abaixo do título "Saldo da Conta"
- Layout: linha 1 = ícone + "Saldo da Conta", linha 2 = "Ver saldo" link + badge

## Arquivo editado
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

