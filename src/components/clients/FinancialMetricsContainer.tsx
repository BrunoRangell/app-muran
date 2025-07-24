import { useState } from "react";
import { addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from "date-fns";
import { useMetricsData } from "./metrics/useMetricsData";
import { MetricsChart } from "./metrics/MetricsChart";
import { MetricsSwitch } from "./metrics/components/MetricsSwitch";
import { METRIC_COLORS } from "./metrics/constants/metricColors";
import { DateRangeFilter, PeriodFilter } from "./types";

interface FinancialMetricsContainerProps {
  clients: any[];
  isLoading: boolean;
}

export const FinancialMetricsContainer = ({ clients, isLoading }: FinancialMetricsContainerProps) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('last-12-months');
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const now = new Date();
    return {
      start: startOfMonth(addMonths(now, -11)),
      end: endOfMonth(now)
    };
  });
  
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    mrr: true,
    clients: false,
    churn: false,
    churnRate: false,
    newClients: false,
  });

  const handlePeriodChange = (value: PeriodFilter) => {
    setPeriodFilter(value);
    const now = new Date();
    
    if (value === 'custom') {
      setIsCustomDateOpen(true);
      return;
    }
    
    let newDateRange: DateRangeFilter;
    
    switch (value) {
      case 'last-3-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -2)),
          end: endOfMonth(now)
        };
        break;
      case 'last-6-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -5)),
          end: endOfMonth(now)
        };
        break;
      case 'last-12-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -11)),
          end: endOfMonth(now)
        };
        break;
      case 'last-24-months':
        newDateRange = {
          start: startOfMonth(addMonths(now, -23)),
          end: endOfMonth(now)
        };
        break;
      case 'this-year':
        newDateRange = {
          start: startOfYear(now),
          end: endOfYear(now)
        };
        break;
      case 'last-year':
        const lastYear = subYears(now, 1);
        newDateRange = {
          start: startOfYear(lastYear),
          end: endOfYear(lastYear)
        };
        break;
      default:
        newDateRange = {
          start: startOfMonth(addMonths(now, -11)),
          end: endOfMonth(now)
        };
    }
    
    setDateRange(newDateRange);
  };

  const { data: filteredClientsData } = useMetricsData(dateRange);

  const getActiveLines = () => {
    const lines = [];
    if (selectedMetrics.mrr) {
      lines.push({
        key: "mrr",
        name: "Receita Mensal",
        color: METRIC_COLORS.mrr,
        yAxisId: "mrr"
      });
    }
    if (selectedMetrics.clients) {
      lines.push({
        key: "clients",
        name: "Total de Clientes",
        color: METRIC_COLORS.clients,
        yAxisId: "clients"
      });
    }
    if (selectedMetrics.churn) {
      lines.push({
        key: "churn",
        name: "Clientes Cancelados",
        color: METRIC_COLORS.churn,
        yAxisId: "clients"
      });
    }
    if (selectedMetrics.churnRate) {
      lines.push({
        key: "churnRate",
        name: "Churn Rate",
        color: METRIC_COLORS.churnRate,
        yAxisId: "percentage"
      });
    }
    if (selectedMetrics.newClients) {
      lines.push({
        key: "newClients",
        name: "Clientes Adquiridos",
        color: METRIC_COLORS.newClients,
        yAxisId: "clients"
      });
    }
    return lines;
  };

  const handleMetricChange = (metric: string, checked: boolean) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: checked
    }));
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <p className="text-gray-600">Carregando métricas...</p>
      ) : (
        <div className="space-y-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Métricas ao Longo do Tempo</h3>
          </div>

          <MetricsSwitch 
            selectedMetrics={selectedMetrics} 
            onMetricChange={handleMetricChange} 
          />

          <MetricsChart 
            title="" 
            data={filteredClientsData || []} 
            periodFilter={periodFilter} 
            onPeriodChange={handlePeriodChange} 
            isCustomDateOpen={isCustomDateOpen} 
            onCustomDateOpenChange={setIsCustomDateOpen} 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange} 
            lines={getActiveLines()} 
            clients={clients} 
          />
        </div>
      )}
    </div>
  );
};