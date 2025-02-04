import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, CreditCard, Calendar, Percent, BarChart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";
import { DateRangeFilter, PeriodFilter } from "./types";
import { addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from "date-fns";
import { MetricCard } from "./metrics/MetricCard";
import { MetricsChart } from "./metrics/MetricsChart";
import { useMetricsData } from "./metrics/useMetricsData";
import { TooltipProvider } from "@/components/ui/tooltip";

export const FinancialMetrics = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("last-12-months");
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31)
  });

  const { data: filteredClientsData, isLoading: isLoadingMetrics } = useMetricsData(dateRange);

  const { data: allClients, isLoading: isLoadingAllClients } = useQuery({
    queryKey: ["allClients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  const handlePeriodChange = (value: PeriodFilter) => {
    setPeriodFilter(value);
    if (value === "custom") {
      setIsCustomDateOpen(true);
      return;
    }

    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (value) {
      case "last-3-months":
        start = addMonths(today, -3);
        break;
      case "last-6-months":
        start = addMonths(today, -6);
        break;
      case "last-12-months":
        start = addMonths(today, -12);
        break;
      case "this-year":
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      case "last-year":
        start = startOfYear(subYears(today, 1));
        end = endOfYear(subYears(today, 1));
        break;
    }

    setDateRange({
      start: startOfMonth(start),
      end: endOfMonth(end)
    });
  };

  const metrics = allClients ? calculateFinancialMetrics(allClients) : null;

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-muran-dark">Métricas Financeiras</h2>
      
      {isLoadingAllClients ? (
        <p className="text-gray-600">Carregando métricas...</p>
      ) : (
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="MRR (Monthly Recurring Revenue)"
              value={metrics?.mrr || 0}
              icon={DollarSign}
              description="Receita recorrente mensal"
              format="currency"
            />
            <MetricCard
              title="ARR (Annual Recurring Revenue)"
              value={metrics?.arr || 0}
              icon={DollarSign}
              description="Receita recorrente anual"
              format="currency"
            />
            <MetricCard
              title="Retenção Média"
              value={metrics?.averageRetention || 0}
              icon={Calendar}
              description="Tempo médio de permanência dos clientes"
              format="months"
            />
            <MetricCard
              title="Churn Rate"
              value={metrics?.churnRate || 0}
              icon={Percent}
              description="Taxa de cancelamento mensal"
              format="percentage"
            />
            <MetricCard
              title="LTV (Lifetime Value)"
              value={metrics?.ltv || 0}
              icon={CreditCard}
              description="Valor médio gerado por cliente"
              format="currency"
            />
            <MetricCard
              title="Total de Clientes"
              value={metrics?.activeClientsCount || 0}
              icon={Users}
              description="Número de clientes ativos"
              format="number"
            />
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muran-light rounded-lg shadow">
              <MetricsChart
                title="Evolução do MRR e Total de Clientes"
                data={filteredClientsData || []}
                periodFilter={periodFilter}
                onPeriodChange={handlePeriodChange}
                isCustomDateOpen={isCustomDateOpen}
                onCustomDateOpenChange={setIsCustomDateOpen}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                lines={[
                  {
                    key: "mrr",
                    name: "MRR",
                    color: "#ff6e00",
                    yAxisId: "left"
                  },
                  {
                    key: "clients",
                    name: "Total de Clientes",
                    color: "#321e32",
                    yAxisId: "right"
                  }
                ]}
                className="h-64"
              />
            </div>

            <div className="p-4 bg-muran-light rounded-lg shadow">
              <MetricsChart
                title="Clientes Cancelados por Mês"
                data={filteredClientsData || []}
                periodFilter={periodFilter}
                onPeriodChange={handlePeriodChange}
                isCustomDateOpen={isCustomDateOpen}
                onCustomDateOpenChange={setIsCustomDateOpen}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                lines={[
                  {
                    key: "churn",
                    name: "Clientes Cancelados",
                    color: "#ff6e00"
                  }
                ]}
                className="h-64"
              />
            </div>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
};