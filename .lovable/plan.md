

# Diagnóstico: Composição do orçamento Google Ads vazia

## Evidências

1. **DB confirma**: Todas as revisões Google têm `campaign_budgets: []` (vazio)
2. **Logs confirmam**: 2 campanhas ativas encontradas, orçamento diário real = R$ 16,00
3. **Código está correto**: Linhas 891-899 populam `googleCampaignBudgets` e linha 984 inclui no `reviewData`

## Causa provável

A edge function `daily-google-review` provavelmente **não foi redeployada** com a versão que inclui a coleta de `campaign_budgets`. O código no repositório está correto, mas a versão rodando no Supabase pode ser anterior.

## Plano

### 1. Adicionar log de debug para `googleCampaignBudgets`
- **Arquivo**: `supabase/functions/daily-google-review/index.ts` (~linha 902)
- Adicionar `console.log` mostrando o conteúdo de `googleCampaignBudgets` após o loop das campanhas, para confirmar se está sendo populado

### 2. Redeployar a edge function
- Deploy de `daily-google-review` para garantir que a versão atualizada está em produção

### 3. Testar
- Rodar uma revisão Google Ads individual e verificar nos logs se `googleCampaignBudgets` aparece populado
- Verificar no banco se `campaign_budgets` ficou preenchido

Isso é uma correção mínima (1 linha de log + redeploy).

