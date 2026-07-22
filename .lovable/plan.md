## Problema confirmado

O componente `ApiConfigurationPanel` existe em `src/components/settings/ApiConfigurationPanel.tsx`, mas não é renderizado em lugar nenhum. A `SettingsLayout` só lista 4 seções, sem "Configurações de API". Por isso a aba Meta Ads não aparece para você.

## O que será feito

### 1. Adicionar "Configurações de API" ao menu de Configurações
- Incluir nova seção `api` em `src/components/settings/SettingsLayout.tsx` (ícone de plug/chave, label "Configurações de API").
- Renderizar `<ApiConfigurationPanel />` em `src/pages/Settings.tsx` quando `activeSection === "api"`.
- Esconder a seção de usuários não-admin (verificação via `useUserRole` / `isAdmin`), já que envolve tokens sensíveis.

### 2. Tornar funcional a aba "Meta Ads"
Hoje a aba Meta Ads só mostra um texto dizendo pra inserir o token na tabela `api_tokens`. Será substituída por um formulário funcional:
- Campo de texto (type password com toggle de visibilidade) para colar o token Meta Ads.
- Botão "Salvar Token Meta Ads" que faz upsert na tabela `api_tokens` com `name = 'meta_access_token'` (mesmo padrão do `GoogleAdsTokenManager`).
- Exibição do status atual: token salvo / não salvo, e aviso sobre renovação automática.
- Integridade com o trigger `trigger_convert_meta_token`: ao salvar `meta_access_token`, o Supabase dispara a edge function `convert-meta-token` para converter em long-lived token automaticamente.

### 3. Ajustes de UX
- Manter o padrão visual dos cards brancos com borda e a cor `#ff6e00` nos botões primários.
- Reutilizar o componente `TeamMemberCheck` com `requireAdmin={true}` dentro do painel, garantindo que apenas admins vejam/editem tokens.
- Garantir que a página de Configurações continue funcionando normalmente para os outros usuários.

## Arquivos que serão alterados
- `src/components/settings/SettingsLayout.tsx` — adicionar seção "api" na sidebar.
- `src/pages/Settings.tsx` — renderizar `ApiConfigurationPanel` na nova seção e aplicar gate de admin.
- `src/components/settings/ApiConfigurationPanel.tsx` — substituir texto estático da aba Meta Ads por formulário funcional de token.

## Resultado esperado
- O menu lateral de Configurações passa a exibir "Configurações de API" para administradores.
- Dentro dela, as abas "Google Ads" e "Meta Ads" ficam acessíveis.
- Na aba Meta Ads será possível colar e salvar o novo token direto pela interface, sem precisar editar a tabela no Supabase.