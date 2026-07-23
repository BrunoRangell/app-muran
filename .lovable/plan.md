## Problema

O guard `TeamMemberCheck` bloqueia o acesso à página **Configurações** mesmo para admins reais. A consulta inicial que ele faz é:

```ts
supabase.from('team_members').select('id, permission, role')
```

A coluna `permission` **não existe** na tabela `team_members` (confirmado nas requisições de rede: `column team_members.permission does not exist`, HTTP 400). Como a chamada retorna erro, o componente cai no `catch` e define `isTeamMember = false`, exibindo "Acesso Negado" — apesar de o usuário ter `role = 'admin'` em `user_roles`.

## Correção

Editar `src/components/auth/TeamMemberCheck.tsx`:

1. Remover a consulta a `team_members` (usada só para "detectar" existência) e a referência à coluna inexistente `permission`.
2. Basear a verificação exclusivamente em `user_roles` (fonte oficial de papéis, já usada logo abaixo no mesmo componente):
   - `isTeamMember` = usuário tem role `admin` ou `member`.
   - `isAdmin` = usuário tem role `admin`.
3. Manter o restante do fluxo (loading, telas de acesso negado, `requireAdmin`) sem alterações.

## Observações

- Mudança escopo frontend apenas. Nenhuma migração de banco.
- Outros arquivos que ainda referenciam `permission` (ex.: `useUserRole.ts`, formulários de equipe) não estão bloqueando esta tela, mas podem ser tratados em uma próxima rodada se você quiser eu já sinalizo.
