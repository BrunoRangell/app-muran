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

export const FinancialMetrics = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('last-12-months');
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const now = new Date();
    return {
      start: startOfMonth(addMonths(now, -11)),
      end: endOfMonth(now)
    };
  });
  
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  const handlePeriodChange = (value: PeriodFilter) => {
    setPeriodFilter(value);
    const now = new Date();
    
    if (value === 'custom') {
      setIsCustomDateOpen(true);
      return;
    }
    
    switch (value) {
      case 'last-3-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -2)),
          end: endOfMonth(now)
        });
        break;
      case 'last-6-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -5)),
          end: endOfMonth(now)
        });
        break;
      case 'last-12-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -11)),
          end: endOfMonth(now)
        });
        break;
      case 'this-year':
        setDateRange({
          start: startOfYear(now),
          end: endOfYear(now)
        });
        break;
      case 'last-year':
        setDateRange({
          start: startOfYear(subYears(now, 1)),
          end: endOfYear(subYears(now, 1))
        });
        break;
    }
  };

  const { data: allClientsMetrics, isLoading: isLoadingAllClients } = useQuery({
    queryKey: ["allClientsMetrics"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching all clients metrics:", error);
        throw error;
      }

      return calculateFinancialMetrics(clients);
    },
  });

  const { data: filteredClientsData, isLoading: isLoadingFilteredClients } = useMetricsData(dateRange);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDecimal = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-muran-dark">Métricas Financeiras</h2>
      
      {isLoadingAllClients ? (
        <p className="text-gray-600">Carregando métricas...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              icon={Users}
              title="Total de Clientes Ativos"
              value={allClientsMetrics?.activeClientsCount || 0}
              tooltip="Número total de clientes ativos cadastrados no sistema"
              formatter={(value) => value.toString()}
              className="bg-muran-light text-muran-dark"
            />

            <MetricCard
              icon={DollarSign}
              title="MRR"
              value={allClientsMetrics?.mrr || 0}
              tooltip="Monthly Recurring Revenue - Receita mensal recorrente total dos clientes ativos"
              formatter={formatCurrency}
              className="bg-muran-light text-muran-dark"
            />

            <MetricCard
              icon={BarChart}
              title="ARR"
              value={allClientsMetrics?.arr || 0}
              tooltip="Annual Recurring Revenue - Receita anual recorrente"
              formatter={formatCurrency}
              className="bg-muran-light text-muran-dark"
            />

            <MetricCard
              icon={Calendar}
              title="Retenção Média"
              value={allClientsMetrics?.averageRetention || 0}
              tooltip="Tempo médio que os clientes permanecem ativos"
              formatter={(value) => `${formatDecimal(value)} meses`}
              className="bg-muran-light text-muran-dark"
            />

            <MetricCard
              icon={CreditCard}
              title="LTV Médio"
              value={(allClientsMetrics?.ltv || 0) / (allClientsMetrics?.totalClients || 1)}
              tooltip="Lifetime Value Médio"
              formatter={formatCurrency}
              className="bg-muran-light text-muran-dark"
            />

            <MetricCard
              icon={Percent}
              title="Churn Rate"
              value={allClientsMetrics?.churnRate || 0}
              tooltip="Taxa de cancelamento mensal de clientes"
              formatter={(value) => `${formatDecimal(value)}%`}
              className="bg-muran-light text-muran-dark"
            />
          </div>

          <div className="space-y-6">
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
              className="p-4 bg-muran-light rounded-lg shadow"
            />

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
              className="p-4 bg-muran-light rounded-lg shadow"
            />
          </div>
        </>
      )}
    </div>
  );
};
