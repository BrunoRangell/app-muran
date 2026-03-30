

# Diagnóstico: Erro "Meta API error: 400 - Bad Request"

## Problema identificado
Os logs da edge function mostram que a revisão falha ao chamar a Meta Graph API em `fetchAccountBasicInfo`. A API retorna **400 Bad Request** para as contas:
- `1278314109870177` (Aracuri Vinhos)
- `164389748262435` (outro cliente)

## Causa provável
Um erro 400 da Meta Graph API geralmente significa:
1. **Token expirado ou inválido** — o token de acesso Meta perdeu validade
2. **Permissões removidas** — o token não tem mais acesso a essas contas
3. **Conta desativada/suspensa** no Meta Ads

## O que falta no código atual
Na linha 628-630 do `meta-api.ts`, quando a API retorna erro, o código **não lê o corpo da resposta** — apenas loga o status code. Sem o corpo, não sabemos o erro exato do Meta (ex: `OAuthException`, `Error validating access token`, etc.).

## Correção proposta

### Arquivo: `supabase/functions/unified-meta-review/meta-api.ts` (linhas 628-631)
Adicionar leitura do corpo do erro antes de lançar a exceção:

```typescript
const response = await fetch(basicInfoUrl);
if (!response.ok) {
  const errorBody = await response.text();
  console.error(`❌ [META-API] Erro 400 da API Meta - Body:`, errorBody);
  throw new Error(`Meta API error: ${response.status} - ${response.statusText} | ${errorBody}`);
}
```

Isso vai nos permitir ver nos logs **exatamente** o que a Meta está retornando (token expirado, permissão negada, conta inválida, etc.) e tomar a ação correta.

## Próximos passos após o deploy
1. Rodar a revisão novamente para o cliente com erro
2. Verificar os logs da edge function para ver o corpo do erro da Meta
3. Com base no erro específico, corrigir (renovar token, reautorizar conta, etc.)

## Arquivo editado
- `supabase/functions/unified-meta-review/meta-api.ts` — adicionar log do corpo do erro da API Meta

