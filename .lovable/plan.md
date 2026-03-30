

# Corrigir renovação automática do token Meta

## Diagnóstico completo

Analisei os logs e identifiquei **dois problemas**:

### Problema 1: Renovação "falsa" — o token não é realmente estendido
Os logs mostram que desde 26/03 às 20h, a função `refresh-meta-token` rodava a cada hora e logava "Token Meta renovado com sucesso" com `expires_in_days: 0`. A API do Meta retornava 200 com um token, mas **com a mesma data de expiração** (27/03 às 20:00).

Isso acontece porque tokens long-lived do Meta **não podem ser renovados infinitamente** via `fb_exchange_token`. Quando o token já está nos últimos 1-2 dias, a API retorna um token com a mesma validade — não estende. A função atual não verifica se a nova expiração é realmente maior que a anterior, então loga "sucesso" quando na verdade nada mudou.

### Problema 2: Loop de triggers em cascata
Quando `refresh-meta-token` atualiza o token em `api_tokens`, o trigger `trigger_convert_meta_token` dispara `convert-meta-token`, que também tenta fazer `fb_exchange_token`, atualizando `api_tokens` de novo → trigger de novo → loop. Os logs de 27/03 mostram dezenas de triggers disparados em sequência a cada 3 segundos.

## Solução

### 1. `supabase/functions/refresh-meta-token/index.ts`
- Após receber o novo token da API, **comparar a nova expiração com a anterior**
- Se a nova expiração não for pelo menos 7 dias maior que agora, marcar como `renewal_ineffective` em vez de `success`
- Inserir log claro em `system_logs` com evento `meta_token_renewal_ineffective` para alertar que é necessário gerar um novo token manualmente
- Não atualizar o `api_tokens` se a renovação não for efetiva (evita disparar o trigger loop desnecessariamente)

### 2. `supabase/functions/convert-meta-token/index.ts`
- Adicionar verificação: se o token já é long-lived e expira em mais de 7 dias, **não tentar converter novamente** (já faz isso parcialmente, mas o threshold precisa ser consistente)
- Evitar atualizar `api_tokens` se o token resultante for o mesmo ou com mesma expiração

### 3. Resumo das mudanças de lógica em `refresh-meta-token`

```text
ANTES:
  Chama fb_exchange_token → recebe token → salva em api_tokens → loga "sucesso"
  (mesmo que expiração não mude)

DEPOIS:
  Chama fb_exchange_token → recebe token → VERIFICA se nova expiração > agora + 7 dias
    SIM → salva token, loga "sucesso real"
    NÃO → NÃO salva token, loga "renovação ineficaz, token precisa ser gerado manualmente"
          → marca status como 'needs_manual_renewal' na metadata
```

## Arquivos editados
- `supabase/functions/refresh-meta-token/index.ts`
- `supabase/functions/convert-meta-token/index.ts`

