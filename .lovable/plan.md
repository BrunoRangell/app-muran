

# Corrigir cadastro de membro da equipe

## Problema
O formulário usa `supabase.auth.signUp()` do lado do cliente para criar o usuário. Isso causa dois problemas:

1. **"User already registered"**: Se o email já existe no Supabase Auth (como `gabriel@muranmarketing.com.br`), o signUp falha com erro 422 e o cadastro é abortado.
2. **Desconecta o admin**: `signUp()` no client-side faz login automático com o novo usuário, deslogando o admin que está cadastrando.

## Solução
Criar uma edge function `create-team-member` que usa `supabase.auth.admin.createUser()` com a service role key. Isso permite:
- Criar usuários sem afetar a sessão do admin
- Tratar o caso de usuário já existente (buscar o ID existente e só criar o registro em `team_members`)
- Atribuir a role `member` em `user_roles` automaticamente

### 1. Nova edge function: `supabase/functions/create-team-member/index.ts`
- Recebe `{ name, email, role, password }`
- Verifica se o chamador é admin (via token JWT)
- Tenta `auth.admin.createUser()`. Se retornar "user already exists", busca o user existente via `auth.admin.listUsers()` filtrado por email
- Insere registro em `team_members` com o `manager_id` = ID do auth user
- Insere role `member` em `user_roles`
- Retorna sucesso ou erro específico

### 2. Atualizar `src/components/admin/TeamMemberForm.tsx`
- Substituir a lógica de `signUp` + insert manual por uma chamada `supabase.functions.invoke('create-team-member', { body: data })`
- Melhorar mensagens de erro para casos específicos (email já cadastrado na equipe vs apenas no auth)

## Arquivos
- **Novo**: `supabase/functions/create-team-member/index.ts`
- **Editado**: `src/components/admin/TeamMemberForm.tsx`

