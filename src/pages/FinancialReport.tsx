
import { FinancialMetrics } from "@/components/clients/FinancialMetrics";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, PieChart } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { DateFilter } from "@/components/costs/filters/DateFilter";
import { CostFilters } from "@/types/cost";

const FinancialReport = () => {
  const [filters, setFilters] = useState<CostFilters>({});

  const { data: costs } = useQuery({
    queryKey: ["costs", filters],
    queryFn: async () => {
      let query = supabase
        .from("costs")
        .select("*");

      if (filters.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("date", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    },
  });

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

  const totalCosts = (costs || []).reduce((acc, cost) => acc + Number(cost.amount), 0);
  const profit = (totalRevenue || 0) - totalCosts;
  const marginProfit = totalRevenue ? (profit / totalRevenue) * 100 : 0;

  const profitMetrics = [
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
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
          Relatório Financeiro
        </h1>
      </div>

      <div className="flex justify-end">
        <DateFilter filters={filters} onFiltersChange={setFilters} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {profitMetrics.map((metric) => (
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

      <FinancialMetrics />
    </div>
  );
};

export default FinancialReport;
