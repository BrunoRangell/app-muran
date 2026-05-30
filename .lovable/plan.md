# Correções necessárias

## 1. Bug do filtro "Ajuste de orçamento" (contas Google aparecendo como OK)

### Causa raiz
Os tributos de 12,15% só se aplicam a contas Meta Ads. No `ClientGroupCard.tsx` (linha 36), o `considerTaxes` é passado para `CircularBudgetCard` apenas quando a plataforma é Meta — em Google, vai `undefined` (→ tratado como `false`).

Já no `useAllPlatformsData.matchesFilter`, o helper `computeNeedsAdjustment` recebe `considerTaxes=true` (estado do toggle) para **todas** as plataformas, inclusive Google. Isso reduz o `effectiveBudget` em 12,15% e zera o `idealDailyBudget` quando o gasto acumulado se aproxima do total — fazendo o filtro incluir contas Google que o card desenha como verdes/OK.

### Exemplos confirmados via DB
- **Imobel** (Google): budget 1000, gasto 920,20 → sem taxas idealDaily ≈ R$ 39,90 vs diário R$ 35 → diff R$ 4,90 → **OK** ✅. Com taxas (errado): effectiveBudget 878,5 < gasto, idealDaily = 0 → diff −35 → "precisa ajuste" ❌.
- **Dra. Naiara Bordignon** (Google): mesmo padrão. diff R$ 2,45 → OK; com taxas → falso positivo.
- **Inpack Embalagens** (Google): diff R$ 0,84 → OK; com taxas → falso positivo.

### Correção
Aplicar `considerTaxes` **apenas para Meta** dentro do helper, alinhando com a regra visual do `ClientGroupCard`.

**Arquivos:**

- `src/components/improved-reviews/utils/needsAdjustment.ts`
  - No início da função, forçar `const applyTaxes = considerTaxes && platform === "meta";` e usar `applyTaxes` em vez de `considerTaxes` nos cálculos de `effectiveBudget` e do `idealDailyBudget` recalculado.

- `src/components/improved-reviews/clients/ClientsList.tsx`
  - Como esse arquivo já chama o helper, nenhuma mudança extra é necessária além da do helper (a aba Meta continua igual; a aba Google passa a ignorar taxas corretamente).

- `src/components/improved-reviews/hooks/useAllPlatformsData.ts`
  - Sem mudanças — a correção no helper já cobre os dois pontos (`matchesFilter` e o cálculo de `clientsNeedingAdjustment`).

### Validação
1. Abrir `/revisao-diaria-avancada#all-platforms` com tributos ligados (padrão) + modo "orç. atual".
2. Confirmar que Imobel, Dra. Naiara Bordignon e Inpack Embalagens **não** aparecem mais no filtro "Ajuste de orçamento".
3. Verificar paridade: cada card visível no filtro está com borda âmbar (não verde).

---

## 2. Erro "Não foi possível revisar este cliente" (não é bug de código)

Os logs da edge function `unified-meta-review` mostram:

```
Meta API error: 400 - Error validating access token:
Session has expired on Friday, 29-May-26 06:27:35 PDT
OAuthException code 190
```

**O token de acesso do Meta Ads expirou em 29/05/26** e a renovação automática (cron `refresh-meta-token`) não atualizou a credencial. Toda revisão Meta (individual ou em massa) falha enquanto o token estiver expirado.

### Ação requerida (manual, fora do escopo de código)
Renovar o token Meta em **Configurações → API Meta** (ou disparar manualmente a função `refresh-meta-token`). Após renovar, os botões "Analisar" voltam a funcionar.

Se você quiser, num próximo passo posso investigar **por que a renovação automática falhou** desta vez (checar logs do cron, validar `meta_token_metadata.expires_at`, etc.) — mas isso é um trabalho separado deste fix de filtro.
