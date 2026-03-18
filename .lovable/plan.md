

# Ordenar cards por "dias até o saldo acabar" no filtro de saldo

## Mudanças

### 1. `src/components/improved-reviews/clients/ClientsList.tsx` (linha 99)
- Remover `&& platform === "meta"` da condição de ordenação por saldo, para que funcione também na aba Google Ads.

### 2. `src/components/improved-reviews/hooks/useAllPlatformsData.ts` (linhas 136-160)
- Quando `activeFilter === "balance"`, ordenar os grupos filtrados por menor quantidade de dias até o saldo acabar. Calcular dias restantes com base em `balance_info.balance_value / meta_daily_budget` das contas Meta dentro de cada grupo (já que só Meta tem saldo). Grupos com saldo esgotado (0 ou negativo) aparecem primeiro, seguidos por menor quantidade de dias.

### Arquivos editados
- `src/components/improved-reviews/clients/ClientsList.tsx`
- `src/components/improved-reviews/hooks/useAllPlatformsData.ts`

