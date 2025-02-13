
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Cost, CostFilters } from "@/types/cost";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useCostCategories } from "./schemas/costFormSchema";

interface CostsMetricsProps {
  costs: Cost[];
  filters: CostFilters;
}

const COLORS = ['#FF6E00', '#321E32', '#EBEBF0', '#0F0F0F', '#FF8533', '#4D2F4D', '#D4D4D9', '#262626'];

export function CostsMetrics({ costs, filters }: CostsMetricsProps) {
  const categories = useCostCategories();
  
  const costsByCategory = useMemo(() => {
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

    return Array.from(categoriesMap).map(([name, value]) => ({
      name,
      value
    }));
  }, [costs, categories]);

  const monthlyCosts = useMemo(() => {
    const months: { [key: string]: number } = {};
    costs.forEach(cost => {
      const month = cost.date.substring(0, 7); // YYYY-MM
      months[month] = (months[month] || 0) + cost.amount;
    });
    return Object.entries(months)
      .map(([month, value]) => ({
        month: new Date(month).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        value
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [costs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Custos por Categoria</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costsByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#FF6E00"
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                labelLine={true}
              >
                {costsByCategory.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-6">Evolução Mensal dos Custos</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyCosts}
              margin={{
                top: 20,
                right: 30,
                left: 40,
                bottom: 60
              }}
            >
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                tick={{
                  fontSize: 12,
                  fill: '#6b7280'
                }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                tick={{
                  fontSize: 12,
                  fill: '#6b7280'
                }}
                width={100}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{
                  color: '#374151',
                  fontWeight: 500
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#FF6E00" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
