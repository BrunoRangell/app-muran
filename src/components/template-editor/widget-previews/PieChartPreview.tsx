import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { DataSource } from '@/types/template-editor';
import { mockDemographics } from '@/data/mockPreviewData';

interface PieChartPreviewProps {
  dataSource?: DataSource;
  showLegend?: boolean;
}

const COLORS = ['#ff6e00', '#6366f1', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export function PieChartPreview({ dataSource = 'demographics', showLegend = true }: PieChartPreviewProps) {
  // Usar dados de gênero para pizza (mais visual)
  const data = mockDemographics.gender.map(item => ({
    name: item.gender,
    value: item.impressions
  }));

  return (
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
  );
}
