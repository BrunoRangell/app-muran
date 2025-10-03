import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetricsData } from "@/components/clients/metrics/useMetricsData";
import { useCostsPaginated } from "@/hooks/queries/useCostsPaginated";
import { useClientsPaginated } from "@/hooks/queries/useClientsPaginated";
import { formatBrazilianCurrency } from "@/utils/currencyUtils";
import { BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DetailsDialog } from "@/components/clients/metrics/components/DetailsDialog";
import { useClientFiltering } from "@/components/clients/metrics/hooks/useClientFiltering";
import { Cost } from "@/types/cost";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLTVBatch } from "@/hooks/useLTVBatch";
import { logger } from "@/lib/logger";

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
  { id: "mrr", label: "Receita Mensal", kind: "currency" },
  { id: "profit", label: "Lucro", kind: "currency" },
  { id: "newClients", label: "Novos Clientes", kind: "number" },
  { id: "churn", label: "Clientes Cancelados", kind: "number" },
  { id: "totalCosts", label: "Custos Totais", kind: "currency" },
  { id: "cac", label: "CAC", kind: "currency" },
  { id: "ltv", label: "LTV (12 meses)", kind: "currency" },
];

function getPeriodRange(filter: PeriodFilter): { start: Date; end: Date } {
  const end = new Date();
  let start = new Date(end);
  switch (filter) {
    case "last-3-months":
      start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
      break;
    case "last-6-months":
      start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      break;
    case "last-12-months":
      start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
      break;
    case "last-24-months":
      start = new Date(end.getFullYear(), end.getMonth() - 23, 1);
      break;
    case "this-year":
      start = new Date(end.getFullYear(), 0, 1);
      break;
    case "last-year":
      start = new Date(end.getFullYear() - 1, 0, 1);
      // fim do ano passado
      end.setFullYear(end.getFullYear() - 1, 11, 31);
      break;
  }
  // Normalizar fim para último dia do mês atual do range
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0);
  return { start, end: normalizedEnd };
}

function formatMonth(d: Date) {
  return format(d, "MMM/yy", { locale: ptBR });
}

function formatValue(kind: MetricOption["kind"], value: number | null | undefined) {
  if (value === null || value === undefined || isNaN(value)) return "-";
  switch (kind) {
    case "currency":
      return `R$ ${formatBrazilianCurrency(value)}`;
    case "percent":
      return `${value.toFixed(1)}%`;
    case "ratio":
      if (!isFinite(value)) return "-";
      return value.toFixed(2) + "x";
    case "number":
      return `${Math.round(value)}`;
    default:
      return `${Math.round(value)}`;
  }
}

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
  const [metric, setMetric] = useState<MetricId>("mrr");
  const [selectedPoint, setSelectedPoint] = useState<{
    month: string;
    metric: string;
    value: number;
  } | null>(null);

  const dateRange = useMemo(() => getPeriodRange(period), [period]);
  
  const { data: monthlyMetrics = [], isLoading: loadingMetrics } = useMetricsData({
    start: dateRange.start,
    end: dateRange.end,
  });
  
  const { costs: costsData = [], isLoading: loadingCosts } = useCostsPaginated({
    startDate: format(dateRange.start, "yyyy-MM-dd"),
    endDate: format(dateRange.end, "yyyy-MM-dd"),
  });
  
  const { clients = [], isLoading: loadingClients } = useClientsPaginated();

  const { getClientsForPeriod } = useClientFiltering();

  // Agregar custos por mês
  const costsByMonth = useMemo(() => aggregateCostsByMonth(costsData || []), [costsData]);

  // Preparar meses para cálculo de LTV em batch
  const targetMonths = useMemo(() => {
    if (!monthlyMetrics || monthlyMetrics.length === 0) return [];
    
    return monthlyMetrics.map(item => {
      try {
        return parse(item.month, "MMM/yy", new Date(), { locale: ptBR });
      } catch {
        return new Date();
      }
    });
  }, [monthlyMetrics]);

  // Buscar LTV em batch usando Edge Function
  const { data: ltvValues = {}, isLoading: isLoadingLTV } = useLTVBatch(targetMonths);

  // Processar dados do gráfico
  const chartData = useMemo(() => {
    if (!monthlyMetrics || monthlyMetrics.length === 0) return [];

    logger.debug('📊 Processando dados para gráfico:', { monthlyMetrics, costsByMonth, ltvValues });
    
    return monthlyMetrics.map(item => {
      const monthCosts = costsByMonth[item.month] || 0;
      const profit = item.mrr - monthCosts;
      
      // Obter LTV do batch calculado
      const monthDate = parse(item.month, "MMM/yy", new Date(), { locale: ptBR });
      const monthKey = format(monthDate, 'yyyy-MM');
      const ltv = ltvValues[monthKey] || 0;
      
      return {
        month: item.month,
        mrr: item.mrr,
        totalCosts: monthCosts,
        profit: profit,
        newClients: item.newClients,
        churn: item.churn,
        cac: item.newClients > 0 ? monthCosts / item.newClients : 0,
        ltv: ltv,
      };
    }).sort((a, b) => {
      try {
        const dateA = parse(a.month, "MMM/yy", new Date(), { locale: ptBR });
        const dateB = parse(b.month, "MMM/yy", new Date(), { locale: ptBR });
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });
  }, [monthlyMetrics, costsByMonth, ltvValues]);

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
        monthStr: String(parse(selectedPoint.month, "MMM/yy", new Date(), { locale: ptBR }).getMonth() + 1),
        yearStr: String(parse(selectedPoint.month, "MMM/yy", new Date(), { locale: ptBR }).getFullYear() % 100),
        metric: selectedPoint.metric,
        clients: clients || []
      })
    : [];

  const isLoading = loadingMetrics || loadingCosts || loadingClients || isLoadingLTV;

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
          <div className="p-2 bg-[#ff6e00]/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-[#ff6e00]" />
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
          <div className="p-2 bg-[#ff6e00]/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-[#ff6e00]" />
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
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{ 
                      background: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      padding: "12px"
                    }}>
                      <p style={{ color: "hsl(var(--foreground))", fontWeight: "medium" }}>{label}</p>
                      <p style={{ color: "hsl(var(--primary))" }}>
                        {`${selected.label}: ${formatValue(selected.kind, Number(payload[0].value))}`}
                      </p>
                      <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px", marginTop: "4px" }}>
                        Clique para ver detalhes
                      </p>
                    </div>
                  );
                }
                return null;
              }}
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
        {metric === "cac" && (
          <p>ℹ️ CAC = Custos ÷ Novos Clientes</p>
        )}
        {metric === "ltv" && (
          <p>ℹ️ LTV = Payments dos últimos 12 meses ÷ Clientes ativos no período</p>
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