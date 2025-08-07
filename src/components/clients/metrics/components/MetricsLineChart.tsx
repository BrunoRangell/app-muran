
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { CustomTooltip } from "./CustomTooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MetricsLineChartProps {
  data: any[];
  lines: Array<{
    key: string;
    name: string;
    color: string;
    yAxisId?: string;
  }>;
  onClick: (point: any) => void;
}

export const MetricsLineChart = ({ data, lines, onClick }: MetricsLineChartProps) => {
  const uniqueYAxisIds = [...new Set(lines.map(line => line.yAxisId))];

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          onClick={onClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => {
              try {
                const [month, year] = value.split('/');
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                return format(date, "MMM'/'yy", { locale: ptBR }).toLowerCase();
              } catch (error) {
                console.error('Erro ao formatar mês:', error, value);
                return value;
              }
            }}
          />
          
          {uniqueYAxisIds.includes('mrr') && (
            <YAxis 
              yAxisId="mrr"
              orientation="left"
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', { 
                  notation: 'compact',
                  compactDisplay: 'short',
                  style: 'currency',
                  currency: 'BRL'
                }).format(value)
              }
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
          )}
          
          {uniqueYAxisIds.includes('clients') && (
            <YAxis 
              yAxisId="clients"
              orientation={uniqueYAxisIds.includes('mrr') ? 'right' : 'left'}
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', { 
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value)
              }
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
          )}
          
          {uniqueYAxisIds.includes('percentage') && (
            <YAxis 
              yAxisId="percentage"
              orientation="right"
              tickFormatter={(value) => `${value}%`}
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
          )}

          <RechartsTooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          
          <Legend 
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-gray-700 font-medium">{value}</span>
            )}
          />
          
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              yAxisId={line.yAxisId || "left"}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ 
                r: 6, 
                stroke: '#fff',
                strokeWidth: 2,
                fill: line.color,
                style: { cursor: 'pointer' }
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
