
# Diagnóstico: Erro "FunctionsFetchError" apenas na versão publicada via GitHub

## Análise do Problema

### O que foi verificado:
1. **Edge Functions funcionando**: Testei diretamente a `unified-meta-review` e ela retornou status 200 com sucesso
2. **CORS configurado corretamente**: Ambas as funções têm `Access-Control-Allow-Origin: '*'`
3. **verify_jwt = false**: Ambas as funções não exigem JWT, permitindo chamadas abertas
4. **Código do cliente correto**: O `useBatchOperations.ts` usa `supabase.functions.invoke()` corretamente

### Diferença chave:
- **Revisões automáticas (cron)**: Funcionam porque usam `net.http_post` diretamente do banco de dados PostgreSQL, não passando pelo navegador
- **Revisões manuais (UI)**: Falham porque usam `supabase.functions.invoke()` do cliente JavaScript no navegador

## Causa Provável: Dessincronização GitHub

O erro `FunctionsFetchError: Failed to send a request to the Edge Function` é um erro do lado do cliente Supabase que ocorre quando:
1. A requisição HTTP não consegue ser enviada do navegador
2. Há timeout na conexão
3. Há bloqueio de rede (CORS, firewall, extensão)

Como funciona no Lovable preview mas não na versão GitHub, as causas prováveis são:

### 1. Build desatualizado no GitHub
O código no repositório GitHub pode estar desatualizado em relação ao Lovable. Isso pode causar incompatibilidades.

**Verificação sugerida**: 
- Acessar o repositório GitHub e verificar a data do último commit
- Comparar com as alterações recentes no Lovable

### 2. Cache do navegador/Service Worker
O navegador pode estar usando uma versão cacheada antiga do JavaScript.

**Solução**:
- Limpar cache do navegador completamente
- Fazer hard refresh (Ctrl+Shift+R)
- Testar em modo anônimo/incógnito

### 3. Extensões de navegador
Ad blockers ou extensões de privacidade podem estar bloqueando requisições para `supabase.co`.

**Teste**:
- Desabilitar extensões temporariamente
- Testar em outro navegador

## Recomendação de Correção

### Passo 1: Republicar o projeto
Garantir que a versão mais recente seja publicada:
- Clicar em "Publish" no Lovable para forçar um novo deploy

### Passo 2: Verificar sincronização GitHub
Se usa GitHub:
- Verificar se há commits pendentes
- Forçar push se necessário

### Passo 3: Adicionar tratamento de erro mais detalhado
Modificar o código para capturar mais detalhes sobre o erro, facilitando diagnóstico futuro.

**Arquivo**: `src/components/improved-reviews/hooks/useBatchOperations.ts`

```typescript
// No bloco catch (linha 177-183)
} catch (error: any) {
  console.error(`❌ Erro ao analisar cliente ${clientId}:`, error);
  
  // Log detalhado para diagnóstico
  console.error('Detalhes do erro:', {
    name: error?.name,
    message: error?.message,
    context: error?.context,
    status: error?.status,
    code: error?.code
  });
  
  // Verificar tipo específico de erro
  const isNetworkError = error?.message?.includes('Failed to send') || 
                         error?.name === 'FunctionsFetchError';
  
  toast({
    title: isNetworkError ? "Erro de conexão" : "Erro na revisão",
    description: isNetworkError 
      ? "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
      : `Não foi possível revisar este cliente. Tente novamente.`,
    variant: "destructive"
  });
}
```

### Passo 4: Testar no ambiente de produção
Após republicar:
1. Limpar cache do navegador
2. Testar em modo anônimo
3. Verificar console do navegador (F12) para erros detalhados

## Próximos Passos Imediatos

1. **Verificar data do último deploy no GitHub** - confirmar se o código está atualizado
2. **Republicar projeto** - forçar novo deploy para garantir versão correta
3. **Testar em navegador limpo** - modo anônimo sem extensões
4. **Coletar logs detalhados** - verificar console do navegador na versão publicada

## Notas Técnicas

O erro `FunctionsFetchError` é gerado pelo SDK do Supabase quando:
- `fetch()` falha completamente
- Há timeout
- A resposta não é válida

Diferente de erros de autenticação ou lógica, este erro indica que a requisição **não chegou** à Edge Function.
