# Corrigir vídeos de Meta em anúncios de Publicação existente

## Problema observado

Nos anúncios Meta criados do zero, o criativo vem com `video_data.video_id` e `image_url`, então o card renderiza bem e o player consegue buscar o MP4.

Nos anúncios que usam **Publicação existente**, o dado costuma vir por `object_story_id/effective_object_story_id`. O ajuste anterior buscou `attachments`, mas ainda está insuficiente porque a Graph API pode devolver:
- `target.id` como ID do post, não necessariamente como ID do vídeo reproduzível;
- thumbnail pequena/blurred via `full_picture` ou `media.image.src`;
- tipos de vídeo como `share`, `native_video`, `video_direct_response`, `animated_image_video` ou estruturas aninhadas em `subattachments`.

## O que vou ajustar

1. **Melhorar o resolver de Publicação existente no backend**
   - Atualizar `supabase/functions/traffic-insights/ads-processor.ts` para Graph API `v24.0`, alinhado com o restante do projeto.
   - Expandir os campos buscados no lookup do post para incluir dados mais confiáveis de vídeo e imagem.
   - Tratar mais formatos de attachment de vídeo, não só `video`, `video_inline` e `video_autoplay`.
   - Procurar o vídeo real em múltiplos caminhos do attachment/subattachment antes de desistir.

2. **Buscar detalhes do vídeo quando o post indicar vídeo**
   - Quando encontrar um possível `videoId`, fazer uma segunda consulta leve em lote/por chunk para `/{video_id}?fields=source,picture,permalink_url,thumbnails`.
   - Usar `picture/thumbnails` como capa preferencial quando forem melhores do que o `full_picture` do post.
   - Guardar também o `permalink_url` para fallback.

3. **Permitir fallback por link quando o MP4 direto não existir**
   - Incluir `creative.permalinkUrl` nos dados dos top criativos.
   - Ajustar o diálogo do vídeo para conseguir mostrar “Abrir no Facebook” mesmo quando `source` não vier da API.
   - Assim, se a Meta bloquear o `source` direto de algum post, o usuário ainda consegue acessar a publicação correta.

4. **Evitar o card visualmente “desformatado”**
   - Preferir thumbnails de vídeo em melhor resolução para Publicação existente.
   - Manter o layout atual, sem poluir a tela, apenas melhorando a fonte da imagem e o comportamento do play.

## Validação

- Conferir logs de telemetria de `thumbnailSource` e quantidade resolvida por `object_story_id`.
- Verificar que anúncios criados do zero continuam iguais.
- Verificar que Publicação existente com vídeo recebe `mediaType='video'`, thumbnail melhor e, quando possível, `videoId` reproduzível.
