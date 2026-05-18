# Corrigir imagens de baixa resolução em cards de Publicação existente (estáticos)

## Problema observado

Cards de imagem (post estático) vindos de **Publicação existente** estão renderizando em baixíssima resolução. Comparando dois exemplos:

- **Bom:** URL termina em `stp=dst-jpg_tt6` → 1080x1350.
- **Ruim:** URL contém `stp=...p64x64_q75_tt6` → 64x64 (thumb minúscula esticada no card).

A URL ruim é uma thumbnail oficial pequena que a Graph API entrega quando caímos em fontes como `post.picture`, `att.media.image.src` (em alguns posts) ou `creative.thumbnail_url` sem o parâmetro de tamanho aplicado. O cascateamento atual em `resolveObjectStoryPosts` e em `pickBestCreativeImage` não garante a versão maior para esses casos.

## O que vou ajustar

1. **Backend `ads-processor.ts` — preferir sempre a maior versão da imagem para Publicação existente**
   - Quando o post resolvido for do tipo imagem, em vez de aceitar `full_picture`/`picture`/`att.media.image.src` direto, buscar o objeto da foto via `/{object_id}?fields=images` (ou `attachments{...,target{id}}` → `/{target.id}?fields=images`) e escolher a maior entrada do array `images` (ordenado por width desc).
   - Para carrosséis, aplicar a mesma resolução ao primeiro `subattachment` de imagem.
   - Manter `full_picture` apenas como fallback final, nunca `post.picture` (é justamente o 64x64).

2. **Backend — fallback adicional para `creative.thumbnail_url`**
   - Quando o melhor cascateamento ainda devolver `thumbnail_url` minúsculo, tentar reescrever a URL removendo segmentos `p{N}x{N}` / `c0.5000x0.5000f` / `dst-emg0` para obter a versão sem corte (técnica conhecida na CDN da Meta), antes de servir.
   - Marcar `thumbnailSource` adequadamente para telemetria (`photo_images_lookup`, `thumbnail_url_upscaled`).

3. **Não mexer em vídeo nem em layout**
   - Caminho de vídeo continua igual ao já corrigido.
   - Layout do card não muda; só a fonte/qualidade da imagem.

## Detalhes técnicos

- Novo helper `resolvePhotoImages(accessToken, photoIds)` em `ads-processor.ts` faz batch GET `?ids=...&fields=images,permalink_url` e retorna a maior URL (`images[0].source` após sort por `width` desc).
- Em `resolveObjectStoryPosts`, quando `mediaType === 'image'`, coletar `att.target.id || post.object_id` como `photoId` candidato; após o loop, chamar `resolvePhotoImages` e substituir `thumbnail` pelo resultado quando disponível.
- Helper `upscaleMetaCdnUrl(url)` aplica regex para remover `/[?&]?stp=...p\d+x\d+[^&]*` e `c0\.\d+x0\.\d+f`, usado como último recurso.

## Validação

- Logar `thumbnailSource` agregado; esperar aumento de `photo_images_lookup` e queda de `object_story_id_lookup` em casos de Publicação existente.
- Conferir visualmente os dois anúncios citados pelo usuário (perfeito continua perfeito; ruim passa a vir em alta resolução).
- Confirmar que anúncios criados do zero não regridem.
