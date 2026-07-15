Plano para corrigir o aviso final da autorização MCP

1. Confirmar onde a falha acontece
- Validar se o erro ocorre depois de clicar em Aprovar no app, ou seja, no retorno para o conector/Lovable.
- Usar a referência exibida no alerta (`ofid_bb0f4eae...`) apenas como indício de falha no fluxo OAuth, sem expor dados sensíveis.

2. Verificar configuração OAuth do Supabase
- Conferir se o Authorization Server está ativo.
- Confirmar se o Authorization Path configurado no Supabase bate com as rotas públicas existentes:
  - `/oauth/consent`
  - `/.lovable/oauth/consent`
- Confirmar se o Site URL está em `https://app.muranmarketing.com.br`.
- Verificar se Dynamic OAuth Apps continua habilitado, pois conectores como Lovable/Claude precisam registrar cliente automaticamente.

3. Testar o endpoint MCP publicado
- Validar o endpoint:
  - `https://socrnutfpqtcjmetskta.supabase.co/functions/v1/mcp`
- Conferir os metadados OAuth expostos pelo MCP, principalmente issuer, protected resource e audience.
- Checar se o MCP está anunciando o issuer direto do Supabase:
  - `https://socrnutfpqtcjmetskta.supabase.co/auth/v1`

4. Revisar o fluxo do app
- Confirmar que a página de consentimento carrega detalhes da autorização com `supabase.auth.oauth.getAuthorizationDetails`.
- Confirmar que o botão Aprovar chama `approveAuthorization` e redireciona exatamente para a URL retornada pelo Supabase.
- Ajustar o login para preservar o retorno ao consentimento em todos os caminhos necessários, se ainda houver algum ponto perdendo o `returnTo`.

5. Conferir logs da Edge Function MCP
- Ler os logs recentes da função `mcp` durante a tentativa de vinculação.
- Procurar erros de token, issuer, audience, DCR, CORS, protected resource metadata ou callback OAuth.

6. Aplicar correção mínima
- Se for configuração: orientar/ajustar o valor correto no Supabase.
- Se for código: corrigir apenas a rota/redirect/issuer necessário.
- Depois, regenerar o manifesto MCP e redeployar a função `mcp`.

7. Validar novamente
- Repetir o vínculo pelo conector.
- Confirmar que o fluxo termina conectado, sem o aviso final.
- Se o erro persistir, usar a referência do alerta junto dos logs para isolar se a falha está no callback do conector ou na resposta OAuth do Supabase.