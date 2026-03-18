

# Dois ajustes: nome da plataforma no modal + invalidação correta de cache

## Problema 1: Modal não mostra qual plataforma
Quando `fixedPlatform` é passado, o seletor de plataforma fica escondido mas não há nenhuma indicação visual de qual plataforma está sendo cadastrada. O usuário não sabe se está cadastrando Meta ou Google.

**Solução**: No `AddSecondaryAccountModal`, quando `fixedPlatform` é fornecido, mostrar um texto informativo abaixo do subtítulo (ex: "Plataforma: **Meta Ads**" ou "Plataforma: **Google Ads**").

## Problema 2: Card não atualiza após salvar
O `onSuccess` da mutation invalida `["improved-reviews"]` e `["clients-with-accounts-setup"]`, mas as queries reais usam `["improved-meta-reviews"]` e `["google-ads-clients-data"]`. Por isso o cache não é limpo e o card não atualiza.

**Solução**: No `CircularBudgetCard.tsx`, corrigir as query keys invalidadas no `onSuccess`:
- `["improved-meta-reviews"]` (para Meta)
- `["google-ads-clients-data"]` (para Google)
- Usar a variável `platform` para invalidar a query correta

## Arquivos editados
- `src/components/daily-reviews/budget-setup/AddSecondaryAccountModal.tsx` — adicionar indicação visual da plataforma
- `src/components/improved-reviews/clients/CircularBudgetCard.tsx` — corrigir query keys no onSuccess

