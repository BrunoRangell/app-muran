

# Reorganizar Filtros por Plataforma na AllPlatformsFilterBar

## Problema
Os filtros estão todos misturados numa linha só. O usuário quer ver claramente quais filtros são comuns, quais são do Meta e quais são do Google -- separados visualmente em linhas/seções distintas.

## Solução

Reorganizar o `AllPlatformsFilterBar.tsx` em 3 seções visuais claras:

```text
┌──────────────────────────────────────────────────────────┐
│  🔍 Buscar clientes...                                  │
│                                                          │
│  ── Filtros comuns ──────────────────────────────────     │
│  [Ajuste de orçamento] [Campanhas com problemas]         │
│  [Sem conta cadastrada]        Plataforma: [All|Meta|G]  │
│                                                          │
│  ── 🔵 Meta Ads ────────────────────────────────────     │
│  [Saldo disponível baixo]   🔘 Considerar tributos       │
│                                                          │
│  ── 🟡 Google Ads ──────────────────────────────────     │
│  Base de cálculo: [Média Pond.] [Orç. atual]             │
└──────────────────────────────────────────────────────────┘
```

- **Linha 1**: Busca (sem mudança)
- **Linha 2**: Filtros comuns (Ajuste, Campanhas, Sem conta) + toggle de plataforma no canto direito
- **Linha 3**: Seção Meta (badge azul) com "Saldo disponível baixo" e switch "Considerar tributos"
- **Linha 4**: Seção Google (badge amber) com toggle "Base de cálculo"

Cada seção de plataforma tem um badge colorido como label e uma borda lateral colorida (mesmo padrão dos cards).

## Arquivo editado
- `src/components/improved-reviews/filters/AllPlatformsFilterBar.tsx` -- reorganizar layout em seções

## O que NÃO muda
- `ClientGroupCard.tsx` -- cards ficam lado a lado como estão (com as seções Meta/Google que já implementamos)
- Hook, Tab, lógica de filtro -- tudo permanece igual

