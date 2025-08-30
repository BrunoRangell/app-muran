import { useMemo } from "react";
import { Cost } from "@/types/cost";
import { formatCurrency } from "@/utils/formatters";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useCostCategories } from "../schemas/costFormSchema";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

interface CategoryPieChartProps {
  costs: Cost[];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))", 
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))"
];

export function CategoryPieChart({ costs }: CategoryPieChartProps) {
  const categories = useCostCategories();
  
  const { chartData, chartConfig, totalAmount } = useMemo(() => {
    const categoriesMap = new Map<string, number>();

    costs.forEach(cost => {
      if (cost.categories) {
        cost.categories.forEach(categoryId => {
          const category = categories.find(c => c.id === categoryId);
          if (category) {
            const currentAmount = categoriesMap.get(category.name) || 0;
            categoriesMap.set(category.name, currentAmount + cost.amount);
          }
        });
      }
    });

    const data = Array.from(categoriesMap).map(([name, value]) => ({
      category: name,
      value,
      percentage: 0 // Will be calculated below
    }));

    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Calculate percentages
    data.forEach(item => {
      item.percentage = total > 0 ? (item.value / total) * 100 : 0;
    });

    // Create chart config
    const config: ChartConfig = {};
    data.forEach((item, index) => {
      config[item.category] = {
        label: item.category,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    return { 
      chartData: data, 
      chartConfig: config,
      totalAmount: total
    };
  }, [costs, categories]);

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: entry.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{entry.payload.category}</div>
              <div className="text-muted-foreground text-xs">
                {formatCurrency(entry.payload.value)} ({entry.payload.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Nenhum dado de categoria disponível
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[650px] w-full">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          <div className="text-sm text-muted-foreground">Total de Custos</div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <PieChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={30}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip
              labelFormatter={(label) => label}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.875rem'
              }}
            />
            <Legend content={renderCustomLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}