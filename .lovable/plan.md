# Reverter upscale agressivo e tornar resolução de imagem confiável

## Diagnóstico (confirmado em documentação Meta)

Olhei a doc oficial v25 de `StoryAttachment`, `StoryAttachmentMedia` e `Photo`:

- `StoryAttachment.type` é o identificador canônico do tipo (`photo`, `video`, `video_autoplay`, `album`, `multiple`, `animated_image_autoplay`, etc.). `media_type` é apenas auxiliar.
- `StoryAttachment.target.id` aponta para o objeto-alvo: para `type=photo` é o `photo_id`, para `type=video` é o `video_id`. Usar `target.id` sem checar `type` causa lookups errados.
- `StoryAttachmentMedia.image` tem `width/height/src` (capa); `Photo.images[]` traz todas as variantes ordenáveis por largura — é a forma oficial de pegar HD.

E o problema novo veio do meu último ajuste:

1. `upscaleMetaCdnUrl` reescreve o parâmetro `stp` mas mantém o `oh=` (assinatura HMAC da CDN). Isso invalida a URL — a CDN devolve 403 e o `<img onError>` dispara, mostrando "Preview não disponível" em vários cards que antes funcionavam.
2. Retirar `post.picture` do cascateamento sem garantia de outro fallback deixou alguns cards sem nenhuma thumbnail.
3. O lookup `photo_images_lookup` está sendo disparado em todos os posts de imagem, inclusive quando `att.target.id` não é um photo_id válido (ex.: links, IG, álbuns sem foto direta), produzindo respostas vazias e perdendo a melhor versão que já tínhamos.

## O que vou ajustar

1. **Remover `upscaleMetaCdnUrl` por completo**
   - Toda a etapa de upscale por regex sai do `ads-processor.ts`. URLs assinadas da CDN da Meta não podem ser reescritas no cliente.

2. **Voltar `post.picture` como fallback final**
   - Cascateamento de thumbnail no resolver de Publicação existente: `full_picture` → `att.media.image.src` → `subs[0].media.image.src` → `post.picture` (último recurso, garante algo).

3. **Disparar `resolvePhotoImages` apenas quando o tipo justificar**
   - Só coletar `photoId` quando `att.type === 'photo'` (ou primeiro subattachment `type === 'photo'` em álbuns). Para outros tipos, não tentar, evitando lookups vazios.
   - Quando o lookup falhar/retornar vazio, **manter a thumbnail anterior**, em vez de zerar.

4. **Validação extra do `videoId`**
   - Para Publicação existente, só aceitar `att.target.id` como `videoId` se `att.type` indicar vídeo. Senão, descartar.
   - Mantém os fallbacks por regex em `att.url`/`unshimmed_url`/`target.url`.

5. **Sem mudanças no frontend nem em layout.**

## Detalhes técnicos

- `resolveObjectStoryPosts` passa a usar `attType = att.type || att.media_type` em letras minúsculas e classificar:
  - vídeo: `type` em `VIDEO_MEDIA_TYPES` ou contém `video`, ou existe `media.source`, ou caminho `/videos/`;
  - foto: `type === 'photo'` (ou primeiro sub `type === 'photo'`);
  - múltiplos: `album` / `multiple` / >1 subattachment não-vídeo.
- `photoId` extraído somente quando classificação for foto.
- `videoId` extraído somente quando classificação for vídeo.
- Helper `upscaleMetaCdnUrl` e todo o loop que o aplica são removidos.

## Validação

- Confirmar via logs que `thumbnail_url_upscaled`/`+upscaled` não aparece mais.
- Cards que mostravam "Preview não disponível" voltam a renderizar a imagem original.
- Cards de Publicação existente em foto continuam ganhando HD via `photo_images_lookup` quando aplicável.
- Vídeos de Publicação existente: thumbnail volta a aparecer e botão "Abrir no Facebook" segue como fallback caso o `source` direto não venha.
