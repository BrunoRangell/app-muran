import { useMetricsData } from "./metrics/useMetricsData";
import { MetricsChart } from "./metrics/MetricsChart";
import { MetricsHeader } from "./metrics/MetricsHeader";
import { MetricsSwitch } from "./metrics/components/MetricsSwitch";
import { useFinancialMetrics } from "./metrics/hooks/useFinancialMetrics";
import { METRIC_COLORS } from "./metrics/constants/metricColors";
import { Card } from "@/components/ui/card";
export const FinancialMetrics = () => {
  const {
    periodFilter,
    dateRange,
    isCustomDateOpen,
    selectedMetrics,
    allClientsMetrics,
    isLoadingAllClients,
    clients,
    handlePeriodChange,
    setIsCustomDateOpen,
    setDateRange,
    setSelectedMetrics
  } = useFinancialMetrics();
  const {
    data: filteredClientsData
  } = useMetricsData(dateRange);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };
  const formatDecimal = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };
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
  return <div className="space-y-6">
      
      
      {isLoadingAllClients ? <p className="text-gray-600">Carregando métricas...</p> : <>
          {allClientsMetrics && <MetricsHeader metrics={allClientsMetrics} formatCurrency={formatCurrency} formatDecimal={formatDecimal} />}

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Métricas ao Longo do Tempo</h3>
                </div>

                <MetricsSwitch selectedMetrics={selectedMetrics} onMetricChange={handleMetricChange} />

                <MetricsChart title="" data={filteredClientsData || []} periodFilter={periodFilter} onPeriodChange={handlePeriodChange} isCustomDateOpen={isCustomDateOpen} onCustomDateOpenChange={setIsCustomDateOpen} dateRange={dateRange} onDateRangeChange={setDateRange} lines={getActiveLines()} clients={clients} />
              </div>
            </Card>
          </div>
        </>}
    </div>;
};