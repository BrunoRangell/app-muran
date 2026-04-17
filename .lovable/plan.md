

## Diagnóstico definitivo

Os logs confirmam uma única coisa muito clara:

- **Origin**: `https://02114261-002e-44ce-93fa-c4c883dceaed.lovableproject.com` (Preview do Lovable, não o domínio próprio)
- **Stack trace**: `at Xl.window.fetch (https://cdn.gpteng.co/lovable.js:8:76615)` → o erro acontece DENTRO do `lovable.js`, antes da request sair
- **40+ tentativas de POST `/auth/v1/token?grant_type=refresh_token`** todas falhando com `Failed to fetch`
- O usuário disse que está usando `app.muranmarketing.com.br`, mas o preview que estamos vendo está rodando o Preview Lovable

Isso é **regressão conhecida do `lovable.js`** no Preview, documentada inclusive na própria knowledge base do Lovable. O fallback que tentei adicionar (`__nativeFetch`) não está funcionando porque o `lovable.js` carrega como `<script type="module">` e pode estar sobrescrevendo `window.fetch` DEPOIS do nosso script inline rodar — ou o nosso bypass só ativa após a 1ª falha, então as primeiras dezenas de tentativas de refresh ainda passam pelo proxy quebrado e travam o app inteiro num loop.

E mais importante: **mesmo no domínio próprio**, o usuário tem um `refresh_token` antigo armazenado (`3ezrqcnbn5mo`) que o Supabase está tentando trocar repetidamente. Como o cliente Supabase tem `autoRefreshToken: true`, ele entra em loop assim que detecta uma sessão local inválida — independente da rede.

## Causa raiz combinada

1. **No Preview**: `lovable.js` quebra POSTs de auth (regressão do proxy).
2. **No domínio próprio**: o `refresh_token` armazenado (`3ezrqcnbn5mo`) é inválido/expirado, e o cliente entra em loop tentando renovar.
3. O botão "Limpar sessão" só limpa as chaves `sb-*` e `muran-auth-token`, mas o Supabase **recria o estado em memória imediatamente** porque o `supabase` global já foi instanciado com `autoRefreshToken: true` e tem listeners ativos.

## Plano de correção (definitivo)

### 1. Forçar bypass do proxy IMEDIATAMENTE em todas as requests de auth
Em `src/integrations/supabase/client.ts`:
- Mudar `proxyFailureCount >= 1` para usar **`nativeFetch` SEMPRE** em qualquer URL `/auth/v1/`. Sem condicional, sem contador. O `lovable.js` proxy não pode tocar em nada de autenticação.
- Adicionar log de qual fetch está sendo usado (para confirmar no console).

### 2. Tornar "Limpar sessão" realmente eficaz
Em `src/pages/Login.tsx` (handler `handleResetSession`):
- Chamar `supabase.auth.signOut({ scope: 'local' })` ANTES de limpar storage (para parar loops de refresh em memória)
- Limpar chaves de storage
- Forçar `window.location.reload()` para reinstanciar o cliente Supabase do zero

### 3. Quebrar o loop de refresh quando o token está corrompido
Em `src/integrations/supabase/client.ts`:
- Detectar erro `invalid_grant` / `refresh_token_not_found` na resposta de `/auth/v1/token` e auto-limpar a sessão local (em vez de continuar tentando)

### 4. Auto-limpar sessão na tela de login
Em `src/pages/Login.tsx` (no `useEffect` inicial):
- Se a URL atual é `/login` E existe token armazenado E `getSession()` falha por rede → limpar automaticamente sem precisar do clique

## Arquivos a editar
- `src/integrations/supabase/client.ts` — bypass total do proxy em auth + detecção de refresh_token inválido
- `src/pages/Login.tsx` — `handleResetSession` com `signOut` + reload, e auto-limpeza no mount

## Resultado esperado
- O loop de 40+ requests para `/token?grant_type=refresh_token` para imediatamente
- O botão "Limpar sessão" realmente reseta o estado
- O login funciona tanto no Preview quanto no domínio próprio
- Se a equipe estiver no link errado (Preview), funciona mesmo assim graças ao bypass total

