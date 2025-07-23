
import { useMetricsData } from "./metrics/useMetricsData";
import { MetricsChart } from "./metrics/MetricsChart";
import { MetricsSwitch } from "./metrics/components/MetricsSwitch";
import { useFinancialMetrics } from "./metrics/hooks/useFinancialMetrics";
import { METRIC_COLORS } from "./metrics/constants/metricColors";

export const FinancialMetrics = () => {
  const {
    periodFilter,
    dateRange,
    isCustomDateOpen,
    selectedMetrics,
    isLoadingFinancialData,
    clients,
    handlePeriodChange,
    setIsCustomDateOpen,
    setDateRange,
    setSelectedMetrics
  } = useFinancialMetrics();

  const {
    data: filteredClientsData
  } = useMetricsData(dateRange);

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
      {isLoadingFinancialData ? (
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
