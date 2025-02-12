
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, PieChart } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Cost, CostFilters } from "@/types/cost";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface CostsMetricsProps {
  costs: Cost[];
  filters: CostFilters;
}

export function CostsMetrics({ costs, filters }: CostsMetricsProps) {
  const { data: totalRevenue } = useQuery({
    queryKey: ["total-revenue", filters.startDate, filters.endDate],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select("amount");

      if (filters.startDate) {
        query = query.gte("reference_month", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("reference_month", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.reduce((acc, payment) => acc + Number(payment.amount), 0);
    },
  });

  const totalCosts = costs.reduce((acc, cost) => acc + Number(cost.amount), 0);
  const profit = (totalRevenue || 0) - totalCosts;
  const marginProfit = totalRevenue ? (profit / totalRevenue) * 100 : 0;

  const metrics = [
    {
      title: "Total de Custos",
      value: formatCurrency(totalCosts),
      icon: DollarSign,
      color: "text-red-600",
    },
    {
      title: "Lucro",
      value: formatCurrency(profit),
      icon: profit >= 0 ? TrendingUp : TrendingDown,
      color: profit >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Margem de Lucro",
      value: `${marginProfit.toFixed(2)}%`,
      icon: PieChart,
      color: marginProfit >= 0 ? "text-green-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{metric.title}</p>
              <p className={`text-2xl font-semibold ${metric.color}`}>
                {metric.value}
              </p>
            </div>
            <metric.icon className={`h-8 w-8 ${metric.color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
