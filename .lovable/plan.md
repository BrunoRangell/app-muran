# Corrigir falha de autorização do Claude no MCP

## Sintoma
Após aprovar o consentimento em `app.muranmarketing.com.br/oauth/consent`, o Claude mostra:
> "A autorização com APP Muran - Lovable falhou... ofid_fc1394c2c696feca"

Isso indica que o Claude concluiu o redirect mas falhou ao **trocar o `code` por token** no endpoint `/oauth/token` do Supabase (ou o `id_token`/audience não bateu).

## Causas prováveis (em ordem)

1. **Método de autenticação do client OAuth incompatível**  
   O client "Claude - Muran APP" no Supabase provavelmente está com `token_endpoint_auth_method = client_secret_basic`, mas o Claude envia via `client_secret_post` (ou vice-versa). Como usamos DCR (Dynamic Client Registration), o correto é deixar o Supabase permitir o método que o Claude registrou automaticamente — não criar um client manual.

2. **Client duplicado / manual conflitando com DCR**  
   Se existe um client "Claude - Muran APP" criado manualmente, ele pode estar competindo com o client dinâmico que o Claude registra. O Claude sempre usa o `client_id` que ele mesmo registrou via DCR.

3. **Audience/issuer do token não bate com o MCP**  
   Nosso `defineMcp` valida `acceptedAudiences: "authenticated"` e `issuer: https://socrnutfpqtcjmetskta.supabase.co/auth/v1`. Se o token emitido não tiver esse `aud`/`iss`, o MCP recusa.

## Passos de diagnóstico e correção

### 1. Remover client OAuth manual
No Supabase Dashboard → Authentication → OAuth Server → **OAuth Apps**:
- **Apagar** qualquer app criado manualmente para o Claude (incl. "Claude - Muran APP").
- Deixar apenas **Allow Dynamic OAuth Apps: enabled**. O Claude registrará seu próprio client automaticamente.

### 2. Retentar o fluxo no Claude
- No Claude, remover a integração antiga "APP Muran - Lovable".
- Adicionar novamente com URL: `https://socrnutfpqtcjmetskta.supabase.co/functions/v1/mcp`.
- Autorizar → aprovar consentimento → aguardar retorno.

### 3. Se ainda falhar, coletar evidências
- Logs da edge function `mcp` (Supabase Dashboard → Functions → mcp → Logs) filtrando por `token`, `audience`, `issuer`, `401`, `invalid_client`.
- Logs do Auth (Supabase → Logs → Auth) filtrando por `/oauth/token` no momento do teste.
- Comparar `iss`/`aud` do access_token retornado (decodificar em jwt.io) com o esperado no `defineMcp`.

### 4. Ajustes possíveis no código (apenas se logs indicarem)
- Se `aud` do token do Supabase não for `"authenticated"`, ajustar `acceptedAudiences` em `src/lib/mcp/index.ts` para o valor real observado.
- Se `iss` publicado divergir, corrigir `issuer` no mesmo arquivo, regerar manifest e redeployar `mcp`.

## Detalhes técnicos
- Arquivos possivelmente tocados: `src/lib/mcp/index.ts` (só se logs indicarem mismatch de `iss`/`aud`).
- Comandos: `app_mcp_server--extract_mcp_manifest` + `supabase--deploy_edge_functions(["mcp"])` após qualquer mudança no MCP.
- Nenhum código será alterado antes de você confirmar o passo 1 e retestar.

## Próxima ação sua
Confirmar se posso avançar para o passo 1 (remover client manual e retestar). Se após o retest ainda falhar, eu leio os logs da função `mcp` e do Auth para identificar mismatch de audience/issuer.
