
# Plano: Resolver Erro de CORS Persistente no Dominio Customizado

## Diagnostico Completo

Apos analise profunda, confirmei os seguintes pontos:

### 1. Correcao CSP Aplicada Corretamente
O arquivo `src/components/auth/SecurityHeaders.tsx` (linha 13) ja contem a CSP expandida:
```
connect-src 'self' https://socrnutfpqtcjmetskta.supabase.co https://*.supabase.co wss://*.supabase.co;
```

### 2. Edge Function Funcionando
Teste direto da Edge Function `unified-meta-review` via curl confirmou que ela:
- Responde corretamente com headers CORS
- Retorna erro 500 para UUID invalido (comportamento esperado)
- Esta operacional no servidor

### 3. Causa Raiz Identificada
O erro de CORS persiste porque:
- **O projeto NAO foi republicado** apos a correcao da CSP, OU
- **Cache do Netlify/Cloudflare** esta servindo a versao antiga do HTML/JS
- O navegador ainda carrega o bundle antigo com a CSP restritiva

### 4. Arquivo Pendente - API v23.0
Encontrei mais uma Edge Function usando versao antiga da API Meta:
- `supabase/functions/create-meta-audiences/index.ts` usa `v23.0` (linha 4)

---

## Solucao em 3 Partes

### Parte 1: Atualizar API Meta Restante

**Arquivo:** `supabase/functions/create-meta-audiences/index.ts`

| Linha | Antes | Depois |
|-------|-------|--------|
| 4 | `const GRAPH_API_VERSION = "v23.0";` | `const GRAPH_API_VERSION = "v24.0";` |

### Parte 2: Criar Arquivo de Headers HTTP para Netlify

Para garantir que os headers CORS e CSP sejam aplicados corretamente no nivel do servidor (mais robusto que meta tags), criar o arquivo:

**Arquivo:** `public/_headers`

```text
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://socrnutfpqtcjmetskta.supabase.co https://*.supabase.co wss://*.supabase.co;
```

Este arquivo sera lido automaticamente pelo Netlify durante o deploy e aplicara os headers em todas as respostas HTTP.

### Parte 3: Instrucoes de Deploy e Cache

Apos aprovar o plano e as mudancas serem aplicadas:

1. **Publicar o projeto** no Lovable (botao Publish)
2. **Limpar cache do Netlify**:
   - Acessar Netlify Dashboard > Deploys
   - Clicar em "Trigger deploy" > "Clear cache and deploy site"
3. **Limpar cache do Cloudflare** (se aplicavel):
   - Acessar Cloudflare Dashboard > Caching > Configuration
   - Clicar em "Purge Everything"
4. **Testar em janela anonima** para evitar cache do navegador

---

## Resumo das Alteracoes

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `supabase/functions/create-meta-audiences/index.ts` | Correcao | Atualizar Meta API de v23.0 para v24.0 |
| `public/_headers` | Novo | Headers HTTP para Netlify com CSP e seguranca |

---

## Resultado Esperado

- Revisoes individuais funcionarao no dominio customizado (app.muranmarketing.com.br)
- Headers de seguranca aplicados no nivel do servidor (mais robusto)
- Todas as Edge Functions usando Meta API v24.0 (conformidade com email da Meta)
- Fim dos erros de CORS para chamadas ao Supabase Functions

---

## Detalhes Tecnicos

### Por que headers HTTP sao melhores que meta tags para CSP?

1. **Prioridade**: Headers HTTP tem precedencia sobre meta tags
2. **Timing**: Headers sao aplicados ANTES do HTML ser parseado
3. **Cobertura**: Afetam todos os recursos, incluindo service workers
4. **Cloudflare**: Alguns proxies podem remover/ignorar meta tags

### Diagrama do Fluxo de Requisicao

```text
[Browser] --> [Cloudflare CDN] --> [Netlify] --> [Supabase Edge Functions]
    |              |                   |
    |              |                   +-- _headers aplica CSP
    |              +-- Cache pode servir versao antiga
    +-- Valida CSP ANTES de fazer fetch
```
