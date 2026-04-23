

# Template Premium Editável + Repertório DashCortex + Fullscreen

## Visão geral

Três entregas combinadas:

1. **Fullscreen real** — DashCortex (Premium Fixo) escapa do container limitado (`max-w-[1600px]` + padding) e ocupa a tela inteira de borda a borda.
2. **Novos widgets premium** com tema escuro (KPI, bloco de plataforma, tabela ranking) — entram no editor e podem ser usados em qualquer template.
3. **Versão editável do DashCortex** — novo template "DashCortex (Premium Editável)" pré-montado com esses widgets, marcado como tema escuro, com sidebar fixa, totalmente customizável.

O template fixo atual (`DashCortex Premium`) **continua existindo intacto**.

---

## Parte 1 — Fullscreen do template Premium Fixo

### Como está hoje
`TrafficReports.tsx` envolve TUDO num `<div className="max-w-[1600px] mx-auto p-4 md:p-8">`. O DashCortex tenta compensar com `-mx-4 sm:-mx-6 lg:-mx-8 -mt-6` mas ainda fica limitado pelo `max-w-[1600px]`.

### Solução
- Detectar template premium **antes** do container limitado em `TrafficReports.tsx`
- Quando `template.sections.premiumLayout === 'dashcortex'` (fixo) **OU** `template.sections.premiumTheme === 'dark'` (editável), renderizar fora do wrapper de largura limitada
- Manter `PortalHeader` no topo (no portal) ou adicionar mini-header próprio no modo interno
- O `DashCortexTemplate` perde os margins negativos e usa `w-full min-h-screen` direto

---

## Parte 2 — Novos widgets premium (tema escuro)

Adicionar 3 tipos novos em `WidgetType` (`src/types/template-editor.ts`):

### `premium-kpi` — KPI premium com barra de progresso
- Ícone circular gradiente (`accent` configurável)
- Valor grande (Space Grotesk bold)
- Mini barra de progresso colorida com % vs período anterior
- Config: `metric` (qualquer MetricKey), `accent` (cor hex), `showComparison`
- DefaultLayout: `w: 3, h: 2`

### `platform-block` — Bloco grande de plataforma
- Header com ícone + título + valor total destacado
- Gráfico de barras (recharts) ocupando 65% da largura
- Lateral direita: 3 mini-métricas empilhadas
- Config: `platform` ('meta' | 'google'), `accent`, `mainMetric`, `sideMetrics[]` (3), `chartMetric`
- DefaultLayout: `w: 6, h: 4`

