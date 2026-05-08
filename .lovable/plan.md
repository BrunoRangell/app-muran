## Ajustes no Master Traffic Report

Cinco correções pontuais no relatório atual, mantendo todo o resto do layout dark intacto.

### 1. Remover seção "Insights & Alertas"
Em `src/components/traffic-reports/MasterTrafficReport.tsx`:
- Apagar o bloco `<GlassCard id={SECTION_ID('insights')}>` (linhas ~328-352).
- Apagar toda a lógica de geração de `insights` no `useMemo` (linhas ~129-188) e a referência `insights` no retorno/destructure.
- Remover o item "insights" da `SidebarNav` (em `premium-templates/dashcortex/SidebarNav.tsx`).

### 2. Remover seção "Analytics" (Origem + Região detalhada)
- Apagar o bloco `<div id={SECTION_ID('analytics')}>` que renderiza `OriginPieChart` + `RegionTable` (linhas ~536-540).
- Remover importações não usadas (`OriginPieChart`, `RegionTable`).
- Remover item "analytics" da `SidebarNav`.
- A seção "Audiência" (idade/gênero/região com barras) é mantida — região continua visível ali.

### 3. Corrigir barra branca no topo (PortalHeader fora de tema)
O `PortalHeader` foi desenhado com fundo claro (gradient cinza/branco), o que destoa do Master Report dark. Em modo portal/preview ele aparece grudado no topo do relatório dark, criando a "barra branca desformatada".

Solução: criar uma versão dark integrada do header, embutida no próprio Master Report quando em portal/preview, ou reskinar `PortalHeader` para tema dark (fundo `#0B0F1A`/translúcido, texto branco, tabs com a mesma estética glassmorphism do report). Optaremos por **reskinar o `PortalHeader` para dark** — mais simples e consistente:
- Trocar `bg-gradient-to-b from-gray-50...` por gradiente escuro alinhado ao Master (`from-[#1a1030] to-[#0B0F1A]`).
- Texto: `text-white` / `text-white/60` em vez de `text-gray-900`/`text-gray-500`.
- Container do logo: `bg-white/[0.04] border-white/[0.06]`.
- Tabs: `bg-white/[0.03] backdrop-blur` com aba ativa em gradiente Muran (já é) e inativas em `text-white/60`.
- Separador, "Ao vivo" e branding Muran ajustados para tons claros sobre dark.

### 4. Mobile — nada acontece
A `SidebarNav` é fixa lateral (`flex gap-6` com sidebar) e provavelmente bloqueia ou some no mobile, deixando o layout quebrado. Plano:
- Em `MasterTrafficReport.tsx`, esconder a `SidebarNav` em telas `<lg` (`hidden lg:block`) e remover o `flex gap-6` no mobile (`flex flex-col lg:flex-row`).
- Garantir que todos os grids já têm `grid-cols-1` no mobile (a maioria tem; revisar KPIs secundários e blocos de plataforma).
- Reduzir padding do root no mobile (`px-3 sm:px-6`).
- Verificar que o header do relatório (`flex-wrap`) e os badges Meta/Google empilham bem.

### 5. Preview dos criativos desfocado / esticado
Em `src/components/traffic-reports/TopCreativesSection.tsx`:
- Trocar `object-cover` por `object-contain` no `<img>` (linha 131) — evita esticar thumbnails pequenas do Meta.
- Adicionar fundo neutro ao container (`bg-black/40` em vez do gradient laranja claro) para criativos com transparência ou tamanhos variados.
- Adicionar `loading="lazy"` e fallback robusto: ao `onError`, em vez de `display: none` (que deixa um buraco), trocar para o placeholder "Preview não disponível" via state.
- Para thumbs Meta de baixa resolução (geralmente `~64x64`/`~100x100`), tentar substituir por `image_url` quando disponível no payload do criativo. Verificar em `supabase/functions/traffic-insights/ads-processor.ts` se existe um campo de imagem maior (`image_url`, `picture`, `permalink_url`) que possa ser priorizado sobre `thumbnail_url`. Se sim, expor no objeto `creative` e priorizar no front. **Se não existir**, manter só o `object-contain` + fundo dark (sem mudar o backend).

### Ordem de execução
1. Apagar seções Insights e Analytics + limpar imports e itens da SidebarNav.
2. Reskinar `PortalHeader` para tema dark.
3. Tornar `MasterTrafficReport` responsivo (sidebar oculta no mobile, paddings).
4. Ajustar preview de criativos (object-contain, fundo dark, fallback).
5. (Opcional) Verificar `ads-processor.ts` para imagem de maior resolução.
6. QA visual em desktop e mobile (375px e 1366px).

### Não muda
- Estrutura geral, KPIs, performance temporal, plataformas lado a lado, funil, audiência, top criativos, tabela de campanhas, footer.
- Lógica de dados, filtros, edge functions.
