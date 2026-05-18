# Vídeos de "Publicação existente" no Top Criativos

## Contexto

Anúncios Meta criados "do zero" no Gerenciador trazem o vídeo dentro de `creative.object_story_spec.video_data` (com `video_id` e `image_url`). Para esses, o preview e a reprodução estão funcionando bem.

Anúncios que usam **"Publicação existente"** (dark posts ou posts da página promovidos) **não** preenchem `object_story_spec`. Em vez disso, expõem apenas `object_story_id` ou `effective_object_story_id` no formato `{page_id}_{post_id}`. Resultado: nosso extrator atual (`pickBestCreativeImage`) não encontra `video_id`, cai num thumbnail genérico e o card fica "desformatado" — sem botão de play funcional e, em alguns casos, com a capa errada/cortada.

## O que vamos fazer

Resolver o `object_story_id` desses anúncios no backend para obter:
- `video_id` (quando o post for vídeo)
- `full_picture` (thumbnail em alta resolução)
- `permalink_url` (fallback "Abrir no Facebook")
- `attachments` (para detectar carrossel/imagem corretamente)

Com isso o card volta a se comportar como um vídeo: capa correta, play funcional abrindo o `MetaVideoPlayerDialog`, e se a Graph API não devolver `source` (post antigo/restrito), exibimos o link do Facebook como fallback (já existente).

## Detalhes técnicos

Arquivo principal: `supabase/functions/traffic-insights/ads-processor.ts`

1. Em `fetchMetaTopAds`, incluir `object_story_id` e `effective_object_story_id` nos `creativeFields` (já estão).
2. Após o loop principal, identificar anúncios cujo `picked.source === 'none'` **ou** sem `videoId`/`thumbnail` **e** que possuam `object_story_id`/`effective_object_story_id`.
3. Para esses, fazer um batch request à Graph API:
   `GET /{post_id}?fields=full_picture,permalink_url,attachments{media_type,media,subattachments,target}&access_token=...`
   (usar `?ids=a,b,c` para batch).
4. Mapear o retorno:
   - `attachments.data[0].media_type === 'video'` → `mediaType='video'`, `videoId = attachments.data[0].target.id`, `thumbnail = full_picture || media.image.src`.
   - `subattachments` presentes → `mediaType='carousel'`, thumbnail da primeira.
   - Caso contrário → `mediaType='image'`, thumbnail = `full_picture`.
5. Preencher `topAd.creative` com esses dados e marcar `thumbnailSource = 'object_story_id_lookup'` para telemetria.

Nenhuma mudança no frontend é necessária — `TopCreativesSection` e `MetaVideoPlayerDialog` já lidam com `videoId` + `thumbnail` corretamente. O endpoint `meta-video-source` continua resolvendo o `source` (mp4) a partir do `video_id`.

## Riscos / observações

- Posts muito antigos ou de páginas sem permissão podem não retornar `attachments`. Nesse caso mantemos o comportamento atual (thumbnail genérico) e o usuário ainda terá o link "Abrir no Facebook" via `permalink_url`.
- A chamada extra à Graph API é feita em lote (uma única request por revisão), então o impacto em latência é mínimo.
