import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { mockDemographics } from '@/data/mockPreviewData';

const COLORS = ['#ff6e00', '#6366f1', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export function DemographicsPreview() {
  const ageData = mockDemographics.age.map(item => ({
    name: item.range,
    value: item.impressions
  }));

  const genderData = mockDemographics.gender.map(item => ({
    name: item.gender,
    value: item.impressions
  }));

  const locationData = mockDemographics.location.slice(0, 5);

  return (
    <div className="h-full w-full p-3 overflow-auto">
      <div className="grid grid-cols-3 gap-4 h-full">
        {/* Idade - Gráfico de Barras */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-muted-foreground mb-2">Por Idade</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString('pt-BR')}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" fill="#ff6e00" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gênero - Gráfico de Pizza */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-muted-foreground mb-2">Por Gênero</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius="35%"
                  outerRadius="65%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {genderData.map((_, index) => (
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
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {genderData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Localização - Lista */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-muted-foreground mb-2">Por Localização</p>
          <div className="flex-1 space-y-2 overflow-auto">
            {locationData.map((item, index) => (
              <div key={item.city} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <span className="text-xs truncate">
                    {item.city}, {item.state}
                  </span>
                </div>
                <span className="text-xs font-medium text-primary">
                  {item.impressions.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
