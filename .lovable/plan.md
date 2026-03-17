

# Melhorias na FilterBar e Layout dos Cards

## 1. Organizar filtros por plataforma na FilterBar

Atualmente todos os filtros e opções estão misturados. A ideia é separar em 3 linhas claras:

```text
┌──────────────────────────────────────────────────────────┐
│ 🔍 Buscar clientes...                    [Todas|Meta|Google] │
│                                                              │
│ 📋 Filtros comuns:                                           │
│ [Ajuste de orçamento] [Campanhas com problemas] [Sem conta]  │
│                                                              │
│ 🔵 Meta Ads:  [Saldo disponível baixo]  ☐ Tributos (12,15%) │
│ 🟡 Google Ads: Base de cálculo: [Média Pond.] [Orç. atual]  │
└──────────────────────────────────────────────────────────┘
```

- Linha 1: Busca + toggle de plataforma (como está)
- Linha 2: Filtros comuns (ajuste, campanhas, sem conta) — sem badge de plataforma
- Linha 3: Seção "Meta Ads" com saldo baixo + tributos; Seção "Google Ads" com base de cálculo — cada uma com badge colorido identificando a plataforma

### Arquivo: `AllPlatformsFilterBar.tsx`
- Reorganizar o layout separando filtros comuns dos específicos
- Adicionar badges "Meta Ads" e "Google Ads" antes de cada grupo de opções específicas

## 2. Cards Meta e Google lado a lado

Atualmente as seções Meta e Google ficam empilhadas verticalmente. Mudar para layout horizontal (lado a lado) quando há ambas as plataformas.

```text
┌──────────────────────────────────────────────────────┐
│  Ford Amazon                                         │
│  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │ 🔵 Meta Ads (2)     │  │ 🟡 Google Ads (1)     │ │
│  │ [card] [card]        │  │ [card]                 │ │
│  └─────────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Arquivo: `ClientGroupCard.tsx`
- Mudar o container das seções de `space-y-3` (vertical) para `grid grid-cols-1 lg:grid-cols-2 gap-4` (lado a lado em telas grandes)
- Cada seção ocupa uma coluna; se só tem uma plataforma, ocupa a largura toda

## Arquivos editados
- `src/components/improved-reviews/filters/AllPlatformsFilterBar.tsx`
- `src/components/improved-reviews/clients/ClientGroupCard.tsx`

