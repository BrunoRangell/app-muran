

# Plano: Seletor de conta no formulário de orçamento personalizado

## Problema

O formulário de orçamento personalizado pede apenas o cliente, mas a tabela `custom_budgets` já tem a coluna `account_id` (nullable). Quando um cliente tem múltiplas contas na plataforma selecionada, o usuário deveria poder escolher a conta específica.

## Alterações

### 1. `src/components/improved-reviews/tabs/schemas/customBudgetSchema.ts`

Adicionar campo `account_id` opcional ao schema:

```tsx
account_id: z.string().optional(),
```

### 2. `src/components/improved-reviews/tabs/components/CustomBudgetForm.tsx`

- Após selecionar cliente e plataforma, buscar as contas do cliente usando `useClientAccounts(clientId, platform)`
- Se houver mais de 1 conta ativa, exibir um `Select` para escolher a conta específica (ou "Todas as contas")
- Se houver apenas 1 conta, não exibir o seletor (aplica-se automaticamente)
- Usar `form.watch("client_id")` e `form.watch("platform")` para reatividade

```tsx
const clientId = form.watch("client_id");
const platform = form.watch("platform");
const { data: accounts } = useClientAccounts(clientId, platform);

// Renderizar seletor apenas se accounts?.length > 1
{accounts && accounts.length > 1 && (
  <FormField name="account_id" ...>
    <Select>
      <SelectItem value="">Todas as contas</SelectItem>
      {accounts.map(acc => (
        <SelectItem key={acc.id} value={acc.id}>{acc.account_name}</SelectItem>
      ))}
    </Select>
  </FormField>
)}
```

### 3. `src/components/improved-reviews/tabs/hooks/useCustomBudgetForm.ts`

Incluir `account_id` no insert e update:

```tsx
account_id: data.account_id || null,
```

### 4. `src/components/improved-reviews/tabs/components/CustomBudgetDialog.tsx`

Passar `account_id` no `initialData` ao editar:

```tsx
account_id: budget.account_id || "",
```

Adicionar `account_id` à interface `CustomBudget`.

## O que não muda

- Banco de dados: a coluna `account_id` já existe em `custom_budgets`
- Se o cliente tem apenas 1 conta, o fluxo permanece igual (sem seletor extra)
- Se nenhuma conta for selecionada, `account_id` fica `null` (aplica-se a todas)

