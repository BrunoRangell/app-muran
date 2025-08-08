import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PeriodFilter } from "../../types";
import { useClientFiltering } from "../hooks/useClientFiltering";
import { MetricsLineChart } from "./MetricsLineChart";
import { DetailsDialog } from "./DetailsDialog";
import { CustomDateRangeDialog } from "../CustomDateRangeDialog";
import { MetricChips } from "./MetricChips";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";

interface EnhancedMetricsChartProps {
  data: any[];
  periodFilter: PeriodFilter;
  onPeriodChange: (value: PeriodFilter) => void;
  isCustomDateOpen: boolean;
  onCustomDateOpenChange: (open: boolean) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  lines: Array<{
    key: string;
    name: string;
    color: string;
    yAxisId?: string;
  }>;
  clients?: any[];
  selectedMetrics: {
    mrr: boolean;
    clients: boolean;
    churn: boolean;
    churnRate: boolean;
    newClients: boolean;
  };
  onMetricChange: (metric: string, checked: boolean) => void;
}

export const EnhancedMetricsChart = ({
  data,
  periodFilter,
  onPeriodChange,
  isCustomDateOpen,
  onCustomDateOpenChange,
  dateRange,
  onDateRangeChange,
  lines,
  clients,
  selectedMetrics,
  onMetricChange
}: EnhancedMetricsChartProps) => {
  const [selectedPoint, setSelectedPoint] = useState<{
    month: string;
    metric: string;
    value: number;
  } | null>(null);

  const { getClientsForPeriod } = useClientFiltering();

  const handlePointClick = (point: any) => {
    if (!point.activePayload) return;
    
    const clickedMetric = point.activePayload[0];
    setSelectedPoint({
      month: point.activeLabel,
      metric: clickedMetric.name,
      value: clickedMetric.value
    });
  };

  const filteredClients = selectedPoint 
    ? getClientsForPeriod({
        monthStr: selectedPoint.month.split('/')[0],
        yearStr: selectedPoint.month.split('/')[1],
        metric: selectedPoint.metric,
        clients
      })
    : [];

  return (
    <Card className="p-5 space-y-5">
      {/* Header Integrado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muran-primary/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-muran-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Métricas ao Longo do Tempo</h3>
            <p className="text-sm text-muted-foreground">Evolução das principais métricas financeiras</p>
          </div>
        </div>
        
        <Select value={periodFilter} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
            <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
            <SelectItem value="last-12-months">Últimos 12 meses</SelectItem>
            <SelectItem value="last-24-months">Últimos 24 meses</SelectItem>
            <SelectItem value="this-year">Este ano</SelectItem>
            <SelectItem value="last-year">Ano passado</SelectItem>
            <SelectItem value="custom">Data personalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Controles de Métricas */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Métricas ativas:</p>
        <MetricChips 
          selectedMetrics={selectedMetrics}
          onMetricChange={onMetricChange}
        />
      </div>
      
      {/* Gráfico Principal - Maior altura */}
      <div className="h-[450px]">
        <MetricsLineChart 
          data={data}
          lines={lines}
          onClick={handlePointClick}
        />
      </div>

      <CustomDateRangeDialog
        isOpen={isCustomDateOpen}
        onOpenChange={onCustomDateOpenChange}
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        multipleMonths={false}
      />

      <DetailsDialog 
        selectedPoint={selectedPoint}
        onOpenChange={() => setSelectedPoint(null)}
        clients={filteredClients}
      />
    </Card>
  );
}