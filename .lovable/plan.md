

# Modal para cadastrar conta direto do card vazio

## Abordagem
Em vez de redirecionar, reutilizar o `AddSecondaryAccountModal` já existente (que pede plataforma, nome, ID e orçamento). Ajustar o título do modal para "Cadastrar Conta" quando usado nesse contexto. Ao salvar, criar a conta como `is_primary: true`.

## Mudanças

### `CircularBudgetCard.tsx`
1. Adicionar estado local `showRegisterModal` (boolean)
2. No card vazio (linha 289-296), trocar o `window.open(...)` por `setShowRegisterModal(true)`
3. Renderizar o `AddSecondaryAccountModal` dentro do early return, passando:
   - `clientName={companyName}`
   - `onSave` que chama `supabase.from("client_accounts").insert(...)` com `is_primary: true` e invalida a query
4. Importar o modal e hooks necessários (`useMutation`, `useQueryClient`, `useToast`)

### `AddSecondaryAccountModal.tsx`
5. Adicionar prop opcional `title?: string` (default: "Adicionar Conta Secundária") para permitir customizar o título quando usado como "Cadastrar Conta"

## Resultado
O botão "Cadastrar conta" abre um modal inline com campos: plataforma, nome da conta, ID da conta e orçamento. Sem redirecionamento, sem troca de contexto.

