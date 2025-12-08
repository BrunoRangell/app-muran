import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { mockTimeSeries, METRIC_COLORS } from '@/data/mockPreviewData';

export function TrendsPreview() {
  // Usar últimos 14 dias
  const data = mockTimeSeries.slice(-14).map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div className="h-full w-full p-3 overflow-auto">
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Impressões e Cliques */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-muted-foreground mb-2">Impressões e Cliques</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  name="Impressões"
                  stroke={METRIC_COLORS.impressions}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  name="Cliques"
                  stroke={METRIC_COLORS.clicks}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversões */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-muted-foreground mb-2">Conversões</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  name="Conversões"
                  stroke={METRIC_COLORS.conversions}
                  fill={METRIC_COLORS.conversions}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Investimento */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-muted-foreground mb-2">Investimento (R$)</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  name="Investimento"
                  stroke={METRIC_COLORS.spend}
                  fill={METRIC_COLORS.spend}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CTR */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-muted-foreground mb-2">CTR (%)</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ctr"
                  name="CTR"
                  stroke={METRIC_COLORS.ctr}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
