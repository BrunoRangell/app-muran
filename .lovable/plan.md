

# Alinhar verticalmente informações iguais entre cards Meta e Google

## Problema
Na screenshot, "Orçamento mensal", "Dias restantes", "Diário atual/ideal" e o botão "Analisar" aparecem em alturas diferentes entre Meta e Google porque o Meta tem seções extras no topo (Saldo da Conta, Campanhas com layout diferente) que empurram tudo para baixo.

## Solução
Usar flexbox com `mt-auto` para empurrar a seção de métricas compartilhadas (de "Orçamento mensal" para baixo) ao fundo do card. Como os cards já estão num CSS grid, eles têm a mesma altura -- basta alinhar o conteúdo interno pelo fundo.

## Mudanças em `CircularBudgetCard.tsx`

1. **Card raiz**: adicionar `h-full` ao `<Card>` (linha 373) para ocupar toda a célula do grid
2. **CardContent**: transformar em flex column com `flex flex-col h-full` (linha 374)
3. **Seção de métricas** (linha 641, `<div className="flex flex-col mb-3">`): adicionar `mt-auto` para empurrar ao fundo

Isso faz com que as seções exclusivas do Meta (saldo, campanhas) fiquem no topo, mas "Orçamento mensal", "Dias restantes", "Diário" e "Analisar" se alinhem na mesma posição vertical em ambos os cards.

## Arquivo editado
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx`

