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

const COLORS = ['#ff6e00', '#6366f1', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

interface DemographicsData {
  age?: { range: string; impressions: number; clicks: number; conversions: number; spend: number }[];
  gender?: { gender: string; impressions: number; clicks: number; conversions: number; spend: number }[];
  location?: { city: string; state: string; impressions: number; clicks: number; conversions: number; spend: number }[];
}

interface PieChartWidgetProps {
  dataSource?: 'age' | 'gender' | 'location' | 'demographics';
  demographics?: DemographicsData;
  showLegend?: boolean;
  title?: string;
}

export function PieChartWidget({ 
  dataSource = 'gender', 
  demographics, 
  showLegend = true,
  title 
}: PieChartWidgetProps) {
  // Preparar dados baseados na fonte
  const getData = () => {
    if (!demographics) return [];
    
    switch (dataSource) {
      case 'gender':
        return (demographics.gender || []).map(item => ({
          name: item.gender,
          value: item.impressions
        }));
      case 'age':
        return (demographics.age || []).map(item => ({
          name: item.range,
          value: item.impressions
        }));
      case 'location':
        return (demographics.location || []).slice(0, 5).map(item => ({
          name: `${item.city}/${item.state}`,
          value: item.impressions
        }));
      default:
        return (demographics.gender || []).map(item => ({
          name: item.gender,
          value: item.impressions
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
              formatter={(value: number) => value.toLocaleString('pt-BR')}
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
