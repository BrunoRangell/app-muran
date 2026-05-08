
# Limpeza total + Master Report único (DashCortex evoluído)

## Objetivo

Eliminar **todo** o sistema editável de relatórios de tráfego (templates, presets, premium builder, editor, widgets configuráveis) e deixar **um único modelo fixo, super elaborado**, evoluindo o **DashCortex** atual com a visão de gestor de tráfego top + design Power BI.

O fluxo dos clientes (seleção + portal público) continua igual. Muda só **o que é renderizado dentro do relatório**: sempre o Master Report, sem escolha de template, sem editor.

---

## 1. O que será REMOVIDO

### Páginas e rotas
- `src/pages/TemplateEditorPage.tsx`
- `src/pages/PremiumBuilderPage.tsx`
- `src/pages/TrafficReportsTemplates.tsx`
- `src/pages/TrafficReportsViewer.tsx`
- Rotas em `App.tsx`:
  - `/relatorios-trafego/templates`
  - `/relatorios-trafego/templates/novo`
  - `/relatorios-trafego/templates/editar/:templateId`
  - `/relatorios-trafego/templates/premium/novo`
  - `/relatorios-trafego/templates/premium/editar/:templateId`
  - `/relatorios-trafego/visualizar`

### Pastas inteiras
- `src/components/template-editor/` (todo o editor)
- `src/components/premium-builder/` (todo o premium builder v2)
- `src/components/traffic-reports/widgets/` (widgets configuráveis)
- `src/data/premiumTemplates.ts`

### Componentes em `src/components/traffic-reports/`
- `TemplateSelector.tsx`
- `TemplateCustomizer.tsx`
- `WidgetGridRenderer.tsx`

### Hooks e tipos
- `src/hooks/useReportTemplates.ts`
- `src/hooks/useWidgetPresets.ts`
- `src/types/template-editor.ts`
- `src/types/premium-v2.ts`

### Banco de dados (migration única)
```sql
DROP TABLE IF EXISTS public.report_templates CASCADE;
DROP TABLE IF EXISTS public.widget_presets CASCADE;
```

### Botões/UI no dashboard interno
- Botão "Templates" / "Novo Premium" / "Criar Template" em `TrafficReportsDashboard.tsx` e `TrafficReportsTemplates.tsx` (a página inteira sai)
- Item "Templates" na sidebar (se existir)

---

## 2. O que será MANTIDO

- `src/pages/TrafficReports.tsx` — página principal de visualização (interno + portal `/cliente/:accessToken`)
- `src/pages/TrafficReportsDashboard.tsx` — lista de clientes + gestão de portais
- Filtros internos: cliente, contas, **plataforma (Meta/Google/Ambos)** e **período (7/15/30/60/90 dias)** — confirmado
- Toda a camada de dados: `useTrafficInsights`, `useUnifiedData`, `useClientAccounts`, `useClientPortal`, edge function `traffic-insights`
- Componentes "burros" de visualização que serão reaproveitados pelo Master Report:
  - `PlatformViewSelector`, `PortalHeader`, `TrafficReportFilters`, `TrafficReportHeader`, `ClientPortalButton`, `ClientLogoUpload`
  - Charts e tabelas: `InsightsOverview`, `CombinedOverview`, `CampaignsInsightsTable`, `InsightsConversionFunnel`, `TrendCharts`, `ComparativeTrendCharts`, `DemographicsCharts`, `TopCreativesSection`, `LeadsChart`, `ChartCard`, `OverviewCards`, `DetailedTabs`
- Pasta `premium-templates/dashcortex/` (KpiCard, PlatformBlock, RegionTable, OriginPieChart, BudgetCard, SidebarNav) — base do novo Master Report

---

## 3. O Master Report (DashCortex evoluído)

Substitui o `DashCortexTemplate.tsx` por uma versão expandida em **`src/components/traffic-reports/MasterTrafficReport.tsx`**, organizado em seções verticais densas estilo Power BI/Looker, com sidebar lateral de navegação por âncora.

### Estrutura proposta

