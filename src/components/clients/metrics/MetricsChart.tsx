
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PeriodFilter } from "../types";
import { useClientFiltering } from "./hooks/useClientFiltering";
import { ChartHeader } from "./components/ChartHeader";
import { MetricsLineChart } from "./components/MetricsLineChart";
import { DetailsDialog } from "./components/DetailsDialog";
import { CustomDateRangeDialog } from "./CustomDateRangeDialog";

interface MetricsChartProps {
  title: string;
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
}

export const MetricsChart = ({
  title,
  data,
  periodFilter,
  onPeriodChange,
  isCustomDateOpen,
  onCustomDateOpenChange,
  dateRange,
  onDateRangeChange,
  lines,
  clients
}: MetricsChartProps) => {
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
    <Card className="p-6 space-y-6">
      <ChartHeader 
        title={title}
        periodFilter={periodFilter}
        onPeriodChange={onPeriodChange}
      />
      
      <MetricsLineChart 
        data={data}
        lines={lines}
        onClick={handlePointClick}
      />

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
