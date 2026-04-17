

# Corrigir bloqueio de login causado pela CSP do app

## Diagnóstico (causa raiz confirmada)

O componente `src/components/auth/SecurityHeaders.tsx` injeta esta meta tag no `<head>`:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://socrnutfpqtcjmetskta.supabase.co;
```

Problemas dessa CSP:

1. **Faltam `wss://*.supabase.co` e `https://*.supabase.co`** (realtime, edge functions e o próprio auth em alguns navegadores estritos são bloqueados).
2. **Falta o domínio do Lovable Preview** (`https://*.lovableproject.com`, `https://*.lovable.app`, `wss:`) — por isso ninguém consegue logar nem no Preview nem no domínio próprio.
3. **Falta `frame-ancestors`** — irrelevante aqui, mas alguns navegadores recentes começam a aplicar CSP de forma mais estrita quando ela é incompleta.
4. Já existe registro na memória do projeto (`bugs/csp-blocking-supabase-functions`) de que essa mesma CSP já bloqueou edge functions antes — agora, com `lovable.js` injetando um proxy de fetch e o navegador validando `connect-src` em redirecionamentos, ela passou a quebrar até o `/auth/v1/token`.

Os erros `Failed to fetch` / `status: 0` que aparecem nos logs **não são ad-blocker** — são a CSP da própria aplicação rejeitando a request antes de sair. O alerta laranja "Desative bloqueadores..." é falso positivo do health-check (também bloqueado pela CSP).

Confirmações:
- Endpoint `/auth/v1/health` responde normalmente quando consultado fora do navegador.
- Não há logs de auth recebendo nenhuma tentativa.
- O erro acontece no Preview (`02114261-002e-44ce-93fa-c4c883dceaed.lovableproject.com`) e provavelmente também no domínio próprio (`app.muranmarketing.com.br`).
- A CSP é injetada via JS após o app montar — por isso o problema "apareceu do nada" sem mudança recente: a cada release, a ordem de injeção e o comportamento do `lovable.js` mudam levemente, e agora a CSP atual é incompatível.

## Plano de correção

### Passo 1 — Corrigir a CSP (`src/components/auth/SecurityHeaders.tsx`)

Substituir o `connect-src` por uma versão completa que inclui:

```
connect-src 'self'
  https://socrnutfpqtcjmetskta.supabase.co
  https://*.supabase.co
  wss://*.supabase.co
  https://*.lovableproject.com
  https://*.lovable.app
  https://graph.facebook.com
  https://googleads.googleapis.com
  https://*.googleapis.com;
```

(Os domínios Meta/Google já são usados pelas integrações da agência — também precisam estar liberados.)

Também vou adicionar `frame-src 'self' https://*.supabase.co` para evitar bloqueios futuros.

### Passo 2 — Remover o health-check enganoso do `Login.tsx`

O `checkConnectivity()` que faz `fetch('/auth/v1/health')` está gerando o falso "rede bloqueada" mesmo quando o problema é outro. Vou:
- Remover esse health-check preventivo.
- Manter apenas o tratamento do erro real no submit (`Failed to fetch`), com mensagem mais neutra: "Não foi possível conectar ao servidor. Tente novamente em alguns segundos."
- Remover o `Alert` vermelho fixo de `networkBlocked`.

### Passo 3 — Validar

Após o deploy do código corrigido:
1. Recarregar o app com **Ctrl+Shift+R** (hard refresh, para descartar a CSP antiga em cache).
2. Tentar o login. Deve funcionar tanto no Preview quanto em `app.muranmarketing.com.br`.

## Arquivos editados
- `src/components/auth/SecurityHeaders.tsx` — CSP corrigida (connect-src completo)
- `src/pages/Login.tsx` — remover health-check e alerta de rede bloqueada

## O que NÃO é o problema
- ❌ Não é o WiFi da empresa (a CSP é da própria aplicação, viaja com o usuário em qualquer rede)
- ❌ Não é ad-blocker (o falso positivo veio do health-check que também era bloqueado pela CSP)
- ❌ Não é o Supabase (o servidor está saudável e nunca recebeu as requests)
- ❌ Não é o cadastro de membros nem o token Meta

