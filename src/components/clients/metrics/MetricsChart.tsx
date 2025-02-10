
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { CustomDateRangeDialog } from "./CustomDateRangeDialog";
import { PeriodFilter } from "../types";

interface MetricsChartProps {
  title: string;
  data: any[];
  periodFilter: PeriodFilter;
  onPeriodChange: (value: PeriodFilter) => void;
  isCustomDateOpen: boolean;
  onCustomDateOpenChange: (open: boolean) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  lines: Array<{
    key: string;
    name: string;
    color: string;
    yAxisId?: string;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => {
          const value = entry.payload[entry.dataKey];
          const formattedValue = entry.dataKey === 'mrr'
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
            : entry.dataKey === 'churnRate'
            ? `${value.toFixed(1)}%`
            : value;

          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formattedValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export const MetricsChart = ({
  title,
  data,
  periodFilter,
  onPeriodChange,
  isCustomDateOpen,
  onCustomDateOpenChange,
  dateRange,
  onDateRangeChange,
  lines
}: MetricsChartProps) => {
  const hasTitle = title && title.length > 0;
  const uniqueYAxisIds = [...new Set(lines.map(line => line.yAxisId))];

  return (
    <div className="space-y-4">
      {hasTitle && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      
      <div className="flex justify-end">
        <Select value={periodFilter} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
            <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
            <SelectItem value="last-12-months">Últimos 12 meses</SelectItem>
            <SelectItem value="this-year">Este ano</SelectItem>
            <SelectItem value="last-year">Ano passado</SelectItem>
            <SelectItem value="custom">Data personalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            
            {/* Eixo Y para valores monetários */}
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
              />
            )}
            
            {/* Eixo Y para contagem de clientes */}
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
              />
            )}
            
            {/* Eixo Y para percentuais */}
            {uniqueYAxisIds.includes('percentage') && (
              <YAxis 
                yAxisId="percentage"
                orientation="right"
                tickFormatter={(value) => `${value}%`}
              />
            )}

            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            
            {lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                yAxisId={line.yAxisId || "left"}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <CustomDateRangeDialog
        isOpen={isCustomDateOpen}
        onOpenChange={onCustomDateOpenChange}
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
      />
    </div>
  );
};
