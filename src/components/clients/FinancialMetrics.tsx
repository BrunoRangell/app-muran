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
  // ... (manter o estado e hooks existentes)

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-muran-dark">Métricas Financeiras</h2>
      
      {isLoadingAllClients ? (
        <p className="text-gray-600">Carregando métricas...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ... (manter os MetricCard existentes) */}
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
                className="h-64" // Ajuste a altura dos gráficos para ocupar menos espaço
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
                className="h-64" // Ajuste a altura dos gráficos para ocupar menos espaço
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
