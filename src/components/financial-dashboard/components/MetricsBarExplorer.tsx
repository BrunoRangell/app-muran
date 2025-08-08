import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetricsData } from "@/components/clients/metrics/useMetricsData";
import { useCosts } from "@/hooks/queries/useCosts";
import { useClients } from "@/hooks/queries/useClients";
import { formatBrazilianCurrency } from "@/utils/currencyUtils";
import { BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DetailsDialog } from "@/components/clients/metrics/components/DetailsDialog";
import { useClientFiltering } from "@/components/clients/metrics/hooks/useClientFiltering";
import { Cost } from "@/types/cost";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseMonthString } from "@/utils/monthParser";
import { Client } from "@/components/clients/types";
import { supabase } from "@/integrations/supabase/client";

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
  { id: "ltv", label: "LTV", kind: "currency" },
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

// Função para calcular LTV médio baseado em payments reais
const calculateAverageLTV = async (monthStr: string, clients: Client[]): Promise<number> => {
  try {
    // Buscar todos os payments
    const { data: paymentsData, error } = await supabase
      .from("payments")
      .select("client_id, amount");

    if (error) {
      console.error('Erro ao buscar payments:', error);
      return 0;
    }

    // Agrupar payments por cliente
    const paymentsByClient: Record<string, number> = {};
    (paymentsData || []).forEach(payment => {
      const clientId = payment.client_id;
      if (clientId) {
        paymentsByClient[clientId] = (paymentsByClient[clientId] || 0) + Number(payment.amount);
      }
    });

    // Parse da string do mês (ex: "Jan/25")
    const parsedMonth = parseMonthString(monthStr);
    const referenceDate = parsedMonth.monthStart;
    
    // Filtrar clientes que estavam ativos no mês específico
    const activeClientsInMonth = clients.filter(client => {
      const firstPaymentDate = new Date(client.first_payment_date);
      const lastPaymentDate = client.last_payment_date ? new Date(client.last_payment_date) : null;
      
      // Cliente estava ativo se começou antes/durante o mês de referência
      // e não cancelou antes do mês de referência
      const wasActive = firstPaymentDate <= referenceDate &&
        (!lastPaymentDate || lastPaymentDate >= referenceDate);
      
      return wasActive;
    });
    
    if (activeClientsInMonth.length === 0) return 0;
    
    // Calcular LTV individual para cada cliente ativo (soma de payments reais)
    const ltvValues = activeClientsInMonth
      .map(client => paymentsByClient[client.id] || 0)
      .filter(ltv => ltv > 0); // Só considerar clientes que fizeram payments
    
    if (ltvValues.length === 0) return 0;
    
    // Retornar a média dos LTVs reais
    const totalLTV = ltvValues.reduce((sum, ltv) => sum + ltv, 0);
    return totalLTV / ltvValues.length;
    
  } catch (error) {
    console.error('Erro ao calcular LTV médio:', error);
    return 0;
  }
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
  
  const { costs: costsData = [], isLoading: loadingCosts } = useCosts({
    startDate: format(dateRange.start, "yyyy-MM-dd"),
    endDate: format(dateRange.end, "yyyy-MM-dd"),
  });
  
  const { clients, isLoading: loadingClients } = useClients();

  const { getClientsForPeriod } = useClientFiltering();

  // Agregar custos por mês
  const costsByMonth = useMemo(() => aggregateCostsByMonth(costsData || []), [costsData]);

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    console.log('📊 Processando dados para gráfico:', { monthlyMetrics, costsByMonth });
    
    const processData = async () => {
      const processedData = await Promise.all(
        (monthlyMetrics || []).map(async (item) => {
          const monthCosts = costsByMonth[item.month] || 0;
          const profit = item.mrr - monthCosts;
          const averageLTV = await calculateAverageLTV(item.month, clients || []);
          
          return {
            month: item.month,
            mrr: item.mrr,
            totalCosts: monthCosts,
            profit: profit,
            newClients: item.newClients,
            churn: item.churn,
            cac: item.newClients > 0 ? monthCosts / item.newClients : 0,
            ltv: averageLTV, // LTV médio baseado em payments reais
          };
        })
      );
      
      return processedData.sort((a, b) => {
        try {
          const dateA = parse(a.month, "MMM/yy", new Date(), { locale: ptBR });
          const dateB = parse(b.month, "MMM/yy", new Date(), { locale: ptBR });
          return dateA.getTime() - dateB.getTime();
        } catch {
          return 0;
        }
      });
    };

    // Para mantê-lo síncrono, retornamos dados básicos primeiro
    return (monthlyMetrics || []).map(item => {
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
        ltv: 0, // Será calculado assincronamente
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
  }, [monthlyMetrics, costsByMonth, clients]);

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

  const isLoading = loadingMetrics || loadingCosts || loadingClients;

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
          <p>ℹ️ CAC = Custos ÷ Novos Clientes | LTV = Média da soma real de payments de cada cliente</p>
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