

# Separar Cards por Plataforma dentro do ClientGroupCard

## Problema
Atualmente os cards Meta e Google aparecem misturados no mesmo grid, sem indicação visual clara de qual é qual.

## Solução
Agrupar os cards por plataforma dentro de cada cliente, com um **sub-header colorido** por seção:

```text
┌─────────────────────────────────────────────────┐
│  Ford Amazon                                    │
│                                                 │
│  🔵 Meta Ads (2 contas)                        │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ cnpjCaxias   │  │ cnpjSCS      │             │
│  │ R$ 5.000     │  │ R$ 3.000     │             │
│  └──────────────┘  └──────────────┘             │
│                                                 │
│  🟡 Google Ads (1 conta)                        │
│  ┌──────────────┐                               │
│  │ Ford Search  │                               │
│  │ R$ 2.000     │                               │
│  └──────────────┘                               │
└─────────────────────────────────────────────────┘
```

- Separar `accounts` em `metaAccounts` e `googleAccounts`
- Renderizar cada grupo com um sub-header: badge colorido + contagem de contas
- Separador visual (linha ou espaço) entre as seções
- Se o cliente só tem uma plataforma, mostra apenas essa seção

## Arquivo editado
- `src/components/improved-reviews/clients/ClientGroupCard.tsx` — separar accounts por plataforma, renderizar em seções distintas com sub-headers

Nenhum outro arquivo precisa mudar.

