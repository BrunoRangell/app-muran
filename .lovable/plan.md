# Investigação e correções

## 1. Por que o token Meta não renovou automaticamente

### Diagnóstico (dados reais de `meta_token_metadata`)
- Última renovação **efetiva**: 22/05/26 13:00.
- Token expirava em: 29/05/26 13:27 (apenas **7 dias** após a última renovação).
- Última tentativa de renovação: 29/05/26 13:00 (27 min antes de expirar).
- Resposta da Meta: novo token expiraria em **0 dias** → marcada como `renewal_ineffective: true`.
- Status atual: `needs_manual_renewal` desde 29/05.
- O cron `meta-token-renewal-job` roda de hora em hora — ele continuou rodando, mas a API do Meta passou a devolver tokens sem extensão real.

### Causa raiz
**Limite de extensão da Meta:** long-lived tokens têm um teto duro (~60 dias desde a emissão original). Quando o token atinge esse teto, o endpoint `fb_exchange_token` ainda responde 200 OK, mas retorna um token que herda a mesma `expires_at` do atual — `expires_in` cai progressivamente até 0. A função `refresh-meta-token` detecta isso (linha 196: `newDaysRemaining < MIN_ACCEPTABLE_DAYS`) e marca `needs_manual_renewal`, mas **não dispara nenhum alerta visível para o time**, então o token simplesmente expirou sem ninguém saber.

### Solução
Adicionar **alerta proativo no Discord** quando a renovação ficar ineficaz OU faltarem ≤ 7 dias para expirar, replicando o padrão de `check-low-balance-alerts`.

**Mudanças:**

- `supabase/functions/refresh-meta-token/index.ts`
  - Quando entrar nos branches `expired`, `needs_manual_renewal` ou status `warning` com `daysRemaining ≤ 7`, enviar mensagem ao canal Discord existente (usar `DISCORD_TOKEN` + um canal — reaproveitar `DISCORD_LOW_BALANCE_CHANNEL_ID` ou pedir um novo `DISCORD_META_TOKEN_CHANNEL_ID`).
  - Deduplicar: gravar `last_alert_sent_at` em `meta_token_metadata.details` e não reenviar a mesma severidade num intervalo de 12h.
  - Mensagem: `@everyone 🚨 Token Meta precisa ser renovado MANUALMENTE — expira/expirou em <data>. Renove em Configurações → API Meta.`

- (Opcional, não vou fazer agora) Atualização do schedule do cron para também rodar 1×/dia mesmo se já estiver em `expired`, garantindo o alerta diário.

**Pergunta para você antes de implementar:** uso o canal Discord de saldo baixo (`DISCORD_LOW_BALANCE_CHANNEL_ID`) para esses alertas também, ou prefere criar um secret novo `DISCORD_META_TOKEN_CHANNEL_ID` apontando para um canal dedicado?

> ⚠️ Para o erro atual (token expirou em 29/05), você ainda precisa **renovar o token manualmente** em Configurações → API Meta. A correção acima só evita reincidência nas próximas vezes.

---

## 2. Não consigo salvar 2+ clientes com `account_id` vazio

### Causa raiz
A tabela `client_accounts` tem o constraint:
```sql
unique_account_per_platform UNIQUE (platform, account_id)
```
Quando você deixa o ID em branco, o front-end (`useBudgetManager.upsertClientAccount`) atualiza a linha existente gravando `account_id = ''` (string vazia). PostgreSQL trata `''` como valor real, então um segundo cliente com `(platform='meta', account_id='')` viola o UNIQUE. Confirmado no banco: já existe 1 linha Meta e 1 Google com `account_id=''` — qualquer nova tentativa quebra.

### Correção

**Migration SQL:**
1. Remover o constraint atual: `ALTER TABLE public.client_accounts DROP CONSTRAINT unique_account_per_platform;`
2. Criar índice parcial que só impõe unicidade em IDs realmente preenchidos:
   ```sql
   CREATE UNIQUE INDEX unique_account_per_platform
     ON public.client_accounts (platform, account_id)
     WHERE account_id IS NOT NULL AND account_id <> '';
   ```

Isso permite múltiplos registros com `account_id` vazio/NULL (clientes que pararam de anunciar numa plataforma), mas continua impedindo dois clientes com o mesmo ID Meta/Google real.

**Mudança no app** (`src/components/improved-reviews/hooks/useBudgetManager.ts`):
- Normalizar `account_id` antes de gravar: se a string for vazia (após trim), enviar `null` no `update`/`insert`. Mantém a coluna mais limpa e o índice parcial 100% efetivo.

### Validação
1. Aplicar migration.
2. Em "Orçamentos", limpar o ID Meta de 2 clientes diferentes e salvar — deve funcionar sem erro.
3. Tentar cadastrar o mesmo `account_id` real em 2 clientes — deve continuar bloqueado.
