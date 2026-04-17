

# Investigar erro de login — possivelmente bloqueio do Preview Lovable

## Diagnóstico

Os logs mostram um padrão muito específico:

```
Origin: https://02114261-002e-44ce-93fa-c4c883dceaed.lovableproject.com
TypeError: Failed to fetch
    at Xl.window.fetch (https://cdn.gpteng.co/lovable.js:8:76615)
```

Todas as requisições estão saindo do **Preview do Lovable** (`*.lovableproject.com`), e o stack trace mostra que o erro ocorre **dentro do `lovable.js`** — o script que o Lovable injeta para fazer hot-reload e proxy de fetch. Esse script está interceptando o `window.fetch` e falhando antes mesmo de a request sair do navegador.

A documentação interna do Lovable confirma exatamente esse cenário:
> The Lovable Preview environment injects a fetch proxy that intercepts and breaks Supabase authentication POST requests to `/auth/v1/token`. This results in "Failed to fetch" errors with a status of 0.

**Isso explica perfeitamente:**
- Por que `app-muran.lovable.app` (publicado) e `app.muranmarketing.com.br` (domínio próprio) **não têm o `lovable.js` injetado** → não devem estar com esse problema.
- Por que apenas o Preview falha hoje: o proxy de fetch teve uma regressão.
- Por que o reset do roteador foi coincidência: o problema é do proxy, não da rede.
- Por que o GET de health-check às vezes passa mas o POST de `/token` não: o proxy bloqueia POSTs específicos com headers de auth.

## Pergunta crítica antes de qualquer código

Preciso confirmar **em qual URL** a equipe está acessando o app. Se estiverem usando o link do Preview (`02114261-002e-44ce-93fa-c4c883dceaed.lovableproject.com`), a correção é simplesmente **trocar o link** que estão usando — não há bug no código.

## Plano

### Passo 1 — Confirmar com o usuário (essencial)

Perguntar exatamente em qual URL a equipe está tentando logar. As 3 possibilidades são:
- **Preview Lovable**: `https://...lovableproject.com` ou `https://id-preview--....lovable.app` → bug do Lovable, não do app
- **Publicado Lovable**: `https://app-muran.lovable.app` → deve funcionar normal
- **Domínio próprio**: `https://app.muranmarketing.com.br` → deve funcionar normal

### Passo 2A — Se estiverem no Preview
**Solução imediata**: instruir a equipe a usar o domínio próprio (`app.muranmarketing.com.br`) ou o publicado (`app-muran.lovable.app`). Esses dois **não carregam o `lovable.js`** e não têm esse problema.

Compartilhar com a equipe a URL correta e adicionar aos favoritos. Esse link de Preview nunca deveria ter sido usado em produção — ele é só para desenvolvimento.

### Passo 2B — Se estiverem no domínio próprio e mesmo assim falhar
Aí é outro problema (provavelmente CSP ou bloqueio de rede). Vou:
1. Inspecionar o stack trace nesse cenário (deve ser diferente — não passar mais por `lovable.js`).
2. Investigar se a CSP está sendo aplicada corretamente no domínio próprio.
3. Considerar remover/relaxar a CSP do `SecurityHeaders.tsx` se ela estiver bloqueando algo.

### Passo 3 — Defesa adicional (independente do cenário)
Adicionar fallback defensivo no `client.ts`: caso o `lovable.js` proxy esteja interferindo no fetch e detectarmos `Failed to fetch` 3+ vezes seguidas, fazer **bypass** chamando o `fetch` original (`window.fetch.bind(window)` capturado **antes** de qualquer script externo carregar). Isso protege contra futuras regressões do proxy.

## Arquivos potencialmente afetados (Passo 2B / Passo 3)
- `src/integrations/supabase/client.ts` — capturar fetch original antes do proxy
- `src/components/auth/SecurityHeaders.tsx` — eventualmente remover CSP via meta (CSP via meta tem várias limitações; o ideal é via header HTTP, fora do nosso alcance no Lovable)

## Pergunta para o usuário

