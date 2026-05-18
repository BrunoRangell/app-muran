# Top Criativos — corrigir overlay de player e melhorar qualidade de imagens

## Problemas relatados

1. O ícone de "play" (player) está aparecendo também em criativos que **não são vídeos**.
2. Em criativos do tipo imagem, o preview fica **muito pequeno e pixelado** dentro do card (a imagem aparece centralizada com bordas escuras grandes ao redor).

Vídeos estão funcionando perfeitamente — manter o comportamento atual deles.

## Mudanças propostas (apenas frontend)

Arquivo único: `src/components/traffic-reports/TopCreativesSection.tsx`

### 1. Player só em vídeos reais

Hoje o overlay com o ícone de play é renderizado sempre que `mediaType === 'video'`. Vamos restringir para `isPlayableVideo` (ou seja, `mediaType === 'video' && videoId` presente). Assim qualquer criativo que não seja vídeo de verdade nunca mostra o botão de play — eliminando o caso reportado.

### 2. Layout de preview diferenciado por tipo de mídia

Hoje todos os criativos usam o mesmo tratamento: fundo borrado + `object-contain`. Isso é ótimo para vídeos (preserva proporção 9:16 / 1:1 sem cortar), mas péssimo para imagens estáticas, porque a imagem original costuma ser pequena e fica reduzida no centro do card, parecendo pixelada.

Novo comportamento:

- **Vídeo** (`mediaType === 'video'`): mantém exatamente o layout atual (fundo borrado + imagem `object-contain` + overlay de play quando jogável). Sem mudança visual.
- **Imagem / Carrossel**: o thumbnail passa a preencher o card com `object-cover`, sem o fundo borrado e sem letterbox. Isso elimina a sensação de "imagem minúscula no meio do card" e dá muito mais presença visual ao criativo. Pequenas perdas de proporção são aceitáveis (corte suave nas bordas), e a nitidez percebida melhora bastante porque a imagem ocupa toda a área disponível.
- Manter o badge "Carrossel" no canto inferior direito e o badge "Meta Ads" no canto inferior esquerdo.

### 3. Pequeno polimento

- Remover o `cursor-pointer` / `group/play` para criativos que não são vídeos jogáveis (já implícito ao restringir `isPlayableVideo`, mas garantir que a tag continue sendo `<div>` e não `<button>` nesses casos).
- Manter o fallback "Preview não disponível" como está.

## Sem mudanças

- Backend (`ads-processor.ts`, `meta-image-proxy`, `meta-video-source`) permanece intacto.
- Modal de player de vídeo (`MetaVideoPlayerDialog`) permanece intacto.
- Ordenação, badges de ranking, métricas e investimento permanecem iguais.
