## Objetivo

1. Garantir que **todas** as contas/campanhas que se enquadram nos critérios apareçam em **todo** envio (09h e 16h).
2. Trocar o formato das mensagens no Discord para o layout solicitado.
3. Incluir **Google Ads** no alerta de campanhas sem veiculação.

---

## Por que ontem ficaram contas/campanhas de fora

- **`check-low-balance-alerts`**: tem uma deduplicação por "nível" (esgotado/crítico/baixo) na janela de 11h. Se a conta já apareceu como "esgotado" no envio das 09h, ela é **suprimida** às 16h porque o nível não piorou. Resultado: lista incompleta no 2º envio.
- **`check-campaign-health-alerts`**: tem dedup por `(account_id, snapshot_date)` — uma conta aparece **uma única vez por dia**. O envio das 16h fica sem essas contas.
- **`check-campaign-health-alerts`**: filtra `platform = 'meta'`, então Google fica de fora (já há dados de Google em `campaign_health` hoje, confirmado).

## Mudanças

### 1. `supabase/functions/check-low-balance-alerts/index.ts`

- **Remover** o sistema de níveis e a dedup por rank. Toda execução envia **todas** as contas Meta pré-pagas ativas com `dias ≤ 3` (saldo esgotado entra naturalmente como 0 dias).
- Manter `low_balance_alerts` apenas como histórico (insere os registros enviados), sem mais filtrar por janela.
- Ordenar por `dias` crescente (mais urgente primeiro).
- Novo formato:
  ```
  # 28/05
  ### 💸 Alerta de saldo baixo - Meta Ads
  
  > • {Cliente} - R$ {saldo} ({x} dias)
  > • {Cliente} - R$ {saldo} ({x} dias)
  
  @everyone
  ```
- Data no formato `DD/MM` em horário de Brasília.
- Para saldo esgotado, mostrar `(0 dias)`.

### 2. `supabase/functions/check-campaign-health-alerts/index.ts`

- **Remover** filtro `platform = 'meta'` — buscar Meta **e** Google.
- **Remover** dedup por `(account_id, snapshot_date)` — toda execução envia o estado atual completo (a tabela `campaign_health_alerts` continua sendo populada para histórico).
- Listar **todas** as campanhas com `cost = 0` e `impressions = 0` (sem o limite atual de 8).
- Ordenar por `company_name` ASC e, dentro do cliente, por nome da campanha.
- Formato pedido — **uma linha por campanha**, não agrupada por cliente:
  ```
  # 28/05
  ### 🚨 Alerta de campanhas sem veiculação - Meta e Google
  
  > • {Cliente} | Meta Ads | **{Nome da campanha}:** 0 impressões e R$ 0,00 gasto hoje
  > • {Cliente} | Google Ads | **{Nome da campanha}:** 0 impressões e R$ 0,00 gasto hoje
  
  @everyone
  ```
- Mapear `platform`: `meta → "Meta Ads"`, `google → "Google Ads"`.
- Se a mensagem ficar maior que ~1900 chars (limite Discord 2000), quebrar em múltiplas mensagens sequenciais.

### 3. Sem mudanças em schema ou crons

Cron das 09h e 16h já está agendado e continua válido.

---

## Pergunta antes de implementar

A linha das campanhas mostra `0 impressões e R$ 0,00 gasto hoje` (sempre zerados, pois é o critério). Confirma esse texto fixo? Ou prefere algo mais curto tipo `**{Nome}:** sem veiculação hoje`?
