
# Resolver falha de login após reinício do roteador

## O que identifiquei
- O componente `SecurityHeaders.tsx` não está sendo usado em lugar nenhum, então a CSP não explica este erro atual.
- O fallback de `nativeFetch` já existe em `index.html` e `src/integrations/supabase/client.ts`.
- Os logs anexados mostram falha no Preview do Lovable, mas vocês relataram falha no domínio próprio. Então o log atual não prova o erro no domínio próprio.
- Como o problema começou logo após reiniciar o roteador e afetou todo mundo da empresa ao mesmo tempo, o cenário mais provável hoje é: **bloqueio/regras/DNS da rede da empresa impedindo acesso ao Supabase**.
- Mesmo assim, o app hoje piora o problema porque fica tentando `refreshSession` várias vezes no carregamento e no foco da página.

## Do I know what the issue is?
Sim: o mais provável é um problema de rede/DNS/firewall no ambiente da empresa, não uma mudança no código. Mas o frontend também precisa ser endurecido para não entrar em loop de refresh e para diagnosticar corretamente o domínio real em uso.

## Plano de correção

### 1. Instrumentar o login com diagnóstico real
Editar `src/pages/Login.tsx` para:
- mostrar/logar o `window.location.origin` real
- distinguir erro de credenciais vs erro de rede
- detectar quando o problema acontece no domínio próprio, publicado ou preview
- oferecer ação de “limpar sessão local e tentar novamente”

### 2. Parar o loop agressivo de autenticação
Editar `src/hooks/useUnifiedAuth.ts` para:
- não rodar revalidação em foco quando o usuário não está autenticado
- não tratar falha de `getSession()` como se fosse logout definitivo logo na tela de login
- evitar múltiplas tentativas automáticas de refresh enquanto a rede/auth estiver indisponível

### 3. Tornar o cliente Supabase mais defensivo
Editar `src/integrations/supabase/client.ts` para:
- registrar claramente se a falha veio do fetch nativo ou do fetch padrão
- impedir tempestade de tentativas de `refresh_token`
- limpar apenas a chave `muran-auth-token` em fluxos de recuperação, sem usar `localStorage.clear()`

### 4. Adicionar recuperação segura na tela de login
Em `src/pages/Login.tsx`:
- se houver erro de rede/auth quebrada, limpar somente a sessão local do Supabase
- tentar login “limpo”, sem reaproveitar refresh token corrompido
- mostrar mensagem objetiva:
  - “credenciais inválidas” quando for 400/401
  - “não foi possível alcançar o servidor de autenticação” quando for rede/DNS/firewall

### 5. Validar contra o cenário real
Após implementar:
- testar em `https://app.muranmarketing.com.br/login`
- comparar com `https://app-muran.lovable.app/login`
- se o publicado funcionar e o domínio próprio falhar, investigar domínio/proxy
- se ambos falharem apenas na rede da empresa, confirmar causa externa (DNS/firewall/roteador)

## Arquivos a editar
- `src/pages/Login.tsx`
- `src/hooks/useUnifiedAuth.ts`
- `src/integrations/supabase/client.ts`

## Detalhes técnicos
- O problema mais suspeito hoje não é o banco nem o formulário.
- O ponto comum entre “ontem funcionava” e “parou depois que o roteador reiniciou” é a rede da empresa.
- O frontend atual faz muitas tentativas automáticas com `refresh_token`, o que mascara o erro principal e atrapalha o diagnóstico.
- A correção precisa atacar os dois lados:
  1. melhorar o app para não entrar em loop nem mostrar mensagens erradas
  2. isolar rapidamente se a rede da empresa está bloqueando `https://socrnutfpqtcjmetskta.supabase.co`

## Resultado esperado
- login volta a funcionar quando a rede estiver alcançando o Supabase
- a tela de login deixa de entrar em falso “erro genérico”
- fica claro se o problema é do app, do domínio ou da rede da empresa
