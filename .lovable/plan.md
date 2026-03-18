

# Clientes com 3+ contas ocupam largura inteira

## Problema
Atualmente, clientes com 3+ contas têm `min-w-[720px]` e `flex-1`, o que permite que outro bloco tente caber ao lado. O usuário quer que esses blocos ocupem 100% da largura sozinhos.

## Solução
Apenas alterar a classe CSS dos blocos com 3+ contas para `w-full` (largura total), forçando-os a ocupar a linha inteira. Clientes com 1-2 contas continuam com o comportamento atual (flex wrap lado a lado).

### `AllPlatformsTab.tsx` — linhas 88-93
```tsx
const sizeClasses =
  count === 1
    ? "min-w-[280px] max-w-[350px] flex-1"
    : count === 2
      ? "min-w-[500px] max-w-[700px] flex-1"
      : "w-full";
```

E remover o `flex-1` do wrapper div (linha 95), passando-o para dentro do `sizeClasses` apenas para 1-2 contas:
```tsx
<div key={group.clientId} className={sizeClasses}>
```

## Arquivo editado
- `src/components/improved-reviews/tabs/AllPlatformsTab.tsx`

