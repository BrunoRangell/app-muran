

# Correção e Melhoria dos Filtros na Aba "Todas as Plataformas"

## Problemas Identificados

1. **Filtro "Campanhas com problemas" não funciona**: O `matchesFilter` verifica `d.veiculationStatus === "not_serving"`, mas o campo real é um objeto: `d.veiculationStatus.status === "none_running" | "no_campaigns" | "partial_running"` (como está correto no `ClientsList`)

2. **Filtro "Saldo disponível baixo" ausente**: Só existe no Meta (`balance_info.billing_model === "pre"`), mas é relevante na visão unificada — deve aparecer e filtrar apenas contas Meta

3. **Toggle "Considerar tributos (12,15%)" ausente**: Específico do Meta, mas quando alguém está na visão unificada, precisa que os cards Meta reflitam esse cálculo

4. **Toggle "Base de cálculo (Média Pond / Orç. atual)" ausente**: Específico do Google, mas precisa ser passado aos cards Google na visão unificada

## Solução

A ideia é: na aba unificada, os filtros **comuns** ficam sempre visíveis. Os filtros **específicos** aparecem condicionalmente — o "Saldo disponível baixo" só filtra contas Meta, e os toggles de tributos e base de cálculo ficam numa seção separada "Opções avançadas" sempre acessível.

### 1. Corrigir `matchesFilter` em `useAllPlatformsData.ts`
- `"campaigns"` → checar `d.veiculationStatus?.status` com os valores corretos (`none_running`, `no_campaigns`, `partial_running`)
- Adicionar case `"balance"` → checar `d.balance_info?.billing_model === "pre"` (só vai ter match em contas Meta)

### 2. Adicionar estados no hook `useAllPlatformsData.ts`
- `considerTaxes: boolean` (para passar aos ClientCards Meta)
- `budgetCalculationMode: "weighted" | "current"` (para passar aos ClientCards Google)
- Exportar esses estados e setters

### 3. Atualizar `AllPlatformsFilterBar.tsx`
- Adicionar botão "Saldo disponível baixo" nos filtros comuns
- Adicionar seção com:
  - Switch "Considerar tributos (12,15%)" — afeta cards Meta
  - ToggleGroup "Base de cálculo: Média Pond / Orç. atual" — afeta cards Google

### 4. Atualizar `ClientGroupCard.tsx`
- Receber props `considerTaxes` e `budgetCalculationMode`
- Passar `considerTaxes` ao `ClientCard` quando `platform === "meta"`
- Passar `budgetCalculationMode` ao `ClientCard` quando `platform === "google"`

### 5. Atualizar `AllPlatformsTab.tsx`
- Passar os novos estados do hook para o FilterBar e para os ClientGroupCards

## Arquivos editados
- `src/components/improved-reviews/hooks/useAllPlatformsData.ts` — corrigir filtro + adicionar estados
- `src/components/improved-reviews/filters/AllPlatformsFilterBar.tsx` — adicionar filtros/toggles faltantes
- `src/components/improved-reviews/clients/ClientGroupCard.tsx` — propagar props para ClientCard
- `src/components/improved-reviews/tabs/AllPlatformsTab.tsx` — conectar tudo

## O que NÃO muda
- Abas Meta e Google permanecem intactas
- `ClientCard`, `ClientsList`, `FilterBar` original — sem alterações
- Banco de dados e edge functions — sem alterações

