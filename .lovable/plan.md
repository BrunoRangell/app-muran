

# Fix: Saldo Baixo Filter + Layout Mais Eficiente

## Problema 1: Saldo Baixo não funciona
O filtro "Saldo baixo" está numa **ToggleGroup separada** da ToggleGroup dos filtros comuns. As duas escrevem no mesmo `activeFilter`, mas como são componentes Radix independentes, há conflito: clicar numa não "desclica" a outra visualmente, e o estado pode ficar inconsistente.

**Solução**: Mover "Saldo baixo" para dentro da mesma ToggleGroup dos filtros comuns (ajuste, campanhas, sem conta). Ele fica com estilo azul diferenciado para indicar que é Meta-específico.

## Problema 2: Cards lado a lado
O `ClientGroupCard` envolve cada cliente num card wrapper grande com seções. Para a aba unificada, mais eficiente é um **grid plano** onde todos os cards aparecem lado a lado, cada um com um pequeno badge de plataforma.

**Solução**: No `AllPlatformsTab`, em vez de renderizar `ClientGroupCard` por cliente, renderizar todos os accounts num grid único e plano usando `ClientCard` diretamente, com um badge de plataforma (azul/amber) no canto de cada card.

## Arquivos editados

1. **`AllPlatformsFilterBar.tsx`** — Mover "Saldo baixo" para a ToggleGroup principal dos filtros comuns; manter seção Meta apenas com switch de tributos e seção Google com base de cálculo.

2. **`AllPlatformsTab.tsx`** — Substituir loop de `ClientGroupCard` por um grid plano: flatten todos os `group.accounts` numa lista, renderizar `ClientCard` diretamente com badge de plataforma em cada um.

3. **`ClientGroupCard.tsx`** — Sem alteração (continua disponível se necessário em outro contexto).

