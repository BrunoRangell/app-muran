

# Plano: FilterBar sticky ao rolar a página

## O que fazer

Tornar o componente `FilterBar` fixo no topo da tela quando o usuário rola para baixo, tanto na aba Meta Ads quanto Google Ads.

## Alteração

### `src/components/improved-reviews/filters/FilterBar.tsx`

Trocar o `<Card>` wrapper por um container com classes `sticky top-0 z-30 bg-background`:

```tsx
<Card className="shadow-sm sticky top-0 z-30 bg-background">
```

Isso faz o card "grudar" no topo da viewport quando sai da área visível. Como o `FilterBar` já é usado em ambas as abas (Meta e Google), a mudança se aplica automaticamente às duas.

