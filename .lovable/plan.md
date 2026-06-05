## Mudanças nos Alertas Discord

### 1. Meta — voltar para "hoje" (apenas Meta)

**`supabase/functions/unified-meta-review/account-health.ts`**
- Calcular `unserved_campaigns_count` por plataforma:
  - **Meta:** `cost === 0 && impressions === 0` (apenas hoje)
  - **Google:** mantém `cost_2d === 0 && impressions_2d === 0` (ontem + hoje)

**`supabase/functions/check-campaign-health-alerts/index.ts`**
- No filtro de campanhas dentro de cada snapshot:
  - Se `platform === 'meta'` → checar `c.cost`/`c.impressions` (hoje)
  - Se `platform === 'google'` → continuar com `c.cost_2d`/`c.impressions_2d`

### 2. Google — refletir status real

O status `ENABLED` da campanha não diz nada sobre veiculação de anúncios. Vou usar `campaign.primary_status` e `campaign.primary_status_reasons` da Google Ads API, que já refletem condições como "Todos os anúncios reprovados", "Em revisão", "Limitada por orçamento", etc.

**`supabase/functions/daily-google-review/index.ts` → `fetchGoogleActiveCampaigns`**
- Adicionar `campaign.primary_status` e `campaign.primary_status_reasons` às duas queries (metrics + enabled).
- Salvar no `campaignsDetails` dois novos campos: `primary_status` e `primary_status_reasons` (array).
- Manter `status: 'ENABLED'` para compatibilidade.

**`supabase/functions/check-campaign-health-alerts/index.ts`**
- Para campanhas Google, exibir um status derivado a partir de `primary_status` + primeiro reason relevante de `primary_status_reasons`. Tradução PT:
  - `ELIGIBLE` → "Veiculando"
  - `PENDING` → "Pendente"
  - `LEARNING` → "Em aprendizado"
  - `LIMITED` → "Limitada" (+ reason se disponível)
  - `MISCONFIGURED` → "Configuração inválida"
  - `NOT_ELIGIBLE` → "Não elegível"
  - `PAUSED` / `REMOVED` / `ENDED` → traduções correspondentes
  - Reasons relevantes mapeadas: `AD_GROUP_ADS_DISAPPROVED` → "Todos os anúncios reprovados", `AD_GROUP_ADS_NOT_ELIGIBLE` → "Anúncios não elegíveis", `BUDGET_CONSTRAINED` → "Limitada por orçamento", `BIDDING_STRATEGY_CONSTRAINED` → "Limitada por lance", `APP_NOT_RELEASED` → "App não publicado", `KEYWORDS_PAUSED` → "Palavras-chave pausadas", `LOW_QUALITY_LANDING_PAGE` → "Página de destino com baixa qualidade".
- Combinação exibida: `"<status>" + (reason ? " — <reason>" : "")` (ex.: "Não elegível — Todos os anúncios reprovados").
- Fallback: snapshots antigos sem `primary_status` continuam usando `translateStatus(...)` atual.

### Escopo

- Sem mudanças de schema (campos novos vão no JSONB `campaigns_detailed`).
- Sem alterações em UI ou outras telas — `cost_today`/`impressions_today` permanecem como hoje.
- Funções afetadas (deploy automático): `unified-meta-review`, `daily-google-review`, `check-campaign-health-alerts`.
