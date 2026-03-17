

# Filtros na Aba "Todas as Plataformas"

## Problema
Meta e Google têm filtros diferentes:
- **Comuns**: Ajuste de orçamento, Campanhas com problemas, Sem conta cadastrada
- **Só Meta**: Saldo disponível baixo, Considerar tributos (12,15%)
- **Só Google**: Base de cálculo (Média Pond / Orç. atual)

## Solução

Exibir os **3 filtros comuns** + um filtro extra **"Só Meta"** e **"Só Google"** para filtrar por plataforma. Os filtros específicos (saldo, tributos, base de cálculo) ficam omitidos nesta aba — eles continuam disponíveis nas abas dedicadas.

### Filtros da aba unificada:
1. **Ajuste de orçamento** — filtra clientes com `needsAdjustment` (ambas plataformas)
2. **Campanhas com problemas** — filtra por `veiculationStatus` (ambas)
3. **Sem conta cadastrada** — filtra por `!hasAccount` (ambas)
4. **Plataforma** — novo toggle: Todas / Meta / Google (filtra os grupos mostrando só contas da plataforma selecionada)

### Implementação

1. **Criar `AllPlatformsFilterBar.tsx`** — componente de filtros dedicado para esta aba, com os 3 filtros comuns + filtro de plataforma (ToggleGroup com "Todas", "Meta", "Google")

2. **Atualizar `AllPlatformsTab.tsx`** — usar o novo FilterBar, passar estado de filtros para a lógica de filtragem

3. **Atualizar `useAllPlatformsData.ts`** — adicionar parâmetros de filtro (activeFilter + platformFilter), aplicar filtragem nos grupos:
   - `activeFilter` filtra as contas individuais dentro de cada grupo
   - `platformFilter` filtra por plataforma
   - Grupos sem contas após filtragem são removidos

### Arquivos
- **Novo**: `src/components/improved-reviews/filters/AllPlatformsFilterBar.tsx`
- **Editar**: `src/components/improved-reviews/tabs/AllPlatformsTab.tsx`
- **Editar**: `src/components/improved-reviews/hooks/useAllPlatformsData.ts`

Nenhuma alteração nas abas Meta/Google existentes.

