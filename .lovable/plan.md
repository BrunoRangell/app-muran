## Diagnóstico

O fetch atual de criativos da Meta em `supabase/functions/traffic-insights/ads-processor.ts` usa:

```
creative{title,body,thumbnail_url,image_url,object_story_spec}
```

Problemas reais:

1. **`image_url` quase nunca vem preenchido** — só existe para o tipo legado `image_ad`. Hoje 95% dos anúncios são `link_ad`, `video_ad` ou `dynamic creative` (asset_feed_spec). Por isso o fallback cai no `thumbnail_url`.
2. **`thumbnail_url` padrão é 64×64 px** — mesmo quando renderizado, fica pixelizado e parece "quebrado" no card `aspect-video`.
3. **Anúncios de vídeo** não têm imagem direta no `creative` — é preciso pegar `object_story_spec.video_data.image_url` ou expandir `video_id{picture,source}`.
4. **Dynamic Creatives** carregam imagens em `asset_feed_spec.images[].url` e vídeos em `asset_feed_spec.videos[].thumbnail_url`.
5. **URLs da fbcdn são assinadas e podem ser bloqueadas por CORS / ad-blockers / Privacy Badger** quando carregadas direto do navegador — fonte comum de "imagem não aparece".
6. O frontend (`TopCreativesSection.tsx`) já trata `onError` mostrando o placeholder — então, se "nenhum preview aparece", é porque o backend está retornando `undefined` ou URLs que falham consistentemente.

## Plano de correção

### 1. Reescrever a busca de criativos (`ads-processor.ts` → `fetchMetaTopAds`)

Trocar a expansão do campo `creative` por uma versão completa, usando os parâmetros de tamanho oficiais da Meta para forçar thumbnails de alta resolução:

```
creative{
  id,
  name,
  thumbnail_url,
  image_url,
  object_type,
  object_story_id,
  effective_object_story_id,
  object_story_spec{
    link_data{picture, image_hash, child_attachments{picture,image_hash}},
    video_data{image_url, video_id},
    photo_data{image_hash, url}
  },
  asset_feed_spec{
    images{url,hash},
    videos{thumbnail_url,video_id}
  },
  image_hash,
  video_id
}
```

E adicionar query params na chamada `/ads` para subir o tamanho do thumbnail:

```
thumbnail_width=600&thumbnail_height=600
```

(parâmetros oficiais que a Meta aplica a `thumbnail_url` e a campos derivados).

### 2. Implementar uma cascata determinística de "melhor imagem"

Nova função `pickBestCreativeImage(creative)` com ordem:

```text
1. asset_feed_spec.images[0].url            (dynamic creative, alta res)
2. object_story_spec.video_data.image_url   (anúncio de vídeo, capa)
3. object_story_spec.link_data.picture       (link ad / single image)
4. object_story_spec.photo_data.url          (photo ad)
5. asset_feed_spec.videos[0].thumbnail_url   (dynamic video)
6. image_url                                  (legacy image_ad)
7. thumbnail_url                              (último recurso, já em 600x600)
```

Detectar também o `mediaType` (`image` | `video` | `carousel`) com base nesses mesmos campos, para o frontend exibir um ícone de vídeo/carrossel quando aplicável.

### 3. Resolver imagens por hash quando necessário

Quando só vier `image_hash` (acontece em algumas contas), fazer uma chamada batch a `/{ad_account_id}/adimages?hashes=[...]&fields=permalink_url,url` e cachear em memória durante a request. Garante preview mesmo em contas antigas.

### 4. Proxy de imagem para evitar CORS / hotlinking

URLs `fbcdn.net` falham silenciosamente em alguns navegadores. Criar uma edge function fina `meta-image-proxy` que:

- Recebe `?url=<encoded fbcdn url>` (com whitelist de domínios `*.fbcdn.net`, `*.facebook.com`)
- Faz o fetch server-side e retorna a imagem com `Cache-Control: public, max-age=86400, immutable` e `Access-Control-Allow-Origin: *`
- Frontend passa a usar essa rota em vez da URL crua.

Isso resolve definitivamente os casos de "url existe mas não carrega".

### 5. Tipagem e log de telemetria

- Atualizar `TopAd.creative` em `types.ts` para incluir `mediaType: 'image' | 'video' | 'carousel'` e `videoId?: string`.
- Logar `[META-ADS] ad ${ad.id} → source=${stepUsado}` para que, em produção, fique claro de onde cada thumb está vindo.

### 6. Frontend (`TopCreativesSection.tsx`) — melhorias visuais

- Trocar `<img src={thumbnail}>` por `<img src={proxiedUrl(thumbnail)}>` com `referrerPolicy="no-referrer"` e `crossOrigin="anonymous"` para suportar fbcdn.
- Quando `mediaType === 'video'`, sobrepor um ícone `Play` discreto no centro.
- Quando `mediaType === 'carousel'`, sobrepor ícone `Images` no canto.
- Manter o backdrop blur + `object-contain`, mas ampliar o `aspect` para `aspect-[4/5]` em mobile (formato mais comum no Reels/Stories) e `aspect-video` em desktop — anúncios verticais ficam melhor enquadrados.
- Skeleton enquanto a imagem carrega (em vez de fundo escuro vazio).

### 7. Validação

Após deploy:

1. Verificar no log `traffic-insights` quantos ads retornam cada `source=` da cascata.
2. Abrir o portal e confirmar visualmente que pelo menos 80% dos cards mostram imagem real.
3. Se algum continuar sem preview, o log diz exatamente em qual etapa caiu, permitindo iterar.

## Detalhes técnicos

**Arquivos alterados:**
- `supabase/functions/traffic-insights/ads-processor.ts` — nova lógica de fields + cascata + suporte a hash
- `supabase/functions/traffic-insights/types.ts` — `creative.mediaType`, `creative.videoId`
- `supabase/functions/meta-image-proxy/index.ts` — nova função (CORS proxy com whitelist)
- `supabase/config.toml` — registrar `meta-image-proxy` com `verify_jwt = false`
- `src/components/traffic-reports/TopCreativesSection.tsx` — usar proxy, overlays de mídia, skeleton, aspect responsivo
- `src/lib/metaImageProxy.ts` (novo, frontend) — helper `proxiedUrl(rawUrl)` que prefixa com a URL do edge function

**Sem mudanças** em RLS, schema do banco, ou nas demais seções do relatório.
