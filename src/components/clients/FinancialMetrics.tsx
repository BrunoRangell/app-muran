import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";
import { DateRangeFilter, PeriodFilter as PeriodFilterType } from "./types";
import { addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from "date-fns";
import { MetricsChart } from "./metrics/MetricsChart";
import { useMetricsData } from "./metrics/useMetricsData";
import { PeriodFilter } from "./metrics/PeriodFilter";
import { MetricsHeader } from "./metrics/MetricsHeader";

export const FinancialMetrics = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('last-12-months');
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const now = new Date();
    return {
      start: startOfMonth(addMonths(now, -11)),
      end: endOfMonth(now)
    };
  });
  
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  const handlePeriodChange = (value: PeriodFilterType) => {
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
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Métricas Financeiras</h2>
      
      {isLoadingAllClients ? (
        <p className="text-gray-600">Carregando métricas...</p>
      ) : (
        <>
          {allClientsMetrics && (
            <MetricsHeader
              metrics={allClientsMetrics}
              formatCurrency={formatCurrency}
              formatDecimal={formatDecimal}
            />
          )}

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
            />
          </div>
        </>
      )}
    </div>
  );
};