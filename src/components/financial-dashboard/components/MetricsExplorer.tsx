import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetricsData } from "@/components/clients/metrics/useMetricsData";
import { useCosts } from "@/hooks/queries/useCosts";
import { formatBrazilianCurrency } from "@/utils/currencyUtils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { Cost } from "@/types/cost";

// Tipos de período
type PeriodFilter =
  | "last-3-months"
  | "last-6-months"
  | "last-12-months"
  | "last-24-months"
  | "this-year"
  | "last-year";

// Opções de métricas disponíveis
type MetricId =
  | "mrr"
  | "totalCosts"
  | "profit"
  | "margin"
  | "avgTicket"
  | "cac"
  | "ltv"
  | "ltvCac"
  | "churnRate"
  | "clients"
  | "newClients";

interface MetricOption {
  id: MetricId;
  label: string;
  kind: "currency" | "percent" | "number" | "ratio";
}

const METRICS: MetricOption[] = [
  { id: "mrr", label: "Receita (MRR)", kind: "currency" },
  { id: "totalCosts", label: "Custos", kind: "currency" },
  { id: "profit", label: "Lucro", kind: "currency" },
  { id: "margin", label: "Margem", kind: "percent" },
  { id: "avgTicket", label: "Ticket Médio", kind: "currency" },
  { id: "cac", label: "CAC", kind: "currency" },
  { id: "ltv", label: "LTV", kind: "currency" },
  { id: "ltvCac", label: "LTV:CAC", kind: "ratio" },
  { id: "churnRate", label: "Churn (%)", kind: "percent" },
  { id: "clients", label: "Clientes Ativos", kind: "number" },
  { id: "newClients", label: "Novos Clientes", kind: "number" },
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
  return format(d, "M/yy");
}

function formatValue(kind: MetricOption["kind"], value: number | null | undefined) {
  if (value === null || value === undefined || isNaN(value)) return "-";
  switch (kind) {
    case "currency":
      return `R$ ${formatBrazilianCurrency(value)}`;
    case "percent":
      return `${(value).toFixed(1)}%`;
    case "ratio":
      if (!isFinite(value)) return "-";
      return value.toFixed(2) + "x";
    default:
      return `${Math.round(value)}`;
  }
}

function aggregateCostsByMonth(costs: Cost[]) {
  const totals: Record<string, number> = {};
  const marketingSales: Record<string, number> = {};
  for (const c of costs) {
    const month = formatMonth(new Date(c.date));
    const amount = Number(c.amount) || 0;
    totals[month] = (totals[month] || 0) + amount;

    // Se a API já traz categories no objeto Cost, usamos, senão consideramos 0 para marketing/vendas
    const categories = (c as any).categories as Cost["categories"] | undefined;
    const isMktSales = categories?.some((cat) => cat === "marketing" || cat === "vendas");
    marketingSales[month] = (marketingSales[month] || 0) + (isMktSales ? amount : 0);
  }
  return { totals, marketingSales };
}

export const MetricsExplorer = () => {
  const [period, setPeriod] = useState<PeriodFilter>("last-12-months");
  const [metric, setMetric] = useState<MetricId>("profit");

  const dateRange = useMemo(() => getPeriodRange(period), [period]);

  const { data: monthlyMetrics = [], isLoading: loadingMetrics } = useMetricsData({
    start: dateRange.start,
    end: dateRange.end,
  });

  const { costs: costsData = [], isLoading: loadingCosts } = useCosts({
    startDate: format(dateRange.start, "yyyy-MM-dd"),
    endDate: format(dateRange.end, "yyyy-MM-dd"),
  });

  const { totals: costTotalsByMonth, marketingSales: mktSalesByMonth } = useMemo(
    () => aggregateCostsByMonth(costsData || []),
    [costsData]
  );

  // Montar série unificada por mês
  const chartData = useMemo(() => {
    // Base: meses vindos de monthlyMetrics
    return (monthlyMetrics || []).map((m) => {
      const month = m.month; // já no formato M/yy
      const revenue = Number(m.mrr) || 0;
      const costs = costTotalsByMonth[month] || 0;
      const clients = Number(m.clients) || 0;
      const newClients = Number(m.newClients) || 0;
      const churnRate = Number(m.churnRate) || 0; // já em %

      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const avgTicket = clients > 0 ? revenue / clients : 0;
      const cacNumerator = mktSalesByMonth[month] || 0;
      const cac = newClients > 0 ? cacNumerator / newClients : 0;
      const ltv = churnRate > 0 ? avgTicket / (churnRate / 100) : 0; // LTV aproximado (ARPU / churn)
      const ltvCac = cac > 0 ? ltv / cac : 0;

      return {
        month,
        mrr: revenue,
        totalCosts: costs,
        profit,
        margin, // %
        avgTicket,
        cac,
        ltv,
        ltvCac,
        churnRate, // %
        clients,
        newClients,
      } as Record<string, any>;
    });
  }, [monthlyMetrics, costTotalsByMonth, mktSalesByMonth]);

  const selected = METRICS.find((m) => m.id === metric)!;

  const primaryColor = "hsl(var(--muran-primary))";
  const primaryFill = "hsl(var(--muran-primary) / 0.15)";

  const isLoading = loadingMetrics || loadingCosts;

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-muran-dark">Explorador de Métricas</h2>
          <p className="text-sm text-muted-foreground">Visualize diferentes métricas do relatório financeiro por mês</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
              <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
              <SelectItem value="last-12-months">Últimos 12 meses</SelectItem>
              <SelectItem value="last-24-months">Últimos 24 meses</SelectItem>
              <SelectItem value="this-year">Este ano</SelectItem>
              <SelectItem value="last-year">Ano passado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metric} onValueChange={(v) => setMetric(v as MetricId)}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Métrica" />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[260px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="metricFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatValue(selected.kind, v)} width={90} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              labelStyle={{ color: "hsl(var(--muran-dark))" }}
              formatter={(value) => [formatValue(selected.kind, Number(value)), selected.label]}
            />
            <Area
              type="monotone"
              dataKey={selected.id}
              stroke={primaryColor}
              fill="url(#metricFill)"
              strokeWidth={2}
              dot={{ r: 2, stroke: primaryColor, strokeWidth: 1 }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5" />
        <p>
          CAC mensal aproximado: custos de Marketing+Vendas do mês dividido por novos clientes. LTV aproximado: Ticket Médio / Churn mensal.
        </p>
      </div>
    </Card>
  );
};
