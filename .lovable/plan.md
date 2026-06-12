## Diagnóstico

Os logs mostram que a Meta está retornando **429 (Too Many Requests)** e **500/code:1 (OAuthException genérica)** para `unified-meta-review` e `meta-active-ads`. O token está válido (46 dias restantes, checado hoje 13:00) — **não é problema de token**. É **rate limit** da Graph API.

A causa provável é o aumento recente de chamadas por revisão:
- `unified-meta-review/campaigns.ts` agora faz **1 chamada de insights por campanha ativa** com `time_increment=1` (janela de 10 dias) para calcular `zero_days_streak`. Em contas com muitas campanhas isso multiplica drasticamente o volume.
- Houve **duas execuções** do batch Meta no mesmo minuto às 12:00 (logs `batch_review_completed` 12:00:22 e 12:00:30), dobrando a carga.
- Quando a Meta devolve 429/500, todas as funções **lançam exceção e abortam a revisão inteira**, sem retry/backoff.

Resultado: o usuário vê "revisão falhou" e "anúncios ativos não carregam" porque cada request individual cai na janela de throttle.

## Plano

### 1. Retry com backoff em chamadas críticas à Meta
Em `unified-meta-review/meta-api.ts` (`fetchAccountBasicInfo`, `fetchMetaApiData`, `fetchMetaBalance`) e em `meta-active-ads/index.ts` (`fetchAllAds`):
- Detectar 429 e 5xx, ler `X-Business-Use-Case-Usage` / `X-App-Usage` quando presente.
- Retry até 3 vezes com backoff exponencial (1s, 4s, 10s) + jitter.
- Em 429 persistente, retornar erro estruturado `{ rate_limited: true }` em vez de exceção crua, para a UI mostrar "API da Meta limitada, tente em alguns minutos" e não quebrar o card.

### 2. Reduzir volume de chamadas em `campaigns.ts`
- Trocar o loop "1 request por campanha" por **um único request agregado** em `/act_{id}/insights` com `level=campaign&time_increment=1&time_range=10d&fields=campaign_id,spend,impressions`, retornando todas as campanhas de uma vez (1 chamada em vez de N).
- Manter `data_unavailable=true` quando a Meta não devolver linha para uma campanha ativa específica.

### 3. Impedir execução dupla do cron de batch
- Investigar por que `daily-meta-review` (batch) rodou duas vezes às 12:00 e adicionar lock simples via `system_logs` ou `pg_advisory_lock` para garantir execução única por janela.

### 4. UI/UX
- Em `useActiveAds` e nos hooks de revisão, exibir toast específico "Meta está com limite de requisições, aguarde 1–2 minutos" quando o backend retornar `rate_limited: true`, em vez do erro genérico atual.

## Arquivos afetados

- `supabase/functions/unified-meta-review/meta-api.ts` — helper `metaFetchWithRetry`, usar em todas as chamadas
- `supabase/functions/unified-meta-review/campaigns.ts` — substituir loop por chamada agregada
- `supabase/functions/unified-meta-review/individual.ts` — propagar `rate_limited` na resposta
- `supabase/functions/meta-active-ads/index.ts` — usar `metaFetchWithRetry`
- `supabase/cron.sql` (ou função do cron) — lock contra execução duplicada
- `src/hooks/useActiveAds.ts` e hook de revisão individual — mensagem de erro específica

## Detalhes técnicos

```ts
async function metaFetchWithRetry(url: string, opts = {}, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    const res = await fetch(url, opts);
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      if (i === maxRetries) return res; // devolve para o caller tratar
      const backoff = Math.min(10000, 1000 * Math.pow(3, i)) + Math.random() * 500;
      await new Promise(r => setTimeout(r, backoff));
      continue;
    }
    return res;
  }
}
```

Posso implementar tudo de uma vez ou só o item 1+2 primeiro (que já resolve o sintoma agudo) e o resto depois — me avise.
