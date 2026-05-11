
# Refinar Layout do Relatório de Tráfego — Harmonia & Legibilidade

## Diagnóstico (problemas encontrados na análise do código)

Hoje o relatório está num "shell" dark/glassmorphism premium (`MasterTrafficReport` com fundo `#0B0F1A`/roxo radial), mas duas seções internas (Top Criativos e Tabela de Campanhas) ainda usam componentes shadcn padrão pensados para tema claro. Isso gera os conflitos de contraste relatados:

1. **Top Criativos (`TopCreativesSection.tsx`)**
   - Cards usam `Card` padrão → fundo branco/claro encaixado dentro de um GlassCard escuro (só o fundo externo foi sobrescrito por hack CSS, mas os internos não).
   - Métricas em `text-blue-600`, `text-green-600`, `text-muran-primary` (cores escuras) ficam sobre fundo escuro → ilegíveis.
   - Badges de rank (`variant="secondary"`/`"outline"`) e badge "Plataforma" são claras com texto claro em alguns casos.
   - Placeholder "Preview não disponível" com `text-muted-foreground` quase invisível.
   - Thumbnails: container fixo `h-48` upscala imagens pequenas do Meta → aparência borrada/esticada. Falta um plano de fallback decente (blur backdrop + object-contain centralizado).

2. **Tabela de Campanhas (`CampaignsInsightsTable.tsx`)**
   - `Card` + `glass-card` herdam tema claro; pílulas do filtro de plataforma usam `bg-yellow-500` (Google) e `bg-blue-500` (Meta) que destoam da paleta Muran (laranja).
   - `Input` de busca e Badges de status (`variant="secondary"/"outline"`) renderizam com baixo contraste no fundo escuro.
   - Apenas overrides genéricos via `[&_*]:!text-inherit` no MasterTrafficReport — frágil.

3. **Header do portal**
   - `PortalHeader` está num `<div>` separado do shell escuro do MasterTrafficReport. O wrapper `TrafficReports` aplica `bg-[#0B0F1A]`, mas o `MasterTrafficReport` aplica `-mx-` e seu próprio background com `radial-gradient(... #1a1030 ...)` — gera um sutil "salto" de tom entre header e relatório.
   - O footer "Powered by Muran" duplicado (um dentro do MasterTrafficReport, outro em `TrafficReports`) com `border-t border-border/50` (cor clara) cria a faixa esbranquiçada percebida.

4. **Sidebar de navegação**
   - Estado ativo fixo em "overview" — não acompanha rolagem, então as outras seções nunca destacam.

## Mudanças propostas (apenas frontend/apresentação)

### 1. Reescrever Top Criativos para tema dark nativo
Em `TopCreativesSection.tsx`:
- Substituir `Card` shadcn pelo mesmo padrão visual dos KPIs (`rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl`).
- Textos de métricas em `text-white` (valor) e `text-white/50` (label). Cores semânticas com tints leves: CTR em `text-blue-300`, Conversões em `text-emerald-300`, CPA em `text-[#ff6e00]`, Investimento em `text-[#ff8c33]`.
- Rank Badge: pílula custom (`bg-[#ff6e00]/15 text-[#ff6e00] border border-[#ff6e00]/30`) com 🔥/⭐/📈/#n.
- "Melhor CTR/CPA/Mais Conversões": badge dark com cor sutil (`bg-{accent}/15 text-{accent}-300 border border-{accent}/30`).
- Plataforma badge (canto inferior): glass com ícone do Facebook/Search.
- **Thumbnails**: container `aspect-video` (em vez de `h-48` fixo), fundo blur do próprio thumb por trás (`<img>` duplicado com `filter: blur(20px) scale(1.1)` como backdrop) + `<img object-contain>` por cima centralizado. Resolve "esticado/desfocado": imagens pequenas centralizam preservando proporção, e o backdrop preenche o restante elegantemente.
- Fallback "Preview não disponível": ícone laranja + texto `text-white/50` claro sobre `bg-white/[0.03]`.
- `Select` de ordenação herdando estilo dark (variant custom: `bg-white/5 border-white/10 text-white`).
- Remover toda a sobrescrita CSS hacky em `MasterTrafficReport.tsx` (linhas 452 e 464-477).

