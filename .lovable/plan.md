## Objetivo

Criar um sistema automático que verifica, 2x ao dia, todas as contas Meta Ads pré-pagas dos clientes e envia um alerta no Discord (canal central) sempre que o saldo restante for suficiente para **3 dias ou menos**, marcando `@everyone` do canal.

## Como vai funcionar

1. **Edge function nova** `check-low-balance-alerts`:
   - Busca todos os clientes ativos com contas Meta cadastradas (`client_accounts` onde `platform = 'meta'` e `status = 'active'`).
   - Para cada conta, obtém o saldo atual (mesma lógica do `useMetaBalance` / Meta API) e o orçamento diário em uso (último `budget_reviews.daily_budget_current` ou orçamento personalizado ativo).
   - Calcula `diasRestantes = saldo / orçamentoDiário`.
   - Filtra contas com `diasRestantes ≤ 3` e `diasRestantes > 0`.
   - Monta uma única mensagem agregada no Discord listando cada cliente, conta, saldo e dias restantes.
   - Envia via webhook/REST do Discord no canal central, com `@everyone`.
   - Registra execução em `system_logs` para auditoria.

2. **Deduplicação inteligente** (evitar spam 2x/dia repetindo o mesmo alerta):
   - Nova tabela `low_balance_alerts` (account_id, dias_restantes_no_alerta, sent_at).
   - Só re-alerta a mesma conta se: (a) passaram >12h E (b) os dias restantes pioraram ou voltou de "ok" para alerta.

3. **Agendamento**: cron job no Postgres (pg_cron + pg_net) chamando a função 2x ao dia (ex.: 09:00 e 15:00 horário Brasília).

4. **Mensagem no Discord** (formato):
   ```
   @everyone ⚠️ Alerta de saldo baixo — Meta Ads
   
   • Cliente X · Conta Principal — R$ 145,20 · ~2 dias
   • Cliente Y · Secundária — R$ 89,00 · ~1 dia
   
   Verifique e providencie a recarga.
   ```

## Detalhes técnicos

- **Secrets necessários** (a adicionar): `DISCORD_LOW_BALANCE_CHANNEL_ID` (ID do canal central). `DISCORD_TOKEN` já existe.
- **Envio Discord**: usa `POST https://discord.com/api/v10/channels/{channel_id}/messages` com header `Authorization: Bot ${DISCORD_TOKEN}` e `allowed_mentions: { parse: ["everyone"] }`.
- **Cálculo de saldo**: replica a lógica de `useMetaBalance` no edge function (usando `META_ACCESS_TOKEN` já existente) — busca `funding_source_details` / `balance` de cada `act_{account_id}` via Meta Graph API v24.0.
- **Orçamento diário**: prioriza `custom_budgets` ativo vinculado ao `account_id`, senão usa último `budget_reviews.daily_budget_current` da conta.
- **Migração**:
  - Cria tabela `low_balance_alerts` (id, account_id, client_id, dias_restantes, sent_at, message_id) com RLS para team members.
  - Cria cron `check-low-balance-alerts-am` e `check-low-balance-alerts-pm` em `cron.sql` (script SQL fornecido para o usuário rodar, pois contém URL/anon key).

## O que vou precisar do usuário antes de implementar

- **ID do canal Discord central** onde os alertas serão enviados (você adiciona depois via secret `DISCORD_LOW_BALANCE_CHANNEL_ID`).
- **Horários preferidos** das 2 verificações diárias (sugestão: 09:00 e 15:00 horário de Brasília).

## Fora do escopo

- Alertas para Google Ads (pode ser adicionado depois).
- Painel visual de histórico de alertas (apenas `system_logs` por enquanto).
- Marcação por cargo específico ou canal por cliente.