### `ranking-table` — Tabela de ranking com barras gradiente
- Lista vertical: posição (#), label, valor, barra de gradiente proporcional
- Config: `dataSource` ('regions' | 'campaigns' | 'creatives' | 'age' | 'gender'), `metric`, `limit`, `accent`
- DefaultLayout: `w: 6, h: 5`

### Componentes de renderização
Criar 3 widgets de produção em `src/components/traffic-reports/widgets/`:
- `PremiumKpiWidget.tsx` (reaproveita lógica de `dashcortex/KpiCard.tsx`)
- `PlatformBlockWidget.tsx` (reaproveita `dashcortex/PlatformBlock.tsx`)
- `RankingTableWidget.tsx` (reaproveita `dashcortex/RegionTable.tsx`)

Adicionar cases correspondentes em `WidgetGridRenderer.tsx`.

### Painel de propriedades
Estender `WidgetProperties.tsx` com seções condicionais para os 3 novos tipos: seletores de métrica, color picker para `accent`, seletor de fonte de dados (ranking-table), seletor de plataforma (platform-block).

### Preview na paleta
Criar previews em `src/components/template-editor/widget-previews/`:
- `PremiumKpiPreview.tsx`, `PlatformBlockPreview.tsx`, `RankingTablePreview.tsx`

---

## Parte 3 — Tema escuro no editor + portal

### Novo flag de template
Adicionar `premiumTheme: 'dark'` no JSONB de `sections`. Quando presente:
- **Editor (`TemplateEditorCanvas`)**: canvas inteiro vira `bg-[#0B0F1A]`, grid lines ficam `white/5`, widgets renderizam com aparência dark
- **Portal/Relatório (`WidgetGridRenderer`)**: wrapper externo aplica fundo escuro fullscreen + sidebar fixa
- **Toggle no editor**: novo botão "Tema Premium Dark" no header do `TemplateEditor.tsx` que liga/desliga essa flag

### Sidebar fixa em templates premium editáveis
Quando `premiumTheme === 'dark'`, o `WidgetGridRenderer` renderiza com a `SidebarNav` (mesma do DashCortex) fixa à esquerda + área de widgets à direita dentro de `max-w-[1600px]`. Sidebar é puramente decorativa (links que rolam suavemente).

---

## Parte 4 — Template "DashCortex (Premium Editável)"

### Migração SQL
Inserir um novo template global em `report_templates`:
- `name`: "DashCortex (Premium Editável)"
- `is_global`: true
- `sections`: JSONB com:
  - `premiumTheme: 'dark'`
  - `widgets[]` pré-montados replicando o layout fixo:
    - 5x `premium-kpi` (impressões, cliques, conversões, CTR, investimento) — cada um `w:2, h:2`, lado a lado em `y:0`
    - 1x `platform-block` Meta (`w:6, h:4` em `y:2, x:0`)
    - 1x `platform-block` Google (`w:6, h:4` em `y:2, x:6`)
    - 1x `ranking-table` regiões (`w:6, h:5` em `y:6, x:0`)
    - 1x `pie-chart` origem (`w:6, h:5` em `y:6, x:6`)

### Comportamento
- Aparece no `TemplateSelector` ao lado dos outros
- Ao selecionar, renderiza usando o `WidgetGridRenderer` com tema dark + sidebar fixa
- Pode ser duplicado/editado normalmente — o usuário arrasta widgets, troca métricas, muda cores, salva

---

## Parte 5 — Corrigir erro de runtime atual

O console mostra `Failed to fetch dynamically imported module: TemplateEditorPage.tsx`. Adicionar `loadWithRetry` ao import dinâmico em `App.tsx` (padrão já usado no projeto, vide memória de "Interface Resilience").

---

## Arquivos

**Criados:**
- `src/components/traffic-reports/widgets/PremiumKpiWidget.tsx`
- `src/components/traffic-reports/widgets/PlatformBlockWidget.tsx`
- `src/components/traffic-reports/widgets/RankingTableWidget.tsx`
- `src/components/template-editor/widget-previews/PremiumKpiPreview.tsx`
- `src/components/template-editor/widget-previews/PlatformBlockPreview.tsx`
- `src/components/template-editor/widget-previews/RankingTablePreview.tsx`
- Migração SQL — inserir "DashCortex (Premium Editável)"

**Editados:**
- `src/types/template-editor.ts` — adicionar 3 tipos + metadados no catálogo + propriedades de config (`accent`, `mainMetric`, `sideMetrics`, etc)
- `src/components/traffic-reports/WidgetGridRenderer.tsx` — cases para os 3 widgets + suporte a tema dark + sidebar fixa
- `src/components/template-editor/WidgetRenderer.tsx` — renderizar os 3 novos widgets com mock data no editor
- `src/components/template-editor/WidgetProperties.tsx` — painéis de configuração condicionais
- `src/components/template-editor/WidgetPalette.tsx` — incluir os 3 novos na lista (ícones e categoria "premium")
- `src/components/template-editor/TemplateEditor.tsx` — botão "Tema Premium Dark" + classe condicional no canvas
- `src/components/template-editor/TemplateEditorCanvas.tsx` — aplicar fundo dark quando ativado
- `src/components/traffic-reports/ReportContent.tsx` — detectar `premiumTheme: 'dark'` e propagar para o renderer
- `src/pages/TrafficReports.tsx` — lógica de fullscreen (renderizar fora do wrapper limitado quando template é premium)
- `src/App.tsx` — `loadWithRetry` no import do `TemplateEditorPage`

---

## Resultado esperado

1. **Fullscreen real**: DashCortex Premium Fixo ocupa a tela inteira (sem sobras laterais)
2. **3 novos widgets dark** aparecem na paleta do editor com previews bonitas, totalmente configuráveis
3. **Botão "Tema Premium Dark"** no editor transforma o canvas em escuro premium
4. **Novo template "DashCortex (Premium Editável)"** já vem montado com o layout do print e funciona idêntico ao fixo, mas tudo é movível/editável
5. Ambos os templates (fixo + editável) coexistem no seletor — você escolhe se quer "intocável" ou "customizável"

