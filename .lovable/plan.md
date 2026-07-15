## Diagnóstico

O erro da imagem não parece ser da rota do app agora. A rota `/oauth/consent` já existe e carrega a página correta.

O problema atual é que a página carregou, mas o cliente Supabase do navegador não encontrou o namespace beta `supabase.auth.oauth`. Isso normalmente acontece por um destes motivos:

1. O Authorization Server OAuth 2.1 ainda não está habilitado no projeto Supabase; ou
2. A versão instalada de `@supabase/supabase-js` é antiga para expor `supabase.auth.oauth` no frontend.

## Plano

1. **Habilitar OAuth 2.1 no Supabase**
   - Ativar o Authorization Server do projeto Supabase usado pelo Muran APP.
   - Isso é necessário para Claude/ChatGPT/Cursor conseguirem abrir a tela de consentimento e trocar tokens OAuth.

2. **Atualizar o SDK Supabase se necessário**
   - Atualizar `@supabase/supabase-js` para uma versão que exponha `supabase.auth.oauth`.
   - Manter o client atual e o `storageKey` existente para não quebrar login.

3. **Validar a rota de consentimento**
   - Confirmar que `/oauth/consent?authorization_id=...` continua pública.
   - Confirmar que usuários sem sessão são enviados para `/login?returnTo=...` e voltam para a tela de consentimento após login.

4. **Reextrair e redeployar o MCP**
   - Regenerar o manifesto MCP.
   - Redeployar a Edge Function `mcp`, porque alterações de MCP/OAuth precisam refletir no endpoint usado pelo Claude.

## Depois da correção

Você deve tentar vincular novamente no Claude usando:

```text
https://socrnutfpqtcjmetskta.supabase.co/functions/v1/mcp
```

Se o Supabase pedir Client ID/Client Secret, use o OAuth App criado no painel do Supabase com redirect URI:

```text
https://claude.ai/api/mcp/auth_callback
```