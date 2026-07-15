## Problema

O Supabase está redirecionando para `https://app.muranmarketing.com.br/oauth/consent?authorization_id=...`, mas o app só registra a rota em `/.lovable/oauth/consent`. Por isso aparece "página não encontrada".

## Solução

Registrar a mesma página `OAuthConsent` também no caminho `/oauth/consent` no `src/App.tsx`, mantendo a rota antiga como alias para compatibilidade.

### Alteração

Em `src/App.tsx`, ao lado da linha existente:

```tsx
<Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
<Route path="/oauth/consent" element={<OAuthConsent />} />
```

Nenhuma outra mudança é necessária — o componente `OAuthConsent` já lê `authorization_id` da query string e chama `supabase.auth.oauth.getAuthorizationDetails/approve/deny`.

## Depois de aplicar

1. Publicar o app (a URL `app.muranmarketing.com.br` é a versão publicada).
2. Voltar ao Claude e clicar em "Vincular" novamente — o fluxo agora abrirá a tela de consentimento corretamente.