## Problema

A edge function `check-low-balance-alerts` retorna `500 — DISCORD_TOKEN ou DISCORD_LOW_BALANCE_CHANNEL_ID não configurado`, mesmo com os dois secrets já cadastrados no projeto. Isso acontece porque o runtime da função foi inicializado antes dos secrets ficarem disponíveis e está com o cache antigo de variáveis de ambiente.

Os cron jobs (jobid 37 e 38) estão ativos e disparando, mas como a função falha logo no início, nada chega ao Discord e nada vai para a tabela `low_balance_alerts`.

## Plano

1. **Forçar redeploy do `check-low-balance-alerts`** alterando o arquivo `supabase/functions/check-low-balance-alerts/index.ts` (uma pequena adição: log inicial com a presença — não o valor — dos dois secrets, para facilitar diagnósticos futuros). Qualquer mudança no arquivo dispara um novo deploy automático e reinicia o runtime com os secrets atuais.

2. **Testar manualmente** via `curl` na edge function logo após o deploy e confirmar:
   - Resposta `200` com `{ ok: true, ... }`
   - Logs da função aparecendo no dashboard
   - Mensagem chegando no canal Discord `1508455135754457138` (se houver alguma conta com ≤3 dias) **ou** retorno `alerts: 0` se não houver nenhuma conta no threshold.

3. **Se após o redeploy ainda houver erro**, investigar:
   - Valor do `DISCORD_LOW_BALANCE_CHANNEL_ID` (confirmar que é o ID `1508455135754457138`)
   - Permissões do bot no canal (precisa ter "View Channel", "Send Messages" e "Mention Everyone")
   - Status code retornado pela Discord API nos logs

## Observação sobre teste real

Para validar de ponta a ponta sem esperar uma conta cair para ≤3 dias, posso opcionalmente subir temporariamente o `THRESHOLD_DAYS` (ex: para 30) só para forçar o envio de uma mensagem real, e depois reverter para `3`. Confirma se quer que eu faça essa validação extra junto?
