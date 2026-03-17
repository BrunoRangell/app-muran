

# Nova Aba "Todas as Plataformas" - Visão Unificada por Cliente

## Conceito

Criar uma nova aba que agrupa as revisões por **cliente** (não por plataforma). Ao pesquisar "Ford Amazon", aparecem todas as contas Meta e Google desse cliente juntas, num layout que facilita a visão completa.

## Design da UI

Cada cliente aparece como um **card expandível** ou **grupo visual**:

```text
┌─────────────────────────────────────────────┐
│  Ford Amazon                                │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ 🔵 Meta Ads  │  │ 🟡 Google Ads│         │
│  │ cnpjCaxias   │  │ Ford Search  │         │
│  │ R$ 5.000     │  │ R$ 2.000     │         │
│  │ ██████░░ 72% │  │ ████░░░░ 48% │         │
│  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐                           │
│  │ 🔵 Meta Ads  │                           │
│  │ cnpjSCS      │                           │
│  │ R$ 3.000     │                           │
│  │ █████░░░ 65% │                           │
│  └──────────────┘                           │
└─────────────────────────────────────────────┘
```

- Cada sub-card reutiliza o `CircularBudgetCard` existente (sem modificação)
- Badge colorido indica a plataforma (azul = Meta, amarelo = Google)
- Busca filtra pelo nome do cliente, mostrando todas as contas de uma vez

## Implementação Técnica

### 1. Novo hook: `useAllPlatformsData.ts`
- Consome dados dos dois hooks existentes (`useUnifiedReviewsData` para Meta e `useGoogleAdsData` para Google)
- Agrupa por `client.id` num Map, gerando estrutura `{ clientId, clientName, accounts: [...] }` onde cada account tem `platform` e os dados do card
- Calcula métricas agregadas (total clientes, total orçamento ambas plataformas)

### 2. Nova tab: `AllPlatformsTab.tsx`
- Estrutura idêntica às abas existentes (FilterBar + lista)
- Usa apenas busca por texto (sem filtros específicos de plataforma como "saldo pré-pago" que só existe no Meta)
- Renderiza agrupado por cliente: cada grupo é um card contendo sub-cards por conta/plataforma

### 3. Novo componente: `ClientGroupCard.tsx`
- Recebe `{ clientName, accounts: Array<{platform, clientData}> }`
- Renderiza o nome do cliente como header
- Para cada account, renderiza o `ClientCard` existente com a prop `platform` correta
- Badge de plataforma em cada sub-card para identificação visual

### 4. Registro da aba em `ImprovedDailyReviews.tsx`
- Adicionar `all-platforms` como primeira aba nas TabsList
- Lazy load do componente
- Adicionar no array de abas válidas para hash/localStorage

## Arquivos novos
- `src/components/improved-reviews/hooks/useAllPlatformsData.ts`
- `src/components/improved-reviews/tabs/AllPlatformsTab.tsx`
- `src/components/improved-reviews/clients/ClientGroupCard.tsx`

## Arquivos modificados
- `src/pages/ImprovedDailyReviews.tsx` — adicionar aba (sem alterar abas existentes)

## O que NÃO muda
- Hooks `useUnifiedReviewsData` e `useGoogleAdsData` permanecem intactos
- Componentes `ClientCard`, `CircularBudgetCard`, `ClientsList` não são alterados
- Abas Meta Ads e Google Ads continuam funcionando exatamente como estão
- Nenhuma mudança no banco de dados ou edge functions

