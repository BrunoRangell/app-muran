## Mudança

Alterar apenas o formato de linha no `check-campaign-health-alerts/index.ts` — todo o resto (dedup, ordenação, chunking, plataformas) permanece igual.

### Formato novo

```
> • {Cliente} | {Meta Ads|Google Ads} | {Nome da campanha} - Status: {status traduzido}
```

### Tradução de status (PT-BR)

Mapa aplicado tanto para Meta quanto para Google Ads (ambos já salvam `status` em `campaigns_detailed`):

**Meta (effective_status):**
- `ACTIVE` → Ativa
- `PAUSED` → Pausada
- `DELETED` → Excluída
- `ARCHIVED` → Arquivada
- `IN_PROCESS` → Em análise
- `WITH_ISSUES` → Com problemas
- `CAMPAIGN_PAUSED` → Campanha pausada
- `ADSET_PAUSED` → Conjunto pausado
- `DISAPPROVED` → Reprovada
- `PENDING_REVIEW` → Em revisão
- `PREAPPROVED` → Pré-aprovada
- `PENDING_BILLING_INFO` → Aguardando faturamento

**Google Ads:**
- `ENABLED` → Ativa
- `PAUSED` → Pausada
- `REMOVED` → Removida
- `UNKNOWN` → Desconhecido
- `UNSPECIFIED` → Não especificado

Fallback: se vier um valor fora da lista, mostra o valor cru (sem quebrar).

### Implementação

Adicionar função `translateStatus(platform, status)` no topo do arquivo. Substituir a linha:

```ts
`> • ${l.company} | ${platformLabel(l.platform)} | **${l.campaignName}:** 0 impressões e R$ 0,00 gasto hoje`
```

por:

```ts
`> • ${l.company} | ${platformLabel(l.platform)} | ${l.campaignName} - Status: ${translateStatus(l.platform, l.status)}`
```

E incluir `status` no objeto `Line` (lendo `c?.status` ao montar as linhas).

### Sem mudanças

- Sem migration.
- Sem alteração na ingestão (Meta e Google já salvam status).
- Sem alteração no `check-low-balance-alerts`.
- Crons 09h/16h continuam iguais.

### Validação

Após deploy, disparo manual via curl para confirmar formato no Discord.
