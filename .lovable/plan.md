# Correção dos avisos de campanhas sem veiculação

## Diagnóstico confirmado

### CCS Construções no Google
O dado do banco está errado: `cost_2d=2766.098326` e `impressions_2d=11531`, mas isso não representa corretamente os últimos dias.

Causa técnica encontrada em `daily-google-review`:
- `reviewDate` vem como `YYYY-MM-DD`, exemplo `2026-06-08`.
- O helper `yesterdayFromToday()` espera `YYYYMMDD`, sem hífen.
- Com hífen, ele fatia a string errado e monta uma data inválida/antiga.
- Resultado: a query do Google para `cost_2d` usa uma janela incorreta, trazendo métricas que não são de ontem+hoje.
- Além disso, o código compara `segments.date` convertido para `YYYYMMDD` com `targetDate` em `YYYY-MM-DD`; por isso **todos os snapshots Google de hoje estão com `cost_today=0`**. Confirmei no banco: 21 snapshots Google hoje, 0 com gasto/impressões de hoje.

Portanto, CCS não apareceu porque o critério atual viu um `cost_2d` falso positivo e concluiu que houve veiculação.

### Jardim das Flores no Meta
O alerta usou um snapshot antigo:
- Alerta: 16:00 BRT.
- Snapshot Meta atualizado depois: 17:00 BRT.
- Depois da atualização, a campanha aparece com gasto e impressões (`cost=23.07`, `impressions=1487`).

Portanto, Jardim apareceu porque o alerta leu um snapshot defasado, não porque a campanha estava sem veiculação de fato.

## O que será alterado

### 1. Corrigir datas no Google (`daily-google-review`)
- Normalizar `reviewDate` para dois formatos:
  - `reviewDateSql`: `YYYY-MM-DD` para queries Google Ads e banco.
  - `reviewDateCompact`: `YYYYMMDD` apenas para comparações internas.
- Ajustar `yesterdayFromToday()` para aceitar `YYYY-MM-DD` corretamente ou criar helper explícito para subtrair um dia em formato SQL.
- Corrigir a comparação do dia atual:
  - antes: `dateStr === targetDate` (`YYYYMMDD` vs `YYYY-MM-DD`, sempre falso)
  - depois: comparar formatos iguais.
- Garantir que `cost`, `impressions`, `cost_2d` e `impressions_2d` representem exatamente:
  - hoje
  - ontem + hoje

### 2. Evitar refresh defasado antes do Discord (`check-campaign-health-alerts`)
Antes de montar o aviso:
- Buscar clientes ativos com contas Meta/Google ativas.
- Rodar uma revisão fresca de Google (`daily-google-review`) para clientes com Google.
- Rodar uma revisão fresca de Meta (`unified-meta-review`) para clientes com Meta.
- Esperar as revisões finalizarem antes de ler `campaign_health`.
- Registrar um log `campaign_health_alerts_refresh` com duração, sucessos e falhas.

Se uma plataforma falhar no refresh, o alerta continua com o que estiver disponível, mas o log deixa claro que o refresh falhou.

### 3. Proteger o alerta contra snapshot velho
Depois do refresh:
- Ao ler `campaign_health`, ignorar contas cujo `updated_at` não esteja recente o suficiente para o horário do alerta.
- Usar uma tolerância curta (ex: últimos 30 minutos), porque a revisão será disparada logo antes.
- Registrar em log contas ignoradas por snapshot velho.

Isso evita repetir o caso Jardim das Flores.

### 4. Manter o formato com motivo
Não muda o formato atual:
```text
> • Cliente | Plataforma | Campanha — Motivo: ...
```

Mas com os dados corrigidos:
- Google com 2 dias sem veiculação passa a aparecer como `Motivo: Sem veiculação (2 dias)`.
- Meta só aparece se o snapshot fresco confirmar zero hoje.

## Arquivos afetados

- `supabase/functions/daily-google-review/index.ts`
- `supabase/functions/check-campaign-health-alerts/index.ts`

## Validação após implementação

1. Rodar uma revisão Google fresca para CCS.
2. Conferir no banco que CCS fica com:
   - `cost_today=0`
   - `impressions_today=0`
   - `cost_2d=0` se realmente não teve gasto ontem+hoje
   - `unserved_campaigns_count=1`
3. Rodar o alerta manualmente.
4. Conferir que CCS aparece no Discord.
5. Conferir que Jardim das Flores não aparece se o refresh Meta confirmar gasto/impressões.
