
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomDateRangeDialog } from "./CustomDateRangeDialog";
import { PeriodFilter } from "../types";
import { CustomTooltip } from "./components/CustomTooltip";
import { ClientDetailsTable } from "./components/ClientDetailsTable";
import { useClientFiltering } from "./hooks/useClientFiltering";

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
  
  const hasTitle = title && title.length > 0;
  const uniqueYAxisIds = [...new Set(lines.map(line => line.yAxisId))];
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
      {hasTitle && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-muran-dark">{title}</h3>
        </div>
      )}
      
      <div className="flex justify-end">
        <Select value={periodFilter} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
            <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
            <SelectItem value="last-12-months">Últimos 12 meses</SelectItem>
            <SelectItem value="this-year">Este ano</SelectItem>
            <SelectItem value="last-year">Ano passado</SelectItem>
            <SelectItem value="custom">Data personalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            onClick={handlePointClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            
            {uniqueYAxisIds.includes('mrr') && (
              <YAxis 
                yAxisId="mrr"
                orientation="left"
                tickFormatter={(value) => 
                  new Intl.NumberFormat('pt-BR', { 
                    notation: 'compact',
                    compactDisplay: 'short',
                    style: 'currency',
                    currency: 'BRL'
                  }).format(value)
                }
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
            )}
            
            {uniqueYAxisIds.includes('clients') && (
              <YAxis 
                yAxisId="clients"
                orientation={uniqueYAxisIds.includes('mrr') ? 'right' : 'left'}
                tickFormatter={(value) => 
                  new Intl.NumberFormat('pt-BR', { 
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(value)
                }
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
            )}
            
            {uniqueYAxisIds.includes('percentage') && (
              <YAxis 
                yAxisId="percentage"
                orientation="right"
                tickFormatter={(value) => `${value}%`}
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
            )}

            <RechartsTooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            
            <Legend 
              verticalAlign="top"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-gray-700 font-medium">{value}</span>
              )}
            />
            
            {lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                yAxisId={line.yAxisId || "left"}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  stroke: '#fff',
                  strokeWidth: 2,
                  fill: line.color,
                  style: { cursor: 'pointer' }
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <CustomDateRangeDialog
        isOpen={isCustomDateOpen}
        onOpenChange={onCustomDateOpenChange}
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
      />

      <Dialog open={!!selectedPoint} onOpenChange={() => setSelectedPoint(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPoint?.metric} - {selectedPoint?.month}
            </DialogTitle>
          </DialogHeader>
          
          <ClientDetailsTable 
            clients={filteredClients}
            metric={selectedPoint?.metric || ''}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
