## Objetivo

Expandir o sistema de alertas no Discord para incluir:
1. Contas com **saldo esgotado** (saldo ≤ 0) no mesmo alerta de saldo baixo
2. Novo alerta de **campanhas com erro / sem veiculação** (já existe no app via `campaign_health.unserved_campaigns_count`)
3. Reagendar **ambos** os crons para rodar às **09:00** e **16:00** (horário de Brasília)

---

## 1. Alerta de saldo (expandir o existente)

Editar `supabase/functions/check-low-balance-alerts/index.ts`:

- Remover o filtro `saldo <= 0` que hoje descarta contas zeradas.
- Classificar cada conta em 3 níveis:
  - **Esgotado** → `saldo <= 0`
  - **Crítico** → `dias <= 1`
  - **Baixo** → `dias <= 3`
- Mensagem do Discord agrupada por seção, com emojis distintos:
  ```
  @everyone ⚠️ Alerta de saldo — Meta Ads
  
  🔴 Saldo esgotado
  • Cliente X · Conta Y — R$ 0,00
  
  🟠 Crítico (≤ 1 dia)
  • Cliente Z · Conta W — R$ 45,00 · ~0,8 dia(s)
  
  🟡 Baixo (≤ 3 dias)
  • ...
  ```
- Ajustar deduplicação em `low_balance_alerts` para considerar o nível (esgotado = `dias_restantes = 0`, sem reenviar se já enviado nas últimas 11h no mesmo nível).

## 2. Novo alerta de campanhas sem veiculação

Criar nova edge function `supabase/functions/check-campaign-health-alerts/index.ts`:

- Consultar `campaign_health` do dia atual (`snapshot_date = CURRENT_DATE`) com `unserved_campaigns_count > 0` OU `active_campaigns_count = 0` em contas ativas.
- Para cada cliente/conta, listar de `campaigns_detailed` as campanhas com `cost = 0` e `impressions = 0`.
- Deduplicação simples: nova tabela `campaign_health_alerts` (account_id, snapshot_date, unserved_count, sent_at) com unique `(account_id, snapshot_date)` — evita reenviar a mesma situação no mesmo dia.
- Enviar para o mesmo canal Discord (`DISCORD_LOW_BALANCE_CHANNEL_ID`) ou criar secret separado se preferir. **Pergunta:** usar o mesmo canal ou criar um novo?
- Formato:
  ```
  @everyone 🚨 Campanhas sem veiculação — Meta Ads
  
  • Cliente X · Conta Y — 2 campanha(s) sem veiculação hoje
      - Campanha A
      - Campanha B
  ```

## 3. Migração

Criar tabela `campaign_health_alerts` para deduplicação (similar à `low_balance_alerts`), com RLS.

## 4. Reagendar crons

No SQL Editor (não migração — contém dados do projeto), remover schedules antigos (jobids `37`, `38`) e criar 4 novos:

```sql
select cron.unschedule(37);
select cron.unschedule(38);

-- Saldo: 09h e 16h BRT (12h e 19h UTC)
select cron.schedule('check-low-balance-alerts-09h', '0 12 * * *', $$ ... $$);
select cron.schedule('check-low-balance-alerts-16h', '0 19 * * *', $$ ... $$);

-- Campanhas: 09h e 16h BRT
select cron.schedule('check-campaign-health-alerts-09h', '0 12 * * *', $$ ... $$);
select cron.schedule('check-campaign-health-alerts-16h', '0 19 * * *', $$ ... $$);
```

Vou te entregar o SQL pronto para colar.

---

## Perguntas antes de implementar

1. **Canal Discord**: usar o **mesmo canal** (`DISCORD_LOW_BALANCE_CHANNEL_ID`) para os avisos de campanhas sem veiculação, ou prefere um canal separado (novo secret)?
2. **Critério "sem veiculação"**: considerar apenas contas com `unserved_campaigns_count > 0` (Meta), ou também incluir contas Google Ads (a tabela `campaign_health` tem `platform`)?
3. **Confirma horários**: 09:00 e 16:00 horário de Brasília (UTC-3)?
