

# Corrigir "Widget não reconhecido" + Editor quebrado

## Causa-raiz (encontrada)

O editor de templates está **completamente quebrado** por um import inexistente, e isso é o que está fazendo aparecer "Widget não reconhecido" / tela em branco / loop infinito de carregamento.

### Problema 1 — Import quebrado (causa principal)
`src/components/template-editor/TemplateEditorCanvas.tsx` linha 9:
```tsx
import 'react-resizable/css/styles.css';
```
O pacote `react-resizable` **não está instalado** no projeto (não existe `node_modules/react-resizable/`). O CSS de resize já vem dentro de `react-grid-layout/css/styles.css` (linha 8), que é o único necessário.

Esse erro de build derruba o `TemplateEditorCanvas` → derruba o `TemplateEditorPage` → o `lazyWithTimeout` em `App.tsx` reporta `Failed to fetch dynamically imported module` → o usuário vê "Carregando..." eterno e/ou "Widget não reconhecido" como fallback de algum render parcial.

### Problema 2 — Mismatch silencioso no PieChart do portal
`WidgetGridRenderer.tsx` (linha 116) passa `dataSource={widget.config.dataSource}` para `PieChartWidget`, mas o template DashCortex Editável salva a config como `dimension: 'gender'`. O `PieChartWidget` aceita ambos via fallback, mas o portal está ignorando `dimension`. Pequeno, mas convém alinhar.

## Correções

### 1. Remover import inexistente
**`src/components/template-editor/TemplateEditorCanvas.tsx`** — apagar a linha 9:
```diff
- import 'react-resizable/css/styles.css';
```
Manter só `import 'react-grid-layout/css/styles.css'` (que já contém os estilos de resize).

### 2. Alinhar PieChart no portal
**`src/components/traffic-reports/WidgetGridRenderer.tsx`** — no case `pie-chart`, passar também `dimension` e `metric`:
```tsx
<PieChartWidget
  dimension={widget.config.dimension as DimensionKey}
  metric={widget.config.metrics?.[0] as MetricKey}
  dataSource={widget.config.dataSource as any}
  demographics={data.demographics}
  showLegend={widget.config.showLegend !== false}
  title={widget.config.title}
/>
```

### 3. Validar template DashCortex Editável no banco
Após corrigir o build, abrir `/relatorios-trafego/templates/editar/<id-do-dashcortex-editavel>` e confirmar que os 9 widgets renderizam (5 KPIs premium, 2 platform-blocks, 1 ranking-table, 1 pie-chart). Se algum aparecer com fallback "Widget não reconhecido", investigar o `widget.type` exato.

## Arquivos editados
- `src/components/template-editor/TemplateEditorCanvas.tsx` (remove 1 linha)
- `src/components/traffic-reports/WidgetGridRenderer.tsx` (ajusta props do pie-chart)

## Resultado esperado
1. Editor de templates volta a abrir sem erro de build
2. `TemplateEditorPage` carrega normalmente (fim do `Failed to fetch dynamically imported module`)
3. Template "DashCortex (Premium Editável)" mostra todos os 9 widgets corretamente, sem "Widget não reconhecido"
4. Pie chart de gênero renderiza com a dimensão correta no portal

