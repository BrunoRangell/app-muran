import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { CustomDateRangeDialog } from "./CustomDateRangeDialog";
import { PeriodFilter } from "../types";

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
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes('MRR') 
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)
              : entry.value}
          </p>
        ))}
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
  className
}: MetricsChartProps) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Select value={periodFilter} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]">
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

      <div className={className || "h-[300px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            {lines.some(line => line.yAxisId === "right") && (
              <YAxis yAxisId="right" orientation="right" />
            )}
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            {lines.map((line, index) => (
              <Line
                key={index}
                yAxisId={line.yAxisId || "left"}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
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
    </Card>
  );
};