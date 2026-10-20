# Trocar o link dos anúncios para o post do Instagram

## Problema
O link `fb.me/...` é a "prévia compartilhável" do Meta. Ela só abre para quem está logado com acesso à conta, por isso parece que o link não existe.

## O que muda
- O link de cada anúncio passa a ser o **post do Instagram** gerado pelo anúncio (ex.: `https://www.instagram.com/p/XXXX/`).
- Se o anúncio não tiver post no Instagram (ex.: veiculado só no Facebook), usa o **post do Facebook** do anúncio (`https://www.facebook.com/{id_do_post}`).
- Se não houver nenhum dos dois, aparece "link indisponível". A numeração continua igual à da tabela.
- O link `fb.me` e o link do Gerenciador deixam de ser usados.

## Detalhes técnicos
- `meta-active-ads`: buscar `creative{...,instagram_permalink_url,effective_object_story_id}` e tirar `preview_shareable_link`.
- `ad_link = creative.instagram_permalink_url || (effective_object_story_id ? https://www.facebook.com/${effective_object_story_id} : null)`.
- Publicar a função de novo; não muda nada na tela.
