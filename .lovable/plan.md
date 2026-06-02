## Objetivo

Aumentar levemente a miniatura da imagem do anúncio na tabela de `/anuncios-ativos` e garantir qualidade excelente, sem quebrar o layout atual nem o export PNG.

## Mudanças em `src/pages/AnunciosAtivos.tsx`

1. **Tamanho da miniatura**
   - Atual: `h-10 w-10` (40px)
   - Novo: `h-14 w-14` (56px) — aumento sutil, mantém densidade da tabela
   - Manter `rounded`, `object-cover`, `bg-muted`

2. **Qualidade da imagem**
   - Adicionar `loading="lazy"` e `decoding="async"` (não afeta qualidade, evita travamentos)
   - Continuar usando `proxiedImageUrl(ad.image_url)` — a edge function `meta-active-ads` já prioriza `creative.image_url` (resolução original), então a qualidade já vem máxima da Meta
   - Renderizar em `h-14 w-14` em vez de "esticar" um asset original grande para 40px melhora a nitidez percebida (browser faz downscale de melhor qualidade quando a área de destino é maior)

3. **Visualização ampliada ao passar o mouse (opcional, recomendado)**
   - Envolver a miniatura em `<Popover>` (hover/click) que mostra a imagem em ~320×320 com `object-contain`, fundo branco e borda — assim o usuário vê o criativo em alta qualidade sem sair da tabela
   - Não afeta o export PNG (popover não fica no DOM exportado)

## Fora do escopo

- Não mexer em `meta-active-ads` (já retorna a melhor URL disponível)
- Não alterar `metaImageProxy.ts`
- Não alterar layout das outras colunas
- Não alterar o export PNG (continua usando a mesma miniatura)

## Pergunta

Quer também o **preview ampliado em hover/clique** (item 3), ou apenas aumentar a miniatura na tabela?