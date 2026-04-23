

# Tornar o portal do cliente realmente público (estilo Reportei/Windsor)

## Você está absolutamente certo no diagnóstico de raiz — mas a causa não é o Meta Developers

A boa notícia: **nada tem a ver com seu app do Meta estar vinculado ao seu perfil**. O token Meta que usamos é um token de sistema armazenado em `api_tokens`, compartilhado por todas as requisições do servidor. Ele funciona igual para qualquer pessoa.

## Por que Reportei e Windsor "funcionam" e o nosso não

Esses sistemas seguem um padrão chamado **"backend-mediated public access"**:

```text
┌─────────────┐         ┌──────────────────┐         ┌──────────┐
│ Visitante   │────────▶│  Backend valida  │────────▶│ Meta API │
│ sem login   │ /token  │  o token público │  token  │ Google   │
└─────────────┘         │  e busca dados   │  master └──────────┘
                        │  com credencial  │
                        │  do dono da conta│
                        └──────────────────┘
```

O visitante **nunca** fala direto com Meta/Google. O backend autentica o link público, valida que está ativo, e usa as credenciais do dono para ir buscar os dados.

## Como o nosso está hoje (3 problemas bloqueantes)

Identifiquei 3 barreiras que fazem a página ficar vazia para terceiros:

### 1. A edge function `traffic-insights` exige login (JWT)
Em `supabase/config.toml`, todas as outras funções públicas (`unified-meta-review`, `refresh-meta-token`, etc.) têm `verify_jwt = false`. A `traffic-insights` está faltando — então ela bloqueia qualquer requisição sem token de usuário logado.

### 2. RLS bloqueia leitura de `clients` e `client_accounts`
As políticas atuais exigem `is_team_member()` para qualquer SELECT. Quando o portal carrega:
- `useClientAccounts(clientId)` falha → não traz as contas Meta/Google
- Dados do cliente também não carregam

### 3. A edge function não valida o `accessToken` do portal
Hoje, mesmo se fosse pública, qualquer um poderia chamá-la passando qualquer `clientId`. Falta a verificação: "esse `accessToken` realmente dá direito a ver esse cliente?"

## Plano de correção

### Mudança 1 — Tornar `traffic-insights` pública
Adicionar em `supabase/config.toml`:
```toml
[functions.traffic-insights]
verify_jwt = false
```

### Mudança 2 — Validar acesso pelo `accessToken` dentro da edge function
Modificar `supabase/functions/traffic-insights/index.ts` para aceitar um parâmetro opcional `portalAccessToken`:

- **Se vier `portalAccessToken`**: validar que existe em `client_portals` com `is_active = true` E que o `client_id` solicitado bate com o do portal. Só então prossegue.
- **Se não vier**: exigir que a chamada tenha JWT válido de team member (modo interno atual).

Isso mantém segurança: ninguém consegue consultar dados arbitrários, só o cliente cujo link foi compartilhado.

### Mudança 3 — Permitir leitura pública de `clients` e `client_accounts` via portal válido
Criar uma **função RPC SECURITY DEFINER** que retorna os dados necessários do cliente e suas contas, validando o `accessToken`:

```sql
CREATE FUNCTION public.get_portal_client_data(_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_portal record;
  v_result jsonb;
BEGIN
  SELECT cp.*, c.id as client_id, c.company_name 
  INTO v_portal
  FROM client_portals cp
  JOIN clients c ON c.id = cp.client_id
  WHERE cp.access_token = _token AND cp.is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Portal não encontrado');
  END IF;
  
  -- Retorna cliente + contas em uma única chamada
  SELECT jsonb_build_object(
    'client', jsonb_build_object('id', v_portal.client_id, 'company_name', v_portal.company_name),
    'accounts', COALESCE(jsonb_agg(ca.*), '[]'::jsonb)
  ) INTO v_result
  FROM client_accounts ca
  WHERE ca.client_id = v_portal.client_id AND ca.status = 'active';
  
  RETURN v_result;
END;
$$;
```

Como é `SECURITY DEFINER`, ela bypassa o RLS de forma controlada — só expõe dados se o token for válido.

### Mudança 4 — Atualizar hooks no frontend para modo portal
- `useClientAccounts` e `useUnifiedData`: detectar `isPortalMode` e, se sim, usar a nova RPC `get_portal_client_data` em vez das queries diretas que esbarram no RLS.
- `useTrafficInsights`: passar `portalAccessToken` no body quando estiver em modo portal.

## Arquivos a editar
- `supabase/config.toml` — adicionar `verify_jwt = false` para `traffic-insights`
- Migração SQL — criar função `get_portal_client_data`
- `supabase/functions/traffic-insights/index.ts` — aceitar e validar `portalAccessToken`
- `src/hooks/useTrafficInsights.ts` — propagar `portalAccessToken`
- `src/hooks/useClientAccounts.ts` — usar RPC em modo portal
- `src/pages/TrafficReports.tsx` — passar `accessToken` para os hooks quando em portal mode

## Resultado esperado
Após essas mudanças, qualquer pessoa com o link `https://app.muranmarketing.com.br/cliente/empresa-x` verá os dados em tempo real — exatamente como Reportei/Windsor — sem login e sem precisar de permissões no Meta Developers. Sua conta Meta segue sendo a única "fonte" dos dados, mas isso é totalmente transparente para o visitante.

