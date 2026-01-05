import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartType, MetricKey, METRIC_LABELS } from '@/types/template-editor';
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
  cpc: '#14b8a6'
};

interface TimeSeriesItem {
  date: string;
  impressions?: number;
  reach?: number;
  clicks?: number;
  ctr?: number;
  conversions?: number;
  spend?: number;
  cpa?: number;
  cpc?: number;
}

interface ChartWidgetProps {
  chartType: ChartType;
  metrics: MetricKey[];
  timeSeries: TimeSeriesItem[];
  showLegend?: boolean;
  title?: string;
}

export function ChartWidget({ 
  chartType, 
  metrics, 
  timeSeries, 
  showLegend = true,
  title 
}: ChartWidgetProps) {
  // Formatar dados para exibição
  const data = timeSeries.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 }
    };

    const xAxisProps = {
      dataKey: "date",
      tick: { fontSize: 10 },
      tickLine: false,
      axisLine: false
    };

    const yAxisProps = {
      tick: { fontSize: 10 },
      tickLine: false,
      axisLine: false,
      tickFormatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)
    };

    const tooltipProps = {
      contentStyle: { 
        backgroundColor: 'hsl(var(--card))', 
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px'
      }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {showLegend && <Legend />}
            {metrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                name={METRIC_LABELS[metric]}
                stroke={METRIC_COLORS[metric]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        );
        
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {showLegend && <Legend />}
            {metrics.map((metric) => (
              <Bar
                key={metric}
                dataKey={metric}
                name={METRIC_LABELS[metric]}
                fill={METRIC_COLORS[metric]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
        
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {showLegend && <Legend />}
            {metrics.map((metric) => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                name={METRIC_LABELS[metric]}
                stroke={METRIC_COLORS[metric]}
                fill={METRIC_COLORS[metric]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="glass-card h-full w-full overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      )}
      <div className="h-full w-full p-3">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() || <div />}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
