# Plano: Filtros de período + comparação com mês anterior

## 1. Filtros de período rápido

**`src/components/traffic-reports/TrafficReportFilters.tsx`**
- Adicionar 2 novas opções ao array `quickRanges`: `Este mês` (do dia 1 do mês atual até hoje) e `Mês passado` (dia 1 até último dia do mês anterior).
- Reescrever `handleQuickRange` para aceitar uma função que retorne `{ start, end }` em vez de número de dias, suportando os novos presets de mês.
- Ordem final dos botões: **Este mês**, **Mês passado**, Últimos 7 dias, Últimos 15 dias, Últimos 30 dias, Últimos 90 dias.

**`src/pages/TrafficReports.tsx`**
- Alterar o estado inicial `dateRange` (linha 41-44) para começar no dia 1 do mês atual (default = "Este mês") em vez de `subDays(new Date(), 30)`.
- Adicionar ao `PERIOD_OPTIONS` (usado no modo portal): `{ value: 'this-month', label: 'Este mês' }` e `{ value: 'last-month', label: 'Mês passado' }`. Tornar `this-month` o default do `useState('30')` → `useState('this-month')`.
- Ajustar onde `period` é convertido em range para tratar os novos valores string.

## 2. Botão de comparação "Mesmos dias do mês anterior"

**`src/components/traffic-reports/MasterTrafficReport.tsx`** (seção "Performance ao longo do tempo", linhas 296-335)
- Adicionar um `useState<boolean>('compareLastMonth')` local ao componente.
- Adicionar um botão toggle no `SectionTitle` desse card (canto direito) com label "Comparar com mês anterior" e estado ativo destacado em laranja `#ff6e00`.
- Quando ativo, calcular o range equivalente do mês anterior: `prevStart = subMonths(dateRange.start, 1)` e `prevEnd = subMonths(dateRange.end, 1)`, e disparar uma chamada paralela ao mesmo hook (`useTrafficInsights`) com esse range.
- Fazer um merge da série anterior por **dia do mês** (não por data absoluta) com `mergedSeries`, adicionando os campos `spendPrev` e `conversionsPrev`.
- No `ComposedChart`, quando o toggle estiver ativo, renderizar:
  - Uma `Line` tracejada cinza claro (`stroke-dasharray: 4 4`) para `spendPrev` no eixo esquerdo, label "Investimento (mês anterior)".
  - Uma `Line` tracejada para `conversionsPrev` no eixo direito, label "Conversões (mês anterior)".
- O `Tooltip` formatter precisa mapear os novos `dataKey`s para rótulos em PT-BR.

## Detalhes técnicos

- Reutilizar `subMonths`, `startOfMonth`, `endOfMonth` de `date-fns` (já usado no projeto).
- A chamada paralela ao hook deve ter `enabled: compareLastMonth && !!selectedClient` para evitar request desnecessária.
- O merge por dia do mês usa `new Date(date).getDate()` como chave, garantindo alinhamento visual mesmo quando os meses têm tamanhos diferentes (dias 29-31 inexistentes simplesmente ficam sem valor `Prev`).
- Nenhuma alteração em edge functions ou no backend — apenas frontend/presentation.

## Arquivos afetados

- `src/components/traffic-reports/TrafficReportFilters.tsx`
- `src/pages/TrafficReports.tsx`
- `src/components/traffic-reports/MasterTrafficReport.tsx`
