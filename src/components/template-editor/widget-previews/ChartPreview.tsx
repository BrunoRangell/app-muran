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
import { mockTimeSeries, METRIC_COLORS } from '@/data/mockPreviewData';

interface ChartPreviewProps {
  chartType: ChartType;
  metrics: MetricKey[];
  showLegend?: boolean;
}

export function ChartPreview({ chartType, metrics, showLegend = true }: ChartPreviewProps) {
  // Usar últimos 14 dias para preview mais limpo
  const data = mockTimeSeries.slice(-14).map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
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
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
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
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
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
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