### 2. Reescrever Tabela de Campanhas para tema dark nativo
Em `CampaignsInsightsTable.tsx`:
- Trocar `Card`/`glass-card` por container `rounded-2xl border border-white/[0.06] bg-white/[0.02]` (sem o título "Campanhas Detalhadas" — já tem `SectionTitle` no Master).
- Header da tabela com `bg-white/[0.03]`, texto `text-white/55 uppercase tracking-wider text-xs`.
- Linhas com `border-white/[0.04]`, hover `bg-white/[0.03]`, valores `text-white/90`.
- Filtro de plataforma: pílulas dark com brand color para o ativo (`bg-[#ff6e00] text-white` quando "Todas"; Meta com `bg-[#1877f2]`, Google com `bg-[#34a853]` — cores oficiais das plataformas, não amarelo).
- Input de busca: `bg-white/5 border-white/10 text-white placeholder:text-white/40`.
- Badges de status: ativo `bg-emerald-500/15 text-emerald-300 border-emerald-500/30`, pausado `bg-amber-500/15 text-amber-300`, arquivado `bg-white/10 text-white/60`.
- Botão "abrir na plataforma" com `text-white/60 hover:text-[#ff6e00] hover:bg-white/5`.

### 3. Unificar header do portal com o shell do relatório
Em `TrafficReports.tsx`:
- Quando `showPortalElements`, envelopar header + conteúdo num único `div` com o **mesmo** background radial do MasterTrafficReport (`radial-gradient(ellipse at top, #1a1030 0%, #0B0F1A 50%)`). Remover o `bg-[#0B0F1A]` chapado do wrapper e remover os `-mx-/-mt-` do MasterTrafficReport (passar via prop `embedded`) para evitar duplo background.
- Remover o footer duplicado em `TrafficReports.tsx` (linhas 325-331). O MasterTrafficReport já tem o seu, harmonizado com o tema.

Em `MasterTrafficReport.tsx`:
- Aceitar prop opcional `embedded?: boolean`. Quando true, não renderizar background próprio nem margens negativas — apenas o container interno (o pai já provê o shell).

### 4. Sidebar com active state dinâmico
Em `SidebarNav.tsx` + `MasterTrafficReport.tsx`:
- Usar `IntersectionObserver` para detectar qual `dashcortex-section-*` está visível no viewport e atualizar `active` em tempo real. Threshold ~50% do topo.

### 5. Ajustes finos de contraste
- `recharts` axis ticks: subir de `rgba(255,255,255,0.5)` para `rgba(255,255,255,0.65)` (números do gráfico hoje ficam pálidos demais).
- Tooltip do recharts: aumentar bg para `rgba(15,18,30,0.98)` com `border: rgba(255,110,0,0.2)` para destaque sutil de marca.
- Funil de Conversão: subir `text-white/40` (label) para `text-white/55`.
- Legendas do pie chart (gênero): `wrapperStyle.color = 'rgba(255,255,255,0.7)'`.

## Detalhes técnicos

- **Arquivos editados**: `TopCreativesSection.tsx`, `CampaignsInsightsTable.tsx`, `MasterTrafficReport.tsx`, `SidebarNav.tsx`, `TrafficReports.tsx`.
- **Sem mudanças** em hooks, edge functions, schema ou lógica de dados.
- **Sem mudanças** em paleta global do design system — todos os tokens dark usados (`white/[0.0x]`, `#ff6e00`) já são padrão do "dashcortex" no projeto.
- O `glass-card` antigo (CSS global) deixa de ser usado nessas duas seções, mas continua disponível para outros lugares (não removo).

## Validação

1. Abrir `/relatorios-trafego`, selecionar um cliente com Meta + Google, verificar:
   - Cards de Top Criativos legíveis (valores claros sobre vidro escuro).
   - Tabela com cabeçalho/linhas/badges contrastantes.
   - Header sem "barra branca" — continuidade visual com o relatório.
   - Sidebar muda de seção ativa ao rolar.
2. Thumbnails de anúncios Meta sem distorção: pequenas centralizadas com backdrop borrado preenchendo; placeholders elegantes quando ausentes.
3. Modo portal (`/relatorios/:token`) e modo preview com mesma aparência harmônica.
