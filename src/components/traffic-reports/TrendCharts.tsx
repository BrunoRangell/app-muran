import { ChartCard } from "./ChartCard";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Activity 
} from "lucide-react";
import { 
  formatCurrency, 
  formatNumber, 
  formatChartDate,
  calculateCPA,
  calculateCPC,
  CHART_COLORS
} from "@/utils/chartUtils";

interface TimeSeriesData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

interface TrendChartsProps {
  timeSeries: TimeSeriesData[];
  overview: {
    cpa: { current: number };
    cpc: { current: number };
  };
  platform: 'meta' | 'google' | 'both';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
      <p className="font-semibold text-sm">{formatChartDate(label, 'long')}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">
            {entry.name.includes('R$') || entry.name.includes('CPA') || entry.name.includes('CPC')
              ? formatCurrency(entry.value)
              : formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const TrendCharts = ({ timeSeries, overview, platform }: TrendChartsProps) => {
  // Processar dados para incluir métricas calculadas
  const processedData = timeSeries.map(day => ({
    ...day,
    cpa: calculateCPA(day.spend, day.conversions),
    cpc: calculateCPC(day.spend, day.clicks),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Impressões e Cliques */}
        <ChartCard
          title="Impressões e Cliques"
          description="Evolução diária do alcance e engajamento"
          icon={TrendingUp}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData}>
              <defs>
                <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.meta} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CHART_COLORS.meta} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => formatChartDate(date)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="impressions"
                name="Impressões"
                stroke={CHART_COLORS.info}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                fill="url(#impressionsGradient)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="clicks"
                name="Cliques"
                stroke={CHART_COLORS.meta}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                fill="url(#clicksGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gráfico 2: Investimento Diário */}
        <ChartCard
          title="Investimento Diário"
          description="Distribuição de gastos ao longo do período"
          icon={DollarSign}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={processedData}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => formatChartDate(date)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="spend"
                name="Investimento (R$)"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                fill="url(#spendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gráfico 3: Conversões Diárias */}
        <ChartCard
          title="Conversões Diárias"
          description="Volume de conversões por dia"
          icon={Target}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => formatChartDate(date)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="conversions"
                name="Conversões"
                fill={CHART_COLORS.meta}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gráfico 4: CPA e CPC */}
        <ChartCard
          title="CPA e CPC"
          description="Custo por aquisição e custo por clique"
          icon={Activity}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => formatChartDate(date)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cpa"
                name="CPA (R$)"
                stroke={CHART_COLORS.meta}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="cpc"
                name="CPC (R$)"
                stroke={CHART_COLORS.google}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
