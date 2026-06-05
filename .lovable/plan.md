# Mostrar motivo no alerta de campanhas sem veiculação

## Objetivo
Trocar `Status: <status>` por `Motivo: <motivo curto>` no Discord, para diferenciar rapidamente ruído matinal vs problema real (anúncios reprovados, orçamento, etc.).

## Formato novo

```
> • Cliente | Plataforma | Nome da campanha — Motivo: <motivo curto>
```

Exemplo:
```
> • Ford Amazon | Meta Ads | [ALC] região local | Ford 2025-2026 — Motivo: Sem gasto hoje
> • Bertusch | Google Ads | [LEAD] Santa Cruz do Sul — Motivo: Anúncios reprovados
> • Cliente X | Google Ads | Campanha Y — Motivo: Sem veiculação (2 dias)
```

## Regras de motivo

### Meta (sempre o mesmo motivo)
- `Sem gasto hoje` — único cenário possível, já que critério Meta é só "hoje". É curto e deixa claro que pode ser ruído matinal.

### Google — prioridade do motivo (de mais grave para mais leve)
1. Se `primary_status_reasons` contém algum motivo problemático mapeado, usar o **primeiro motivo problemático traduzido em forma curta**:
   - `AD_GROUP_ADS_DISAPPROVED` → "Anúncios reprovados"
   - `AD_GROUP_ADS_NOT_ELIGIBLE` → "Anúncios não elegíveis"
   - `NO_ADS` / `NO_AD_GROUPS` / `NO_ELIGIBLE_AD_GROUPS` → "Sem anúncios elegíveis"
   - `CONVERSION_ACTION_MISSING` / `CONVERSION_TRACKING_MISSING` → "Conversões não configuradas"
   - `LOW_QUALITY_LANDING_PAGE` → "Página de destino baixa qualidade"
   - `MERCHANT_CENTER_ACCOUNT_SUSPENDED` → "Merchant Center suspenso"
   - `PRODUCT_FEED_HAS_NO_PRODUCTS` → "Feed sem produtos"
   - `BIDDING_STRATEGY_MISCONFIGURED` → "Estratégia de lance inválida"
   - `BUDGET_MISCONFIGURED` → "Orçamento inválido"
   - `APP_NOT_RELEASED` / `MOBILE_APP_NO_LONGER_AVAILABLE` → "App indisponível"
   - `STORE_REMOVED` → "Loja removida"
   - `CAMPAIGN_REMOVED` → "Campanha removida"
   - `CAMPAIGN_ENDED` → "Campanha encerrada"
2. Se não houver reason problemática mas `primary_status` for problemático:
   - `NOT_ELIGIBLE` → "Não elegível"
   - `MISCONFIGURED` → "Configuração inválida"
   - `PENDING` → "Pendente"
   - `ENDED` → "Encerrada"
3. Caso contrário (caiu no alerta apenas por `cost_2d===0 && impressions_2d===0`):
   - `Sem veiculação (2 dias)`

> Nota: a regra acima escolhe **um** motivo conciso. Não listamos múltiplas reasons para não poluir.

## Mudanças técnicas

### `supabase/functions/check-campaign-health-alerts/index.ts`
- Adicionar `GOOGLE_PROBLEMATIC_REASONS_SHORT_PT` (mapa só com os termos curtos da lista acima).
- Adicionar `GOOGLE_PROBLEMATIC_STATUSES_SHORT_PT`.
- Adicionar helper `buildReason(platform, c): string`:
  - Meta: `"Sem gasto hoje"`.
  - Google: aplica prioridade 1 → 2 → 3 acima.
- Substituir a montagem da linha (`Status: ...`) por `Motivo: <buildReason>`.
- Remover/aposentar `buildGoogleStatusLabel` se não for usado em outro lugar (manter só se ainda for útil para logs).

### Sem mudanças
- Critérios de filtragem (Meta=hoje, Google=2d OU problemático) permanecem como estão.
- Schema/DB/UI não mudam.
- Função `daily-google-review` não muda.

## Funções a redeployar
- `check-campaign-health-alerts`
