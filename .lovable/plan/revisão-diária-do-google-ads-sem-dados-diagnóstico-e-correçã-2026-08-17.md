# Revisão diária do Google Ads sem dados — diagnóstico e correção

## O que foi confirmado hoje

- A execução de hoje (17/08, 12:00) rodou normalmente: 26 clientes Google processados e gravados em `budget_reviews`.
- **Todos os 26 registros estão zerados**: `daily_budget_current = 0`, `total_spent = 0`, `last_five_days_spent = 0` e `day_1..day_5 = 0`. No Meta, no mesmo dia, 27 de 28 registros têm gasto — ou seja, o problema é exclusivo do Google.
- `campaign_health` do Google de hoje também está zerada (26 linhas, 0 campanhas ativas, custo 0), enquanto o Meta traz 87 campanhas ativas.
- O refresh do OAuth funciona: `google_ads_access_token` foi atualizado às 12:00:03. As credenciais (`client_id`, `client_secret`, `refresh_token`, `developer_token`, `manager_id`) existem em `api_tokens`.
- A versão de API usada (`v21`) ainda está ativa nos servidores do Google — não é sunset de versão.
- Como as linhas de `campaign_health` foram gravadas, o código chegou ao fim do bloco de API **sem exceção**: as chamadas ao Google Ads retornaram respostas "não-ok" ou vazias, que o código atual descarta em silêncio.

**Diagnóstico ainda não confirmado:** falta o corpo de erro real devolvido pelo Google (tipicamente `AUTHENTICATION_ERROR`, `DEVELOPER_TOKEN_NOT_APPROVED`, `USER_PERMISSION_DENIED` ou `CUSTOMER_NOT_ENABLED`). Hoje esse texto não aparece em log algum, então o primeiro passo é fazê-lo aparecer.

## Problemas de código já identificados (causas prováveis de silêncio)

1. **Chave de expiração errada** — o código lê/atualiza `google_ads_token_expiry`, mas a chave existente no banco é `google_ads_token_expires_at`. O PATCH não atualiza nada e o token é renovado a cada execução (funciona, mas mascara problemas).
2. **Resposta mensal sem tratamento de erro** — o `fetch` do gasto do mês (`monthlyResponse`) só é lido quando `ok`; se falhar, nada é logado e `total_spent` fica 0.
3. **`fetchDailySpend` engole falhas** — cada dia retorna 0 em caso de erro, sem distinguir "sem gasto" de "chamada rejeitada".
4. **Catch geral silencioso** — o `catch` grava zeros e segue, sem registrar o erro em `system_logs` nem sinalizar na interface.

## Plano de correção

### Etapa 1 — Tornar a falha visível (diagnóstico)
- Em `daily-google-review`, logar sempre status HTTP + corpo de erro das chamadas ao Google Ads (nome da conta, gasto diário, gasto mensal, orçamentos, health).
- Registrar em `system_logs` (`event_type = 'google_review_api_error'`) o primeiro erro real de cada conta, com `customer_id`, status e mensagem do Google.
- Executar a revisão para 1 cliente Google e ler o erro exato nos logs da função.

### Etapa 2 — Corrigir conforme o erro encontrado
- Se for token/permissão: acertar `developer-token` e `login-customer-id`, ou regerar o refresh token pela tela de configurações.
- Se for conta inválida: normalizar `account_id` (remover hifens/espaços) e marcar contas inacessíveis.
- Se for query/campo: ajustar o GAQL.

### Etapa 3 — Corrigir os defeitos estruturais
- Unificar a chave de expiração em `google_ads_token_expires_at` (leitura e gravação).
- Deixar de gravar "0" como se fosse dado válido quando a API falhou: manter o valor anterior do dia ou marcar a revisão como falha, para o painel não exibir orçamento zerado como verdade.
- Propagar contagem de erros no retorno em lote, para o cabeçalho da revisão mostrar "X contas com falha".

## Detalhes técnicos

Arquivo principal: `supabase/functions/daily-google-review/index.ts`
- `ensureValidToken` (linhas ~18-127): chave de expiração.
- `fetchRealAccountName` (~172), `fetchDailySpend` (~269), consulta mensal (~932), orçamentos (~972), `fetchGoogleActiveCampaigns` (~386): adicionar log de status + corpo.
- `catch (apiError)` (~1029): gravar em `system_logs` e sinalizar falha na revisão.
