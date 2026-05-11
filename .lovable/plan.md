## Diagnóstico

A revisão diária do Google Ads funciona porque o módulo `unified-meta-review` tem uma função (`manageGoogleAdsTokens`) que, antes de cada chamada à API do Google, verifica se o `google_ads_access_token` salvo no banco está perto de vencer e o renova automaticamente usando `google_ads_refresh_token` + `client_id` + `client_secret`.

Já a Edge Function do relatório de tráfego (`traffic-insights`) pega o `google_ads_access_token` direto da tabela `api_tokens` e usa como está, sem renovar. Como esse token expira em cerca de 1 hora, ele vive expirado e a API do Google devolve `401 UNAUTHENTICATED` para todos os clientes — confirmado nos logs:

```
[GOOGLE-API] HTTP 401: Request had invalid authentication credentials.
google_ads_token_expires_at: 2025-09-03 (vencido há meses)
```

O motivo de "às vezes funcionar" é que, logo depois de uma revisão diária rodar, o token fica fresco por uns minutos — depois disso, expira de novo.

## Plano de correção

Unificar o comportamento: o relatório passa a usar a mesma lógica de renovação que a revisão diária.

1. **Reaproveitar a renovação automática no `traffic-insights`**
   - Antes de chamar a API do Google, ler `google_ads_token_expires_at`.
   - Se estiver vencido (ou faltar menos de 5 min para vencer), renovar via `https://oauth2.googleapis.com/token` usando `refresh_token` + `client_id` + `client_secret`.
   - Salvar o novo token e a nova validade em `api_tokens`.
   - Usar esse token renovado em todas as chamadas Google do relatório (campanhas, demográficos, top ads e período anterior).

2. **Mensagens de erro mais claras**
   - Se faltar `refresh_token`, `client_id` ou `client_secret`, retornar erro explicando que a configuração do Google Ads está incompleta.
   - Se a renovação falhar, logar o motivo sem expor credenciais.
   - Continuar não quebrando o Meta quando o Google falhar em modo "ambas as plataformas".

3. **Validar**
   - Implantar a Edge Function `traffic-insights`.
   - Abrir o relatório de um cliente Google e confirmar nos logs que o token foi renovado e a chamada deixou de retornar 401.

## Arquivos envolvidos

- `supabase/functions/traffic-insights/google-insights.ts` (adicionar e usar a renovação de token)

Sem mudanças de banco, layout ou componentes React.