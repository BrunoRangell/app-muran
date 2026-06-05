# Ajuste no alerta de campanhas sem veiculação

## Decisões
- **Meta:** mantém exatamente como está hoje (campanha sem veiculação = `cost === 0 && impressions === 0` no dia atual). O caso da ALC da Ford Amazon é um ruído ocasional aceitável.
- **Google:** alerta dispara quando **qualquer uma** das duas condições for verdadeira:
  1. `cost_2d === 0 && impressions_2d === 0` (regra atual — campanha parada há 2 dias), **OU**
  2. `primary_status` indica problema real **hoje**, mesmo que tenha gasto ontem.

## Critério "primary_status problemático" (Google)

Considerar problemática quando `primary_status` for um destes:
- `NOT_ELIGIBLE`
- `MISCONFIGURED`
- `PENDING`
- `ENDED`

OU quando `primary_status_reasons` contiver qualquer um destes motivos (independente do status):
- `AD_GROUP_ADS_DISAPPROVED`
- `AD_GROUP_ADS_NOT_ELIGIBLE`
- `NO_ADS`
- `NO_AD_GROUPS`
- `NO_ELIGIBLE_AD_GROUPS`
- `APP_NOT_RELEASED`
- `MOBILE_APP_NO_LONGER_AVAILABLE`
- `CONVERSION_ACTION_MISSING`
- `CONVERSION_TRACKING_MISSING`
- `LOW_QUALITY_LANDING_PAGE`
- `MERCHANT_CENTER_ACCOUNT_SUSPENDED`
- `PRODUCT_FEED_HAS_NO_PRODUCTS`
- `BIDDING_STRATEGY_MISCONFIGURED`
- `BUDGET_MISCONFIGURED`
- `STORE_REMOVED`
- `CAMPAIGN_REMOVED`
- `CAMPAIGN_ENDED`

Motivos **não** considerados problemáticos (não disparam alerta sozinhos): `BUDGET_CONSTRAINED`, `BIDDING_STRATEGY_LIMITED`, `LEARNING`, `PENDING_USER_REVIEW`, `CAMPAIGN_DRAFT`, status `LIMITED` puro, `ELIGIBLE`, etc. — esses são situações de operação normal/temporária.

> Observação: no caso do Bertusch, ambas as campanhas têm `HAS_ADS_DISAPPROVED` → passam a ser alertadas mesmo tendo gasto ontem.

## Mudanças técnicas

### 1. `supabase/functions/check-campaign-health-alerts/index.ts`
- Adicionar constante `GOOGLE_PROBLEMATIC_STATUSES` (Set com os `primary_status`).
- Adicionar constante `GOOGLE_PROBLEMATIC_REASONS` (Set com os `primary_status_reasons`).
- Adicionar helper `isGoogleProblematic(c)`: retorna `true` se `primary_status` ∈ set OU se alguma reason ∈ set.
- Atualizar o loop que filtra campanhas:
  - **Meta:** mantém `cost === 0 && impressions === 0` (hoje) — sem mudanças.
  - **Google:** alerta se `(cost_2d === 0 && impressions_2d === 0)` **OU** `isGoogleProblematic(c)`.
- O status exibido (`buildGoogleStatusLabel`) já mostra `primary_status — reason`, então o Discord continuará legível (ex.: "Não elegível — Todos os anúncios reprovados").

### 2. `unserved_campaigns_count` no snapshot
- `daily-google-review/index.ts` / `account-health.ts`: a contagem `unserved_campaigns_count` salva no `campaign_health` precisa refletir o novo critério, senão o alerta nem chega a ser avaliado (a query inicial filtra `unserved_campaigns_count > 0`).
- Atualizar o cálculo do count para: `(cost_2d===0 && impressions_2d===0) || primary_status_problemático`.

### 3. Sem mudanças
- `unified-meta-review/*`: nada muda.
- Schema/DB: nada muda (campos já existem).
- UI: nada muda.

## Funções a redeployar
- `daily-google-review`
- `check-campaign-health-alerts`

## Validação após deploy
- Rodar manualmente `daily-google-review` para Bertusch e conferir que `unserved_campaigns_count >= 2` e que `campaigns_detailed` mantém `primary_status_reasons`.
- Rodar manualmente `check-campaign-health-alerts` (modo teste) e validar que Bertusch aparece no alerta com label "Não elegível — Todos os anúncios reprovados".
