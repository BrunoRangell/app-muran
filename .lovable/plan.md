
# Plano: Adicionar Indicador Visual "(Até ontem)" no Gasto Atual

## Alteração

Modificar o texto "Gasto atual" para "Gasto atual (até ontem)" no componente de card de orçamento circular, deixando claro para o usuário que o valor exibido é baseado apenas nos dias 100% completos.

## Arquivo a Modificar

**src/components/improved-reviews/clients/CircularBudgetCard.tsx**

Linha 565:
```tsx
// De:
<p className="text-xs text-gray-500 mb-1">Gasto atual</p>

// Para:
<p className="text-xs text-gray-500 mb-1">Gasto atual <span className="text-gray-400">(até ontem)</span></p>
```

## Resultado Visual

O texto ficará assim:
- **Gasto atual** (até ontem)

Onde "(até ontem)" aparecerá em um tom de cinza mais claro para indicar que é uma informação complementar, não o rótulo principal.

## Por que isso é importante?

Agora que o cálculo usa o gasto confirmado até ontem (não incluindo o parcial de hoje), essa indicação visual:
1. Deixa transparente a metodologia de cálculo
2. Evita confusão quando o usuário comparar com o valor no painel do Meta
3. Explica por que o "gasto atual" pode parecer menor que o esperado durante o dia
