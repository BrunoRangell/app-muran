

## Diagnóstico

Os logs do console mostram:
```
TypeError: Failed to fetch
AuthRetryableFetchError: status: 0
```

E ao consultar os logs de autenticação do Supabase, **nenhuma requisição de login chegou ao servidor** (auth_logs vazio nas últimas tentativas).

Confirmei que:
- ✅ O endpoint `https://socrnutfpqtcjmetskta.supabase.co/auth/v1/health` está respondendo normalmente
- ✅ As Edge Functions estão configuradas com CORS correto
- ❌ As requisições de login do navegador não estão saindo / não chegam ao Supabase
- ❌ `status: 0` = a request foi bloqueada antes de receber qualquer resposta HTTP

**Isso não é um bug do código** — o código de login não foi alterado e o backend está saudável. É um problema de **conectividade / bloqueio entre o navegador do usuário e o domínio do Supabase**.

## Causas possíveis (ordem de probabilidade)

1. **Bloqueador de anúncios / extensão de privacidade** (uBlock, Brave Shields, Privacy Badger, Ghostery) bloqueando `*.supabase.co`
2. **Antivírus ou firewall corporativo** bloqueando o domínio
3. **DNS local** (cache ou DoH) sem resolver `socrnutfpqtcjmetskta.supabase.co`
4. **Provedor de internet** com bloqueio temporário
5. **Service worker antigo em cache** interceptando requests

## Plano de ação

### Passo 1 — Verificações que o usuário deve fazer (antes de mexer em código)
Pedir ao usuário para testar **nesta ordem**:

1. Abrir o app em **aba anônima/privada** (sem extensões) → se logar, é extensão
2. Testar em **outro navegador** (ex: Edge / Firefox)
3. Testar em **outra rede** (4G do celular como hotspot) → se logar, é firewall/DNS da rede
4. Abrir o DevTools → aba **Network** → tentar logar → ver se a request para `/auth/v1/token` aparece como `(blocked)` ou `(failed)`

Se em qualquer um desses cenários funcionar, o problema é local do ambiente, **não do app**.

### Passo 2 — Melhorias defensivas no código (se confirmar problema generalizado)

Vou adicionar:

**A. Tratamento específico no `Login.tsx`** para detectar `Failed to fetch` / `status: 0` e mostrar mensagem clara:
> "Não foi possível conectar ao servidor de autenticação. Verifique sua conexão, desative bloqueadores de anúncios ou tente em uma aba anônima."

**B. Health-check ao montar a página de login** — fazer um `fetch` leve para `https://socrnutfpqtcjmetskta.supabase.co/auth/v1/health` para detectar bloqueio **antes** do usuário tentar logar, e mostrar aviso na tela.

**C. Limpar service workers possivelmente em cache** no boot do app (registrar logout de SWs antigos se existirem).

## Arquivos a editar
- `src/pages/Login.tsx` — adicionar health-check e mensagem de erro específica para `Failed to fetch`
- `src/integrations/supabase/client.ts` — adicionar log mais claro quando o fetch falha em nível de rede

## O que NÃO é o problema
- ❌ Não é o código de login (não mudou e o erro é antes mesmo de chegar ao servidor)
- ❌ Não é o token Meta nem as edge functions recentes
- ❌ Não é o cadastro de membros
- ❌ Não é CORS do Supabase (o endpoint responde quando consultado fora do navegador)

## Pergunta importante antes de implementar
Preciso confirmar uma coisa para escolher o melhor caminho:

