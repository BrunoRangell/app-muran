

# Mostrar múltiplos blocos de cliente lado a lado

## Situação atual
Os grupos de clientes estão empilhados verticalmente (`space-y-4`), cada um ocupando 100% da largura. Em telas grandes (1952px), isso desperdiça espaço horizontal — especialmente para clientes com apenas 1-2 contas.

## Solução
Trocar o container dos grupos de `space-y-4` (vertical stack) por um grid responsivo que coloque blocos lado a lado quando houver espaço.

### `AllPlatformsTab.tsx` — linha 85
Substituir:
```tsx
<div className="space-y-4">
```
Por um grid com colunas automáticas que se adaptam ao conteúdo:
```tsx
<div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
```

Isso faz:
- **Mobile/tablet**: 1 coluna (empilhado)
- **md (768px+)**: 2 blocos lado a lado
- **xl (1280px+)**: 3 blocos lado a lado

### `ClientGroupCard.tsx` — ajuste de altura
Adicionar `h-full` ao container do grupo para que blocos na mesma linha tenham altura uniforme:
```tsx
<div className="rounded-xl border border-border bg-card p-4 space-y-3 h-full">
```

E dentro do grupo, quando há 2+ contas lado a lado em tela grande, o grid interno pode ficar apertado. Ajustar para empilhar as contas verticalmente quando o grupo está em grid multi-coluna — trocar o grid dinâmico por `grid-cols-1` e deixar as contas empilhadas dentro de cada bloco:
```tsx
<div className="grid gap-3 grid-cols-1">
```

Isso garante que nada fique cortado: cada bloco de cliente mostra suas contas empilhadas, e os blocos ficam lado a lado.

## Arquivos editados
- `src/components/improved-reviews/tabs/AllPlatformsTab.tsx`
- `src/components/improved-reviews/clients/ClientGroupCard.tsx`

