# Plano: `/otimizacao cliente:<nome>` no bot Discord

## Objetivo
Comando de barra que, sob demanda, entrega uma análise de otimização com IA (Claude) para 1 cliente, comparando janelas de 7/30/90 dias em Meta Ads e/ou Google Ads, e responde no mesmo canal via deferred response.

---

## Arquivos a criar/alterar

### 1. `supabase/functions/discord-register-commands/index.ts` (alterar)
Adicionar o comando `otimizacao` no array `COMMANDS`, com opção obrigatória `cliente` (STRING). Depois do deploy, rodar essa function 1x manualmente para registrar no Discord.

### 2. `supabase/functions/discord-interactions/index.ts` (alterar)
- No handler `type === 2` (APPLICATION_COMMAND), adicionar branch `if (name === 'otimizacao')`.
- Responder imediatamente com `{ type: 5 }` (DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE) **sem** `flags: 64` — assim a mensagem final fica **pública no canal** (diferente do `/anuncios`, que é efêmero).
- Disparar em `EdgeRuntime.waitUntil(...)` uma nova função `handleOtimizacaoCommand(appId, token, nome, supabase, channelId)`.
- Essa função:
  1. Busca clientes ativos por `ilike` em `clients.company_name`.
  2. Se 0 → `editOriginal` com "nenhum cliente encontrado".
  3. Se >1 → `editOriginal` listando as opções encontradas pedindo para ser mais específico (sem menu de seleção nesta v1, para manter simples — decisão a confirmar).
  4. Se exatamente 1 → invoca a nova edge function `client-optimization-analysis` via `supabase.functions.invoke(...)` passando `clientId` e `interactionToken`+`appId` para o worker responder por si (ver decisão abaixo) **OU** faz tudo inline nessa mesma invocação.

### 3. `supabase/functions/client-optimization-analysis/index.ts` (nova)
Function nova, `verify_jwt = false` (chamada server-to-server pelo discord-interactions com service role), responsável por:
1. Receber `{ clientId, appId, interactionToken }`.
2. Buscar `client_accounts` ativas do cliente (meta e google).
3. Calcular 3 janelas de datas (últimos 7/30/90 dias vs. período anterior imediato de mesma duração).
4. Para cada conta ativa em cada janela, chamar as funções `fetchMetaInsights` / `fetchGoogleInsights` já existentes em `traffic-insights/` — **reaproveitar importando os módulos** (`../traffic-insights/meta-insights.ts` e `../traffic-insights/google-insights.ts`). Isso evita duplicar lógica de token, paginação, etc.
5. Agregar num JSON estruturado (por plataforma × janela: impressões, alcance, cliques, CTR, CPC, gasto, conversões, CPA, frequência para Meta, com % de variação vs. período anterior).
6. Se alguma plataforma falhar (ex: Meta rate-limit): capturar erro, seguir com as outras, e sinalizar no prompt que "dados de X não disponíveis".
7. Chamar Anthropic Messages API (`https://api.anthropic.com/v1/messages`) com prompt em PT-BR (ver seção Prompt).
8. Formatar a resposta e dar `PATCH` em `https://discord.com/api/v10/webhooks/{appId}/{interactionToken}/messages/@original` com a primeira mensagem, e follow-ups adicionais via `POST https://discord.com/api/v10/webhooks/{appId}/{interactionToken}` para as demais (chunking em ~1900 chars, quebrando em fronteira de parágrafo).

### 4. `supabase/config.toml` (alterar)
Adicionar bloco para a nova function:
```
[functions.client-optimization-analysis]
verify_jwt = false
```

### 5. Secret nova
`ANTHROPIC_API_KEY` — **você cadastra manualmente** em: **Supabase Dashboard → Project socrnutfpqtcjmetskta → Edge Functions → Manage secrets** (ou via `Project Settings → Secrets` no Lovable). Sem ela, a nova function retorna erro claro e o Discord recebe uma mensagem "IA não configurada".

---

## Fluxo passo a passo (runtime)

