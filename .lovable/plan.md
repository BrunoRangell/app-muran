

# Ajustes nos Cards da Aba "Todas as Plataformas"

## Problemas identificados
1. Layout em telas grandes: 2 cards com espaço em branco enorme (grid `lg:grid-cols-2` divide em 2 colunas fixas)
2. Telas menores: cards preenchem 100% ficando grandes demais
3. Linhas coloridas laterais (`border-l-2`) desnecessárias
4. Cards não ordenados por plataforma majoritária

## Solução

### `ClientGroupCard.tsx` — Reescrever o layout

**Remover separação por seções de plataforma.** Em vez de dividir em 2 colunas (Meta | Google), renderizar todos os cards em um único grid responsivo, ordenados por plataforma (a que tem mais contas primeiro).

```text
┌──────────────────────────────────────────────────────────┐
│  Ford Amazon                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                  │
│  │Meta #1   │  │Meta #2   │  │Google #1│                  │
│  └─────────┘  └─────────┘  └─────────┘                  │
└──────────────────────────────────────────────────────────┘
```

Mudanças:
- **Remover `renderSection`** e as `border-l-2` coloridas
- **Ordenar contas**: agrupar por plataforma majoritária primeiro (se 2 meta + 1 google → meta primeiro)
- **Grid único responsivo**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — os cards se adaptam ao espaço disponível sem ficarem enormes ou minúsculos
- **Manter badges de plataforma** dentro de cada card individual (o `CircularBudgetCard` já identifica a plataforma visualmente)
- Cada card mantém `w-full` mas o grid controla o tamanho

### `CircularBudgetCard.tsx` — Adicionar indicador de plataforma no card

Adicionar um pequeno badge ou indicador da plataforma (Meta/Google) no header de cada card para que, mesmo sem as seções separadas, o usuário saiba qual é qual.

## Arquivos editados
- `src/components/improved-reviews/clients/ClientGroupCard.tsx`
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx` (badge de plataforma no header)

