

# Diagnóstico: Orçamento personalizado aplicando em ambas as contas

## Causa raiz

As Edge Functions (`unified-meta-review` e `daily-google-review`) foram editadas no código para incluir a lógica de priorização por `account_id`, mas **não foram reimplantadas (redeployed)** no Supabase. Isso é evidenciado pela ausência de logs com as mensagens novas (ex: "Orçamento personalizado da conta encontrado") nos logs das Edge Functions.

A versão em execução ainda usa a lógica antiga que não filtra por `account_id`, aplicando qualquer orçamento personalizado ativo do cliente a todas as contas.

## Solução

### 1. Reimplantar `unified-meta-review`
Deploy da Edge Function com o código atualizado que já contém a lógica de fallback:
- Primeiro busca orçamento com `account_id = <uuid da conta>`
- Se não encontrar, busca orçamento com `account_id IS NULL` (global)

### 2. Reimplantar `daily-google-review`
Deploy da Edge Function com a mesma lógica de priorização por conta.

### 3. Verificação pós-deploy
Após o deploy, testar uma revisão individual e confirmar nos logs que as mensagens de priorização aparecem corretamente (ex: "Orçamento personalizado da conta encontrado" ou "Usando orçamento personalizado global").

Nenhuma alteração de código é necessária — apenas o deploy das funções já editadas.

