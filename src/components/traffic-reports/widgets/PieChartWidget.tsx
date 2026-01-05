import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Card } from '@/components/ui/card';
import { MetricKey, DimensionKey, METRIC_LABELS } from '@/types/template-editor';

const COLORS = ['#ff6e00', '#6366f1', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

interface DemographicsData {
  age?: { range: string; impressions: number; clicks: number; conversions: number; spend: number }[];
  gender?: { gender: string; impressions: number; clicks: number; conversions: number; spend: number }[];
  location?: { city: string; state: string; impressions: number; clicks: number; conversions: number; spend: number }[];
}

interface PieChartWidgetProps {
  dimension?: DimensionKey;
  metric?: MetricKey;
  demographics?: DemographicsData;
  showLegend?: boolean;
  title?: string;
  // Legacy prop support
  dataSource?: 'age' | 'gender' | 'location' | 'demographics';
}

export function PieChartWidget({ 
  dimension,
  metric = 'impressions',
  demographics, 
  showLegend = true,
  title,
  dataSource
}: PieChartWidgetProps) {
  // Support legacy dataSource prop or new dimension prop
  const effectiveDimension = dimension || dataSource || 'gender';
  
  // Preparar dados baseados na dimensão e métrica
  const getData = () => {
    if (!demographics) return [];
    
    const metricKey = metric as keyof Omit<DemographicsData['age'][0], 'range'>;
    
    switch (effectiveDimension) {
      case 'gender':
        return (demographics.gender || []).map(item => ({
          name: item.gender,
          value: item[metricKey as keyof typeof item] as number || item.impressions
        }));
      case 'age':
        return (demographics.age || []).map(item => ({
          name: item.range,
          value: item[metricKey as keyof typeof item] as number || item.impressions
        }));
      case 'location':
        return (demographics.location || []).slice(0, 5).map(item => ({
          name: `${item.city}/${item.state}`,
          value: item[metricKey as keyof typeof item] as number || item.impressions
        }));
      default:
        return (demographics.gender || []).map(item => ({
          name: item.gender,
          value: item[metricKey as keyof typeof item] as number || item.impressions
        }));
    }
  };

  const data = getData();

  if (data.length === 0) {
    return (
      <Card className="glass-card h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados demográficos</p>
      </Card>
    );
  }

  // Formatar valor baseado na métrica
  const formatValue = (value: number) => {
    if (metric === 'spend') {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return value.toLocaleString('pt-BR');
  };

  return (
    <Card className="glass-card h-full w-full overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      )}
      <div className="h-full w-full p-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatValue(value)}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            {showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
