# Links dos anúncios na tela Anúncios Ativos

## O que muda
1. **Nova coluna "Link"** na tabela, depois de "Campanha": mostra um link clicável (abre em nova aba) com um botão para copiar só aquele link. Não aparece no PNG exportado.
2. **Novo botão "Copiar links"** ao lado de "Exportar PNG": copia um texto só com os links, sem nome, sem cabeçalho:
   ```text
   1. https://...
   2. https://...
   ```
   A numeração usa exatamente o mesmo número da coluna "#" da tabela (mesma ordem e mesmos filtros aplicados). Se um anúncio não tiver link, a linha fica `3. link indisponível`, para nunca deslocar a numeração.

## Qual link é usado
O link de visualização pública do anúncio fornecido pelo Meta (prévia compartilhável do anúncio). Quando o Meta não fornecer, usa o link do anúncio dentro do Gerenciador de Anúncios.

## Detalhes técnicos
- `meta-active-ads`: incluir `preview_shareable_link` nos campos buscados e retornar `ad_link` (fallback: `https://adsmanager.facebook.com/adsmanager/manage/ads?act={account_id}&selected_ad_ids={ad_id}`).
- `useActiveAds.ts`: adicionar `ad_link: string | null` em `ActiveAd`.
- `AnunciosAtivos.tsx`: coluna Link (oculta quando `exporting`) e `handleCopyLinks` gerando `filteredAds.map((ad, i) => \`${i + 1}. ${ad.ad_link ?? "link indisponível"}\`)` — mesmo array e índice usados na tabela.
