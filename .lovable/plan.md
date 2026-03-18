

# Cards preenchendo 100% do espaço horizontal do grupo

## Problema
O grid atual usa breakpoints fixos (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), então se um cliente tem 2 contas numa tela `xl`, os 2 cards ocupam metade do espaço e deixam 2 colunas vazias.

## Solução
Usar colunas dinâmicas baseadas no número de contas do cliente. Se o cliente tem 2 contas, cada uma ocupa 50%. Se tem 3, cada uma 33%. Se tem 5+, limitar a 4 colunas para não ficarem estreitos demais.

### `ClientGroupCard.tsx`
- Calcular `cols = Math.min(accounts.length, 4)` 
- Aplicar via `gridTemplateColumns: \`repeat(${cols}, minmax(0, 1fr))\``
- Em telas pequenas (`sm` para baixo), manter empilhamento vertical com classe responsiva

```tsx
const cols = Math.min(sortedAccounts.length, 4);

<div 
  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
  style={{ gridTemplateColumns: undefined }}
  // Em md+, usar colunas dinâmicas via style
>
```

Abordagem com classes Tailwind responsivas + style inline para `md+`:
```tsx
<div 
  className="grid grid-cols-1 gap-3"
  style={{}}
>
```

Na prática, usar um wrapper com media query via className condicional ou simplesmente style inline com CSS que respeita responsividade:

```tsx
const cols = Math.min(sortedAccounts.length, 4);

<div 
  className="grid gap-3" 
  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
>
```

E para telas pequenas, adicionar uma classe `max-sm:!grid-cols-1` para forçar empilhamento.

## Arquivo editado
- `src/components/improved-reviews/clients/ClientGroupCard.tsx`

