## Diagnóstico

O arquivo `check-campaign-health-alerts/index.ts` já foi editado com o novo formato (`Status: {status traduzido}`), mas a execução manual via curl pegou a versão anterior porque rodou antes do deploy automático completar. A mensagem que chegou no Discord ainda mostra `0 impressões e R$ 0,00 gasto hoje`.

## Ação

1. Forçar redeploy da função `check-campaign-health-alerts` com `supabase--deploy_edge_functions`.
2. Re-disparar a função via curl.
3. Você confere no Discord se a nova mensagem chegou no formato:

```
> • Cliente | Google Ads | Nome da campanha - Status: Ativa
```

Sem mudanças adicionais de código — só redeploy e validação.  
  
Depois me responda se agora também vamos salvar o status oficial das campanhas de Google também.