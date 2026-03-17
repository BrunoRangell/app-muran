

# Responsividade dos Cards na Aba "Todas as Plataformas"

## Problema
Os cards têm `max-w-sm` (384px máximo) e o grid interno das seções usa `md:grid-cols-2 xl:grid-cols-3`, mas como o container pai já divide em 2 colunas (`lg:grid-cols-2`), o espaço disponível por seção é insuficiente — os cards ficam apertados ou com muito espaço vazio.

## Solução

### 1. Remover `max-w-sm` do CircularBudgetCard (linha 281)
- Trocar `max-w-sm` por `w-full` para que o card preencha o espaço disponível no grid
- O grid pai controla quantos cards cabem por linha

### 2. Ajustar grid interno do ClientGroupCard
- Dentro de cada seção de plataforma (que já ocupa metade da tela em `lg`), usar `grid-cols-1` como base — cada card ocupa a largura total da seção
- Para seções com muitas contas, permitir 2 colunas apenas em telas muito largas (`2xl:grid-cols-2`)

### 3. Layout responsivo do container pai
- Manter `grid-cols-1 lg:grid-cols-2` para as seções Meta/Google lado a lado
- Quando um cliente tem apenas uma plataforma, a seção única já ocupa a largura toda naturalmente

## Arquivos editados
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx` — remover `max-w-sm`
- `src/components/improved-reviews/clients/ClientGroupCard.tsx` — ajustar breakpoints do grid interno

