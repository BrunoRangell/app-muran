import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Cost, CostFilters } from "@/types/cost";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
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

  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="text-sm">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="mb-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span>
                {entry.payload.name}: {formatCurrency(entry.payload.value)} 
                ({(entry.payload.value / costs.reduce((sum, cost) => sum + cost.amount, 0) * 100).toFixed(1)}%)
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-6">Custos por Categoria</h3>
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={costsByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#FF6E00"
              >
                {costsByCategory.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '0.5rem'
                }}
              />
              <Legend
                content={renderLegend}
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{
                  paddingLeft: "20px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-6">Evolução Mensal dos Custos</h3>
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyCosts}
              margin={{
                top: 20,
                right: 40,
                left: 60,
                bottom: 70
              }}
            >
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={70}
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
                width={120}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '0.5rem'
                }}
                labelStyle={{
                  color: '#374151',
                  fontWeight: 500,
                  marginBottom: '0.25rem'
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
