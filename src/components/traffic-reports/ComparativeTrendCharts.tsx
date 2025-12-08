import { Card } from "@/components/ui/card";
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
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeSeriesData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

interface ComparativeTrendChartsProps {
  metaTimeSeries?: TimeSeriesData[];
  googleTimeSeries?: TimeSeriesData[];
}

export function ComparativeTrendCharts({ metaTimeSeries = [], googleTimeSeries = [] }: ComparativeTrendChartsProps) {
  // Combinar dados por data
  const combinedData = (() => {
    const dateMap = new Map<string, any>();

    metaTimeSeries.forEach(ts => {
      if (!dateMap.has(ts.date)) {
        dateMap.set(ts.date, { date: ts.date });
      }
      const entry = dateMap.get(ts.date);
      entry.metaImpressions = ts.impressions;
      entry.metaClicks = ts.clicks;
      entry.metaConversions = ts.conversions;
      entry.metaSpend = ts.spend;
    });

    googleTimeSeries.forEach(ts => {
      if (!dateMap.has(ts.date)) {
        dateMap.set(ts.date, { date: ts.date });
      }
      const entry = dateMap.get(ts.date);
      entry.googleImpressions = ts.impressions;
      entry.googleClicks = ts.clicks;
      entry.googleConversions = ts.conversions;
      entry.googleSpend = ts.spend;
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        formattedDate: format(new Date(d.date), 'dd/MM', { locale: ptBR }),
        metaImpressions: d.metaImpressions || 0,
        googleImpressions: d.googleImpressions || 0,
        metaClicks: d.metaClicks || 0,
        googleClicks: d.googleClicks || 0,
        metaConversions: d.metaConversions || 0,
        googleConversions: d.googleConversions || 0,
        metaSpend: d.metaSpend || 0,
        googleSpend: d.googleSpend || 0,
      }));
  })();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="glass-card p-3 rounded-lg border border-border/50 shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">
                {entry.name.includes('Investimento') 
                  ? formatCurrency(entry.value) 
                  : formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Impressões Comparativo */}
      <Card className="glass-card p-6 border border-border/30">
        <h3 className="text-lg font-semibold mb-4">Impressões por Dia</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={formatNumber}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="metaImpressions"
                name="Meta Ads"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="googleImpressions"
                name="Google Ads"
                stroke="#eab308"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Investimento Empilhado */}
      <Card className="glass-card p-6 border border-border/30">
        <h3 className="text-lg font-semibold mb-4">Investimento Diário</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(v) => `R$${formatNumber(v)}`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="metaSpend"
                name="Investimento Meta"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="googleSpend"
                name="Investimento Google"
                stackId="1"
                stroke="#eab308"
                fill="#eab308"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cliques Comparativo */}
      <Card className="glass-card p-6 border border-border/30">
        <h3 className="text-lg font-semibold mb-4">Cliques por Dia</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={formatNumber}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="metaClicks"
                name="Cliques Meta"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="googleClicks"
                name="Cliques Google"
                fill="#eab308"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Conversões Comparativo */}
      <Card className="glass-card p-6 border border-border/30">
        <h3 className="text-lg font-semibold mb-4">Conversões por Dia</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={formatNumber}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="metaConversions"
                name="Conversões Meta"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="googleConversions"
                name="Conversões Google"
                fill="#eab308"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
