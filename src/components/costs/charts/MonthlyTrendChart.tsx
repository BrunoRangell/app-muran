import { useMemo } from "react";
import { Cost } from "@/types/cost";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

interface MonthlyTrendChartProps {
  costs: Cost[];
}

const chartConfig = {
  value: {
    label: "Valor",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function MonthlyTrendChart({ costs }: MonthlyTrendChartProps) {
  const chartData = useMemo(() => {
    const months: { [key: string]: number } = {};
    
    costs.forEach(cost => {
      const month = cost.date.substring(0, 7); // YYYY-MM
      months[month] = (months[month] || 0) + cost.amount;
    });

    return Object.entries(months)
      .map(([month, value]) => ({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        }),
        value,
        fullMonth: month
      }))
      .sort((a, b) => a.fullMonth.localeCompare(b.fullMonth));
  }, [costs]);

  const maxValue = Math.max(...chartData.map(item => item.value));
  const minValue = Math.min(...chartData.map(item => item.value));
  const yAxisDomain = [
    Math.max(0, minValue * 0.8),
    maxValue * 1.1
  ];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Nenhum dado de evolução mensal disponível
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[450px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--muted-foreground))" 
            opacity={0.2}
          />
          <XAxis 
            dataKey="month" 
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
            tick={{
              fontSize: 12,
              fill: 'hsl(var(--muted-foreground))'
            }}
          />
          <YAxis
            domain={yAxisDomain}
            tickFormatter={(value) => formatCurrency(value)}
            tick={{
              fontSize: 12,
              fill: 'hsl(var(--muted-foreground))'
            }}
            width={100}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Valor"]}
            labelFormatter={(label) => `Mês: ${label}`}
            contentStyle={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem'
            }}
          />
          <Bar 
            dataKey="value" 
            fill="var(--color-value)"
            radius={[6, 6, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}