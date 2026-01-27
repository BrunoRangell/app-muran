
# Plano: Corrigir Bloqueio CSP que Impede Revisoes Manuais no Dominio Proprio

## Problema Identificado

O arquivo `src/components/auth/SecurityHeaders.tsx` define uma **Content-Security-Policy (CSP)** que esta bloqueando as requisicoes para as Edge Functions do Supabase no ambiente de producao (app.muranmarketing.com.br).

O erro `TypeError: Failed to fetch` dentro do `FunctionsFetchError` indica que a requisicao HTTP esta sendo **bloqueada antes de sair do navegador**, tipico de politicas de seguranca CSP.

### Por que funciona no Preview do Lovable?
- O ambiente de preview pode ter politicas de seguranca mais permissivas ou ignorar meta tags CSP

### Por que as revisoes automaticas funcionam?
- Cron jobs executam via `net.http_post` no PostgreSQL, server-side, sem passar pelo navegador

### Por que o dominio customizado bloqueia?
- No Netlify/Cloudflare, a CSP via meta tag e respeitada rigidamente pelo navegador

---

## Solucao

### Arquivo: `src/components/auth/SecurityHeaders.tsx`

**Problema atual (linha 13):**
```typescript
{ httpEquiv: "Content-Security-Policy", content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://socrnutfpqtcjmetskta.supabase.co;" }
```

**Correcao:**
Expandir a diretiva `connect-src` para incluir explicitamente:
1. WebSockets do Supabase Realtime (`wss://`)
2. Subdominio de funcoes (ja coberto, mas vamos deixar explicito)
3. Fonte do Google Fonts

```typescript
{ 
  httpEquiv: "Content-Security-Policy", 
  content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://socrnutfpqtcjmetskta.supabase.co https://*.supabase.co wss://*.supabase.co;" 
}
```

### Alteracoes principais na CSP:

| Diretiva | Antes | Depois |
|----------|-------|--------|
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | `+ https://cdn.gpteng.co` |
| `style-src` | `'self' 'unsafe-inline'` | `+ https://fonts.googleapis.com` |
| `font-src` | (nao existia) | `'self' https://fonts.gstatic.com` |
| `img-src` | `'self' data: https:` | `+ blob:` |
| `connect-src` | `'self' https://socrnutfpqtcjmetskta.supabase.co` | `+ https://*.supabase.co wss://*.supabase.co` |

---

## Alternativa mais segura: Remover CSP via meta tag

Como alternativa, podemos **remover completamente a CSP via meta tag** e configurar diretamente no Netlify/Cloudflare via headers HTTP (mais robusto e recomendado para producao).

Se preferir, posso:
1. Remover a CSP do `SecurityHeaders.tsx`
2. Criar um arquivo `public/_headers` para Netlify ou configuracao equivalente

---

## Resumo

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/components/auth/SecurityHeaders.tsx` | Correcao | Expandir `connect-src` para permitir chamadas a Edge Functions |

---

## Resultado Esperado

Apos a correcao:
- Revisoes manuais funcionarao no app.muranmarketing.com.br
- Chamadas para `supabase.functions.invoke()` nao serao bloqueadas
- Consistencia entre ambiente de preview e producao
