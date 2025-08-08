import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetricsData } from "@/components/clients/metrics/useMetricsData";
import { useCosts } from "@/hooks/queries/useCosts";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DetailsDialog } from "@/components/clients/metrics/components/DetailsDialog";
import { useClientFiltering } from "@/components/clients/metrics/hooks/useClientFiltering";
import { Cost } from "@/types/cost";

export type PeriodFilter = 
  | 'last-3-months' 
  | 'last-6-months' 
  | 'last-12-months'
  | 'last-24-months'
  | 'this-year' 
  | 'last-year';

export type MetricId = "mrr" | "totalCosts" | "profit" | "newClients" | "churn" | "cac" | "ltv";

export interface MetricOption {
  id: MetricId;
  label: string;
  kind: "currency" | "percent" | "ratio" | "number";
}

const METRICS: MetricOption[] = [
  { id: "profit", label: "Lucro", kind: "currency" },
  { id: "totalCosts", label: "Custos Totais", kind: "currency" },
  { id: "mrr", label: "Receita Mensal (MRR)", kind: "currency" },
  { id: "newClients", label: "Novos Clientes", kind: "number" },
  { id: "churn", label: "Clientes Cancelados", kind: "number" },
  { id: "cac", label: "CAC (Custo de Aquisição)", kind: "currency" },
  { id: "ltv", label: "LTV (Valor Vitalício)", kind: "currency" },
];

const getPeriodRange = (filter: PeriodFilter) => {
  const now = new Date();
  const start = new Date();
  
  switch (filter) {
    case "last-3-months":
      start.setMonth(now.getMonth() - 3);
      break;
    case "last-6-months":
      start.setMonth(now.getMonth() - 6);
      break;
    case "last-12-months":
      start.setFullYear(now.getFullYear() - 1);
      break;
    case "last-24-months":
      start.setFullYear(now.getFullYear() - 2);
      break;
    case "this-year":
      start.setMonth(0);
      start.setDate(1);
      break;
    case "last-year":
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      now.setFullYear(now.getFullYear() - 1, 11, 31);
      break;
  }
  
  return { start, end: now };
};

const formatMonth = (d: Date) => {
  return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
};

const formatValue = (kind: MetricOption["kind"], value: number | null | undefined) => {
  if (value == null) return "R$ 0";
  
  switch (kind) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercentage(value);
    case "ratio":
      return `${value.toFixed(1)}x`;
    case "number":
      return value.toString();
    default:
      return value.toString();
  }
};

const aggregateCostsByMonth = (costs: Cost[]) => {
  const costsByMonth: Record<string, number> = {};
  
  costs.forEach(cost => {
    const date = new Date(cost.date);
    const monthKey = formatMonth(date);
    costsByMonth[monthKey] = (costsByMonth[monthKey] || 0) + cost.amount;
  });
  
  return costsByMonth;
};

export const MetricsBarExplorer = () => {
  const [period, setPeriod] = useState<PeriodFilter>("last-12-months");
  const [metric, setMetric] = useState<MetricId>("profit");
  const [selectedPoint, setSelectedPoint] = useState<{
    month: string;
    metric: string;
    value: number;
  } | null>(null);

  const dateRange = getPeriodRange(period);
  
  const { data: monthlyMetrics, isLoading: loadingMetrics } = useMetricsData(dateRange);
  const { costs: costsData, isLoading: loadingCosts } = useCosts({
    startDate: dateRange.start.toISOString().split('T')[0],
    endDate: dateRange.end.toISOString().split('T')[0]
  });

  const { getClientsForPeriod } = useClientFiltering();

  // Agregar custos por mês
  const costsByMonth = aggregateCostsByMonth(costsData || []);

  // Processar dados para o gráfico
  const chartData = (monthlyMetrics || []).map(item => {
    const monthCosts = costsByMonth[item.month] || 0;
    const profit = item.mrr - monthCosts;
    
    return {
      month: item.month,
      mrr: item.mrr,
      totalCosts: monthCosts,
      profit: profit,
      newClients: item.newClients,
      churn: item.churn,
      cac: item.newClients > 0 ? monthCosts / item.newClients : 0,
      ltv: item.mrr * 12, // Estimativa simples: MRR * 12
    };
  }).sort((a, b) => {
    const [monthA, yearA] = a.month.split('/').map(Number);
    const [monthB, yearB] = b.month.split('/').map(Number);
    return yearA === yearB ? monthA - monthB : yearA - yearB;
  });

  const selected = METRICS.find((m) => m.id === metric)!;
  const primaryColor = "#ff6e00";

  const handleBarClick = (data: any) => {
    if (!data || !data.activePayload) return;
    
    const barData = data.activePayload[0].payload;
    setSelectedPoint({
      month: barData.month,
      metric: selected.label,
      value: barData[metric]
    });
  };

  const filteredClients = selectedPoint 
    ? getClientsForPeriod({
        monthStr: selectedPoint.month.split('/')[0],
        yearStr: selectedPoint.month.split('/')[1],
        metric: selectedPoint.metric,
        clients: []
      })
    : [];

  const isLoading = loadingMetrics || loadingCosts;

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-[320px] bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="p-4 md:p-6 text-center">
        <div className="flex items-center gap-3 justify-center mb-4">
          <div className="p-2 bg-muran-primary/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-muran-primary" />
          </div>
          <h2 className="text-xl font-semibold">Análise Comparativa por Barras</h2>
        </div>
        <p className="text-muted-foreground">Não há dados disponíveis para o período selecionado.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muran-primary/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-muran-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Análise Comparativa por Barras</h2>
            <p className="text-sm text-muted-foreground">Compare métricas mensais com visualização em barras - clique nas barras para detalhes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(value: PeriodFilter) => setPeriod(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-3-months">3 meses</SelectItem>
              <SelectItem value="last-6-months">6 meses</SelectItem>
              <SelectItem value="last-12-months">12 meses</SelectItem>
              <SelectItem value="last-24-months">24 meses</SelectItem>
              <SelectItem value="this-year">Este ano</SelectItem>
              <SelectItem value="last-year">Ano passado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={metric} onValueChange={(value: MetricId) => setMetric(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }} 
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickFormatter={(v) => formatValue(selected.kind, v)} 
              width={90}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{ 
                background: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value) => [formatValue(selected.kind, Number(value)), selected.label]}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Bar 
              dataKey={metric} 
              fill={primaryColor}
              stroke={primaryColor}
              strokeWidth={0}
              radius={[4, 4, 0, 0]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 <strong>Dica:</strong> Clique nas barras para ver detalhes do mês</p>
        {(metric === "cac" || metric === "ltv") && (
          <p>ℹ️ CAC = Custos ÷ Novos Clientes | LTV = MRR × 12 (estimativa simples)</p>
        )}
      </div>

      <DetailsDialog 
        selectedPoint={selectedPoint}
        onOpenChange={() => setSelectedPoint(null)}
        clients={filteredClients}
      />
    </Card>
  );
};