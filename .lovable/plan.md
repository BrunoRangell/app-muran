## Objetivo

Adaptar o alerta "Campanhas sem veiculação" para considerar **ontem + hoje** (até agora) em vez de só hoje, mantendo as métricas diárias (`cost_today` / `impressions_today`) inalteradas nas demais telas.

## Estratégia

A campanha é marcada como **sem veiculação** quando `cost(ontem) + cost(hoje) == 0` E `impressions(ontem) + impressions(hoje) == 0`.

Mudanças concentradas em duas edge functions que populam `campaign_health`:

### 1) `supabase/functions/unified-meta-review/account-health.ts` (Meta Ads)

- Em `fetchMetaActiveCampaigns`, para cada campanha ativa, fazer **2 chamadas** de insights (em paralelo dentro do mesmo lote):
  - Hoje: `time_range={"since":"<hoje>","until":"<hoje>"}` → `costToday`, `impressionsToday`
  - Janela 2 dias: `time_range={"since":"<ontem>","until":"<hoje>"}` → `cost2d`, `impressions2d`
- Retornar por campanha: `{ id, name, status, cost: costToday, impressions: impressionsToday, cost_2d: cost2d, impressions_2d: impressions2d }`.
- `unservedCampaigns` passa a contar campanhas com `cost_2d === 0 && impressions_2d === 0` (em vez de `cost === 0 && impressions === 0`).
- `cost_today` / `impressions_today` continuam refletindo só hoje.

### 2) `supabase/functions/daily-google-review/index.ts` (Google Ads)

- Em `fetchGoogleActiveCampaigns`, trocar `segments.date = '<hoje>'` por `segments.date BETWEEN '<ontem>' AND '<hoje>'`.
- Agregar por `campaign.id` em código:
  - `costToday` / `impressionsToday` (rows onde `segments.date === hoje`)
  - `cost2d` / `impressions2d` (soma de todas as rows da campanha)
- Garantir inclusão de campanhas ativas **mesmo sem nenhuma row** no período (sem veiculação em nenhum dos dois dias): se a query não retornar a campanha, ela ainda precisa aparecer como zerada. Para isso, fazer uma 2ª query simples sem `segments.date` para listar `campaign.id, campaign.name, campaign.status` de todas com `ENABLED`, e fazer merge com os resultados.
- `unservedCount` passa a usar `cost2d === 0 && impressions2d === 0`.
- `campaignsDetails` ganha campos `cost_2d` e `impressions_2d`.

### 3) `supabase/functions/check-campaign-health-alerts/index.ts` (envio do alerta)

- A query continua filtrando `unserved_campaigns_count > 0` (já refletirá a nova regra).
- Trocar o filtro por campanha de `cost === 0 && impressions === 0` para `Number(c?.cost_2d ?? c?.cost ?? 0) === 0 && Number(c?.impressions_2d ?? c?.impressions ?? 0) === 0`. O fallback para `cost`/`impressions` mantém compatibilidade caso o snapshot ainda esteja no formato antigo.

## Helpers (locais, sem util novo)

Em cada arquivo, função `getYesterdayInBrazil()` (espelha o `getTodayInBrazil` existente, subtraindo 1 dia).

## Fora do escopo

- Não muda schema do banco (`campaigns_detailed` é `jsonb`, aceita novos campos).
- Não muda a UI de Campaign Health (continua lendo `cost`/`impressions` de hoje).
- Não muda cron, secrets, RLS.
- Não toca em `manual-cleanup-campaign-health` nem em `campaign-health-status`.

## Validação após deploy

- Disparar `unified-meta-review` para uma conta Meta com campanha pausada há 2 dias → verificar que aparece em `unserved_campaigns_count`.
- Disparar `daily-google-review` para uma conta Google equivalente.
- Chamar `check-campaign-health-alerts` manualmente e conferir mensagem no Discord.
- Checar logs das 3 funções.