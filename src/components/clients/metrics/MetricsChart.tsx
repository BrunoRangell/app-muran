import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { CustomDateRangeDialog } from "./CustomDateRangeDialog";
import { PeriodFilter } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { formatCurrency } from "@/utils/formatters";

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const value = entry.payload[entry.dataKey];
          const formattedValue = entry.dataKey === 'mrr'
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
            : entry.dataKey === 'churnRate'
            ? `${value.toFixed(1)}%`
            : value;

          return (
            <p 
              key={index} 
              className="text-sm flex items-center gap-2 py-1"
            >
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="text-gray-700">
                {formattedValue}
              </span>
            </p>
          );
        })}
        <p className="text-xs text-gray-500 mt-2">Clique para ver detalhes</p>
      </div>
    );
  }
  return null;
};

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

  const handlePointClick = (point: any) => {
    if (!point.activePayload) return;
    
    const clickedMetric = point.activePayload[0];
    setSelectedPoint({
      month: point.activeLabel,
      metric: clickedMetric.name,
      value: clickedMetric.value
    });
  };

  const getClientsForPeriod = () => {
    if (!selectedPoint || !clients) return [];

    const selectedMonth = selectedPoint.month;
    const [monthName, yearStr] = selectedMonth.split('/');
    const year = Number(`20${yearStr}`);
    const monthIndex = format(new Date(2024, 0, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 0
      : format(new Date(2024, 1, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 1
      : format(new Date(2024, 2, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 2
      : format(new Date(2024, 3, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 3
      : format(new Date(2024, 4, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 4
      : format(new Date(2024, 5, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 5
      : format(new Date(2024, 6, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 6
      : format(new Date(2024, 7, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 7
      : format(new Date(2024, 8, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 8
      : format(new Date(2024, 9, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 9
      : format(new Date(2024, 10, 1), 'MMM', { locale: ptBR })
      .toLowerCase()
      .split('')
      .map((char, index) => index === 0 ? char.toUpperCase() : char)
      .join('') === monthName
      ? 10
      : 11;

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    switch (selectedPoint.metric) {
      case 'Clientes Adquiridos':
        return clients.filter(client => {
          if (!client.first_payment_date) return false;
          const date = new Date(client.first_payment_date);
          return date >= startDate && date <= endDate;
        });
      case 'Clientes Cancelados':
        return clients.filter(client => {
          if (!client.last_payment_date) return false;
          const date = new Date(client.last_payment_date);
          return date >= startDate && date <= endDate;
        });
      default:
        return clients.filter(client => {
          if (!client.first_payment_date) return false;
          const startClient = new Date(client.first_payment_date);
          const endClient = client.last_payment_date ? new Date(client.last_payment_date) : new Date();
          return startClient <= endDate && endClient >= startDate;
        });
    }
  };

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
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Valor do Contrato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Canal de Aquisição</TableHead>
                <TableHead>Início</TableHead>
                {selectedPoint?.metric === 'Clientes Cancelados' && (
                  <TableHead>Último Pagamento</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {getClientsForPeriod().map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.company_name}</TableCell>
                  <TableCell>{formatCurrency(client.contract_value)}</TableCell>
                  <TableCell>{client.status}</TableCell>
                  <TableCell>{client.acquisition_channel}</TableCell>
                  <TableCell>
                    {format(new Date(client.first_payment_date), 'dd/MM/yyyy')}
                  </TableCell>
                  {selectedPoint?.metric === 'Clientes Cancelados' && client.last_payment_date && (
                    <TableCell>
                      {format(new Date(client.last_payment_date), 'dd/MM/yyyy')}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
