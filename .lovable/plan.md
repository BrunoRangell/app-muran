

# Ativar "Tributos 12,15%" por padrão

Alterar o estado inicial de `considerTaxes` de `false` para `true` em dois locais:

1. **`src/components/improved-reviews/tabs/MetaAdsTab.tsx`** (linha 24): `useState(false)` → `useState(true)`
2. **`src/components/improved-reviews/hooks/useAllPlatformsData.ts`** (linha 49): `useState(false)` → `useState(true)`