```text
┌─ Sidebar (sticky) ─┬─────────── Conteúdo ──────────────┐
│  Visão Geral       │  [Hero] Cliente, período, KPIs    │
│  Performance       │   gerais (Investimento, Impr.,    │
│  Plataformas       │   Cliques, CTR, CPC, Conversões,  │
│  Criativos         │   CPA, ROAS, Frequência, CPM)     │
│  Audiência         │                                   │
│  Funil             │  [Performance ao longo do tempo]  │
│  Campanhas         │   Combo chart investimento+conv.  │
│  Conclusões        │   + comparativo período anterior  │
│                    │                                   │
│                    │  [Plataformas lado a lado]        │
│                    │   Bloco Meta + Bloco Google com   │
│                    │   share, KPIs, mini-trend          │
│                    │                                   │
│                    │  [Top Criativos] grid 3x2 com     │
│                    │   thumb + métricas + ranking       │
│                    │                                   │
│                    │  [Audiência] 3 colunas:           │
│                    │   Idade (barras), Gênero (donut), │
│                    │   Região (heatmap/tabela)         │
│                    │                                   │
│                    │  [Funil de Conversão] 4 estágios  │
│                    │                                   │
│                    │  [Tabela de Campanhas] paginada   │
│                    │                                   │
│                    │  [Insights automáticos] cards com │
│                    │   destaques, alertas e variação    │
└────────────────────┴───────────────────────────────────┘
```

### Diretrizes de visual
- Dark glass premium (#0B0F1A base), cartões `bg-white/5 backdrop-blur border border-white/10 rounded-2xl`
- Acentos da marca Muran: laranja `#ff6e00` para destaques positivos, gradientes laranja→roxo `#321e32`
- Tipografia Space Grotesk; hierarquia clara (KPI 36-44px, títulos 18px, labels 11px uppercase tracking)
- Microinterações: hover sutil, badges de variação ▲/▼ coloridos, sparklines em todo KPI
- Responsivo: 12-col em desktop; colapsa em mobile; sidebar vira top nav

### Comportamento por plataforma
- `platform = 'both'` → blocos lado a lado Meta vs Google + agregado
- `platform = 'meta'` ou `'google'` → blocos focados, esconde comparativo cross-platform
- Período controla janelas dos charts e a base do "vs período anterior"

### Insights automáticos (seção nova)
Cards gerados a partir dos dados (sem IA externa):
- Maior queda/alta de CPA vs período anterior
- Campanha campeã em ROAS
- Criativo com melhor CTR
- Plataforma mais eficiente em CPC
- Alerta se frequência > 3 ou CTR < 0.5%

---

## 4. Mudanças em `ReportContent.tsx` e `TrafficReports.tsx`

### `ReportContent.tsx`
Reduzir drasticamente: remove toda lógica de `template`, `widgets`, `premium-v2`, `legacyAdapter`, seções dinâmicas, `WidgetGridRenderer`. Vira só:
```tsx
return <MasterTrafficReport data={activeData} platform={platform} ... />;
```
(Mantém o `PlatformViewSelector` no topo se `hideViewSelector=false`.)

### `TrafficReports.tsx`
- Remove imports e estado de `selectedTemplate`, `customizerOpen`, `TemplateSelector`, `TemplateCustomizer`, `useReportTemplates`
- Remove props `template` que vão pra `ReportContent`
- Mantém todos os filtros e o resto do fluxo

### `TrafficReportsDashboard.tsx`
- Remove qualquer referência a templates, contagens de templates e botões "Templates"/"Novo Premium"
- Mantém: lista de clientes, criar/excluir portal, "Ver Relatório"

### `App.tsx`
- Remove os `lazyWithTimeout` de `TrafficReportsTemplates`, `TrafficReportsViewer`, `TemplateEditorPage`, `PremiumBuilderPage`
- Remove as 6 rotas de templates/editor/premium

### Sidebar
- Verificar `src/components/layout/Sidebar.tsx` e remover item "Templates" se houver

---

## 5. Memória do projeto

Após a limpeza, atualizar `mem://index.md` removendo as ~30 entradas de template editor / premium builder / widgets, e adicionar:
- `mem://features/traffic-reports/master-report` — descrição do modelo único fixo (DashCortex evoluído)

---

## 6. Ordem de execução

1. **Migration**: drop das duas tabelas → pedir aprovação
2. **App.tsx**: remover rotas e lazy imports
3. **Apagar arquivos/pastas** listados em §1
4. **Construir** `MasterTrafficReport.tsx` (e subcomponentes em `premium-templates/dashcortex/` expandidos com novas seções)
5. **Refatorar** `ReportContent.tsx` e `TrafficReports.tsx` (simplificação)
6. **Limpar** `TrafficReportsDashboard.tsx` e Sidebar
7. **QA**: abrir `/relatorios-trafego`, selecionar cliente real, validar Meta/Google/Ambos e cada período; abrir um portal `/cliente/:token` e validar
8. **Atualizar memória**

## Resultado esperado

- Codebase muito mais enxuto (estimativa: ~40 arquivos a menos)
- Zero risco de "Widget não reconhecido" — não há mais widget engine
- Um único relatório premium, sempre consistente, com camadas ricas de visualização e insights
- Fluxo do gestor e do cliente final intactos