```text
User no Discord: /otimizacao cliente:Acme
      │
      ▼
Discord → POST discord-interactions
      │  verifica Ed25519
      │  responde type=5 (deferred, público) em <3s
      │
      ▼  (EdgeRuntime.waitUntil)
handleOtimizacaoCommand
      │  1. ilike em clients.company_name
      │  2. resolve 0/1/N
      │     ├─ 0 ou N → editOriginal (fim)
      │     └─ 1 → invoke client-optimization-analysis
      │
      ▼
client-optimization-analysis
      │  1. lê client_accounts ativas (meta/google)
      │  2. monta 3 janelas: 7d, 30d, 90d (+ prev)
      │  3. paralelo: fetchMetaInsights / fetchGoogleInsights por janela
      │  4. monta payload agregado
      │  5. POST Anthropic Messages
      │  6. formata + chunk em ~1900 chars
      │  7. PATCH @original + N follow-ups POST webhook
      ▼
Mensagem final aparece no canal
```

---

## Prompt Claude (esboço)

- System: "Você é analista sênior de mídia paga em uma agência (Muran). Analise os dados abaixo e entregue: (1) o que piorou nos últimos 7 dias vs 7 anteriores, (2) tendências confirmadas nos 30 dias, (3) contexto de sazonalidade dos 90 dias, (4) hipóteses do porquê, (5) 3–5 ações concretas priorizadas. Em PT-BR, direto, sem enrolação, formatado em markdown compatível com Discord (negrito, listas, sem tabelas grandes)."
- User: JSON estruturado com cliente, plataforma(s), e as 3 janelas com métricas + variações.
- `max_tokens`: ~1500 (cabe em ~2–3 mensagens do Discord).

---

## Decisões de design que quero confirmar antes de implementar

1. **Modelo Claude**: sugestão `claude-sonnet-4-5` (bom equilíbrio qualidade/custo/velocidade para análise). Alternativas: `claude-opus-4` (mais caro, mais profundo) ou `claude-haiku-4-5` (mais rápido/barato, análise mais rasa). **Confirma qual?**
2. **Resposta pública vs. efêmera**: proponho **pública no canal** (sem `flags: 64`) para que o time todo veja a análise. Ok?
3. **Múltiplos clientes com nome parecido**: v1 lista opções em texto e pede pra refinar. Em v2 dá pra fazer menu de seleção (igual `/anuncios`). Ok começar simples?
4. **Cliente só Meta ou só Google**: fluxo funciona normalmente com a(s) plataforma(s) disponível(is); o prompt recebe apenas o que existir. Confirma?
5. **Falha parcial de API**: se Meta OU Google falhar, seguimos com a outra e a IA é avisada. Se **ambas** falharem, abortamos com mensagem de erro no canal (sem chamar a IA, pra não gastar crédito à toa). Ok?
6. **Reaproveitamento vs. cópia de código**: proponho **importar** direto de `../traffic-insights/*.ts` dentro da nova function. Isso funciona no Deno/Supabase Functions com paths relativos (o deploy inclui a pasta inteira `supabase/functions/`). Alternativa mais segura: extrair para `_shared/insights/`. **Prefere reaproveitamento direto ou refatorar para `_shared/`?**
7. **Custo/rate limit**: cada `/otimizacao` = até 6 chamadas de API de anúncios (Meta+Google × 3 janelas) + 1 chamada Claude. Sem cache nesta v1. Ok, ou quer TTL curto (ex: 10 min) em memória para não repetir Meta/Google se rodarem 2x seguidas no mesmo cliente?

---

## Riscos

- **Timeout do edge function**: Meta+Google × 3 janelas em paralelo + Claude pode passar de 60s se a conta tiver muitas campanhas. Mitigação: paralelizar tudo com `Promise.all`, limitar campos consultados na Meta API a métricas agregadas (não breakdown), e usar `fields=impressions,clicks,spend,...` sem detalhamento de criativos.
- **Limite de 2000 chars do Discord**: já resolvido pelo padrão de chunking existente. Setar `max_tokens` do Claude em ~1500 para o resultado caber em 2–3 mensagens.
- **Comparação com período anterior**: para "últimos 90 dias" o período anterior seria os 90 dias antes disso (total 180 dias) — a API do Meta suporta, mas pode ficar lento. Se preferir, os 90 dias podem entrar apenas como contexto absoluto, sem comparação. **Confirma?**

Nenhum código será tocado até você aprovar essas decisões.
