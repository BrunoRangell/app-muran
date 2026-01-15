import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { MetricKey, METRIC_LABELS } from '@/types/template-editor';
import { Card } from '@/components/ui/card';

// Cores para métricas
const METRIC_COLORS: Record<MetricKey, string> = {
  impressions: '#ff6e00',
  reach: '#6366f1',
  clicks: '#22c55e',
  ctr: '#f59e0b',
  conversions: '#8b5cf6',
  spend: '#ef4444',
  cpa: '#ec4899',
  cpc: '#14b8a6',
  cpm: '#0ea5e9',
  frequency: '#a855f7',
  videoViews: '#f97316',
  messages: '#84cc16'
};

interface TimeSeriesItem {
  date: string;
  [key: string]: string | number;
}

interface ComboChartWidgetProps {
  barMetric: MetricKey;
  lineMetric: MetricKey;
  timeSeries: TimeSeriesItem[];
  showLegend?: boolean;
  title?: string;
}

export function ComboChartWidget({ 
  barMetric, 
  lineMetric, 
  timeSeries, 
  showLegend = true,
  title 
}: ComboChartWidgetProps) {
  // Formatar dados para exibição
  const data = timeSeries.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  if (data.length === 0) {
    return (
      <Card className="glass-card h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card h-full w-full overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      )}
      <div className="h-full w-full p-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => {
                if (lineMetric === 'cpa' || lineMetric === 'cpc' || lineMetric === 'cpm' || lineMetric === 'spend') {
                  return `R$${v.toFixed(0)}`;
                }
                return v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v);
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number, name: string) => {
                const metric = name === METRIC_LABELS[barMetric] ? barMetric : lineMetric;
                if (metric === 'cpa' || metric === 'cpc' || metric === 'cpm' || metric === 'spend') {
                  return [`R$ ${value.toFixed(2)}`, name];
                }
                if (metric === 'ctr') {
                  return [`${value.toFixed(2)}%`, name];
                }
                return [value.toLocaleString('pt-BR'), name];
              }}
            />
            {showLegend && <Legend />}
            <Bar
              yAxisId="left"
              dataKey={barMetric}
              name={METRIC_LABELS[barMetric]}
              fill={METRIC_COLORS[barMetric]}
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={lineMetric}
              name={METRIC_LABELS[lineMetric]}
              stroke={METRIC_COLORS[lineMetric]}
              strokeWidth={3}
              dot={{ fill: METRIC_COLORS[lineMetric], strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
