
## Causa raiz

Confirmei no snapshot de hoje (`campaign_health`):

- **Personal Brechó / [MSG] [WHATSAPP] [VENDA CONOSCO]** (id 23855583507100033) → `cost=0, impressions=0, cost_2d=0, zero_days_streak=10`
- **Estética Plexus / [MSG] [WHATSAPP] [GERAL] [V2]** (id 120252805244690405) → mesmo padrão, `zero_days_streak=10`

Mas o usuário confirma que ambas tiveram entrega normal nos últimos 10 dias.

O bug está em `supabase/functions/unified-meta-review/campaigns.ts` (linhas 108–143):

1. Buscamos os insights diários da campanha com `time_increment=1` na janela de 10 dias.
2. Quando a Meta devolve `data: []` (resposta vazia — comum em casos pontuais: campanhas recém-duplicadas, janelas de atribuição, atraso de processamento ou pequenos glitches da Graph API), o loop:
   ```ts
   for (let k = 1; k <= 10; k++) {
     const d = daily.get(day);
     if (!d || (d.cost === 0 && d.impressions === 0)) zeroDaysStreak++;
     else break;
   }
   ```
   trata "dia sem linha" como "dia zerado" e conta **10 dias seguidos** → dispara "Sem veiculação (10+ dias)".

3. Pior: o critério do alerta para Meta (`cost===0 && impressions===0` hoje) também fica `true` quando a resposta é vazia → falso positivo confirmado.

Ambas as contas têm gasto agregado no dia (vide logs do `unified-meta-review`), o que prova que o problema é por campanha (não por conta).

## Correção proposta

### 1. `supabase/functions/unified-meta-review/campaigns.ts`

- Diferenciar "Meta não retornou nenhuma linha" de "Meta retornou linhas zeradas":
  - Marcar `data_unavailable = true` no detalhe da campanha quando `daily.size === 0` (sem erro de API, mas sem nenhuma linha na janela de 10 dias).
  - Nesse caso, **não** preencher `zero_days_streak` (deixar `null`) e **não** assumir `cost/impressions = 0` para o dia.
- Acrescentar `level=campaign` explicitamente na URL de insights por campanha (mais seguro, evita ambiguidade de nível) e logar resposta crua quando vier vazia para campanha `ACTIVE` (diagnóstico).
- Adicionar 1 retry simples quando `data: []` para campanha ativa (pode ser glitch transitório). Se o retry também vier vazio, marca `data_unavailable`.

### 2. `supabase/functions/check-campaign-health-alerts/index.ts`

Ajustar o filtro de Meta em `buildAlertReason` / loop de `details`:

- Pular a campanha (não gerar linha de alerta) quando `c.data_unavailable === true`.
- Registrar essas campanhas em `system_logs` (`campaign_health_alerts_data_unavailable`) para acompanharmos a frequência.
- Manter o resto da lógica intacta: streak real (1–9 dias e 10+) continua valendo quando a Meta realmente devolve linhas zeradas.

### 3. (opcional, mesma migração de código) Logar quando `unserved_campaigns_count` em Meta divergir do volume de campanhas com `data_unavailable`

Para vermos rapidamente se há contas com problema sistemático de resposta vazia.

## Resultado esperado

- Os dois alertas de hoje (Estética Plexus e Personal Brechó) não voltariam a aparecer.
- Campanhas que de fato estão paradas continuam sendo alertadas com a contagem correta (1, 2, …, 10+ dias).
- Ganhamos rastreabilidade nos logs para identificar quando a Graph API devolve vazio.

## Arquivos a modificar

- `supabase/functions/unified-meta-review/campaigns.ts`
- `supabase/functions/check-campaign-health-alerts/index.ts`

Sem mudanças de schema. Sem mudanças de frontend.
