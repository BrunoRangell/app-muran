
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Cost, CostFilters, COST_CATEGORIES_HIERARCHY } from "@/types/cost";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CostsMetricsProps {
  costs: Cost[];
  filters: CostFilters;
}

const COLORS = ['#FF6E00', '#321E32', '#EBEBF0', '#0F0F0F', '#FF8533', '#4D2F4D', '#D4D4D9', '#262626'];

export function CostsMetrics({ costs, filters }: CostsMetricsProps) {
  const totalAmount = useMemo(() => 
    costs.reduce((sum, cost) => sum + cost.amount, 0),
    [costs]
  );

  const costsByMainCategory = useMemo(() => {
    const data = Object.entries(COST_CATEGORIES_HIERARCHY).map(([key, value]) => ({
      name: value.label,
      value: costs
        .filter(cost => cost.main_category === key)
        .reduce((sum, cost) => sum + cost.amount, 0)
    }));
    return data.filter(item => item.value > 0);
  }, [costs]);

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Custos por Categoria</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costsByMainCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#FF6E00"
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
              >
                {costsByMainCategory.map((_, index) => (
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

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Evolução Mensal dos Custos</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyCosts}>
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="value" fill="#FF6E00" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Total de Custos</h4>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Média Mensal</h4>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount / Math.max(1, monthlyCosts.length))}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Quantidade de Registros</h4>
            <p className="text-2xl font-bold text-gray-900">{costs.length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
