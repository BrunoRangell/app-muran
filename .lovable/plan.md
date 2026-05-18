# Top Criativos: somente Meta + reprodução de vídeo

Duas mudanças na seção "Top Criativos" dos relatórios de tráfego.

## 1. Mostrar apenas criativos do Meta

Hoje a seção mistura Meta e Google. Como Google Ads são (na maioria) anúncios de texto sem preview visual relevante, vamos esconder completamente os itens cuja `platform === 'google'`.

- Filtrar `topAds` para manter apenas `platform === 'meta'` dentro de `TopCreativesSection`.
- Se após o filtro a lista ficar vazia, a seção inteira não é renderizada (incluindo o título "Top Criativos").
- Ajustar o hint do título (em `MasterTrafficReport`) para refletir a contagem de Meta após o filtro.

## 2. Reproduzir vídeos do Meta diretamente no card

Hoje só vemos a capa (thumbnail). Quando o criativo é vídeo (`mediaType === 'video'` e existe `videoId`), o usuário poderá clicar e assistir.

UX proposta:

- Clicar na capa do vídeo abre um modal (Dialog) com o player rodando no centro, fundo escurecido. O modal mostra também: nome do anúncio, campanha, e métricas principais.
- Botão "Play" sobreposto fica mais convidativo (já existe o ícone, vamos aumentar e adicionar hover).
- Loading skeleton enquanto o vídeo é buscado.
- Se a busca falhar, mostrar mensagem amigável com link "Abrir no Facebook" usando o `permalink_url`.

Para obter o arquivo do vídeo, criamos um endpoint server-side (edge function) que consulta a Graph API com o token Meta da agência e retorna a URL `source` (mp4) — assim o token nunca é exposto no frontend e contornamos CORS.

## Detalhes técnicos

Arquivos afetados:

- `src/components/traffic-reports/TopCreativesSection.tsx` — filtro Meta-only, estado do modal, integração com novo hook de vídeo.
- `src/components/traffic-reports/MasterTrafficReport.tsx` — ajustar contagem exibida no `SectionTitle`.
- `src/lib/metaVideoSource.ts` (novo) — hook `useMetaVideoSource(videoId)` que chama o endpoint e cacheia via React Query.
- `supabase/functions/meta-video-source/index.ts` (novo) — recebe `?video_id=`, busca `GET /{video_id}?fields=source,permalink_url,picture` com o token da agência e retorna `{ source, permalink_url }`. Cache HTTP de 6h.
- `supabase/config.toml` — registrar a nova função como pública.

Componente novo `MetaVideoPlayerDialog`:

```text
+------------------------------------------+
|  [X]                                     |
|                                          |
|        <video controls autoplay>         |
|                                          |
|  Nome do anúncio                         |
|  Campanha · 1.234 impressões · R$ 567   |
|                                          |
|  [Abrir no Facebook]                     |
+------------------------------------------+
```

Sem alterações em RLS, schema, ou no backend `traffic-insights` (que já entrega `videoId`).
