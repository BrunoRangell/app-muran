## Objetivo

Criar o comando `/anuncios <nome>` no Discord que retorna a lista de anúncios **ativos** da Meta Ads do cliente, mostrando **imagem do criativo + nome do anúncio + status de veiculação**. Sem necessidade de hospedar bot 24/7 — tudo via Edge Function HTTP.

## Como vai funcionar (visão do usuário)

1. No Discord, você digita `/anuncios Imobel`
2. Se houver um único cliente + uma conta → bot responde direto com os anúncios
3. Se houver ambiguidade (vários clientes parecidos OU múltiplas contas Meta) → bot envia uma mensagem efêmera com **select menu** para você escolher
4. Após escolha, bot edita a mensagem mostrando cada anúncio ativo como um **embed**: imagem do criativo, nome do anúncio, nome da campanha e status (veiculando / parado)

## Arquitetura técnica

```text
Discord  ──POST──▶  Edge Function (discord-interactions)
                        │
                        ├─ Verifica assinatura Ed25519 (obrigatório)
                        ├─ Busca cliente(s) no Supabase por nome (ILIKE)
                        ├─ Se múltiplos → retorna select menu
                        ├─ Se único → chama Meta Graph API:
                        │     /act_<id>/ads?effective_status=ACTIVE
                        │     fields: name, creative{image_url,thumbnail_url,
                        │             object_story_spec}, campaign{name},
                        │             status, effective_status
                        └─ Monta embeds (até 10 por mensagem, pagina se precisar)
```

### Componentes a criar

**1. Edge Function `discord-interactions**` (`supabase/functions/discord-interactions/index.ts`)

- Verifica `X-Signature-Ed25519` + `X-Signature-Timestamp` com `DISCORD_PUBLIC_KEY` (obrigatório pelo Discord)
- Responde `PING` (type 1) com `PONG`
- Trata `APPLICATION_COMMAND` (type 2) → comando `/anuncios`
- Trata `MESSAGE_COMPONENT` (type 3) → seleção no menu de desambiguação
- Como o Discord exige resposta em 3s, devolve `DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE` (type 5) e edita depois via `PATCH /webhooks/{app_id}/{token}/messages/@original`
- `verify_jwt = false` em `config.toml`

**2. Edge Function `discord-register-commands**` (one-shot)

- Registra o slash command `/anuncios` com option `cliente` (string, required) na API do Discord
- Você roda 1x manualmente via dashboard ou botão admin

**3. Lógica de busca**

- `clients` ILIKE `%nome%` AND `status = 'active'`
- Junta com `client_accounts` WHERE `platform = 'meta'` AND `account_id` não vazio AND `status = 'active'`
- 0 resultados → mensagem "Nenhum cliente encontrado"
- 1 cliente + 1 conta → segue direto
- N>1 → select menu com até 25 opções

**4. Chamada Meta Graph API**

- Reutiliza token de `api_tokens.meta_access_token`
- Endpoint: `GET /v24.0/act_{account_id}/ads?effective_status=["ACTIVE"]&limit=50&fields=name,effective_status,campaign{name},creative{image_url,thumbnail_url,effective_object_story_id,object_story_spec{video_data{image_url},link_data{picture,image_hash},photo_data{url}}}`
- Resolve URL da imagem com fallback: `image_url` → `thumbnail_url` → `object_story_spec.link_data.picture` → `video_data.image_url`

**5. Formato da resposta no Discord**

- Mensagem inicial: `**Anúncios ativos – {Cliente} ({Conta})** • {N} anúncios`
- 1 embed por anúncio (Discord aceita até 10 embeds por mensagem):
  - `title`: nome do anúncio
  - `description`: `Campanha: {nome}` + emoji de status (🟢 veiculando / 🟡 ativo sem entrega)
  - `image.url`: URL do criativo
  - `color`: `0xff6e00` (laranja Muran)
- Se >10 anúncios, envia mensagens follow-up via webhook

## Secrets necessários

Vou pedir via `add_secret`:

- `DISCORD_PUBLIC_KEY` — para verificar assinatura (Discord Developer Portal → General Information)
- `DISCORD_APPLICATION_ID` — para registrar comandos
- `DISCORD_BOT_TOKEN` — já existe como `DISCORD_TOKEN` ✓ (reuso)

## Passos de implementação

1. Criar edge function `discord-interactions` com verificação de assinatura + handler do `/anuncios`
2. Criar edge function `discord-register-commands` para registrar o slash command
3. Pedir os 2 secrets novos
4. Você cola a URL `https://socrnutfpqtcjmetskta.supabase.co/functions/v1/discord-interactions` no campo **Interactions Endpoint URL** do Discord Developer Portal
5. Roda 1x o `discord-register-commands` (eu chamo via `curl_edge_functions`)
6. Testamos no Discord

## Fora do escopo

- Hospedagem 24/7 do bot existente (não é necessária)
- Comandos com prefixo `.anuncios` (incompatível com modelo serverless)
- Google Ads (não foi solicitado)
- Métricas (gasto/impressões) — só imagem, nome e status conforme combinado