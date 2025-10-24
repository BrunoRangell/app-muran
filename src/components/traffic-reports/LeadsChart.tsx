import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LeadsDataPoint } from "@/types/traffic-report";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadsChartProps {
  data: LeadsDataPoint[];
}

export const LeadsChart = ({ data }: LeadsChartProps) => {
  const chartData = data.map(point => ({
    ...point,
    dateFormatted: format(parseISO(point.date), 'dd/MM', { locale: ptBR }),
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-muran-dark">Leads por Dia</h2>
        <p className="text-sm text-muted-foreground">Evolução diária de conversões e investimento</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="dateFormatted"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            yAxisId="left"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'investment') return formatCurrency(value);
              return value;
            }}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="metaLeads"
            stroke="#ff6e00"
            strokeWidth={2}
            name="Leads Meta"
            dot={{ fill: '#ff6e00' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="googleLeads"
            stroke="#4285f4"
            strokeWidth={2}
            name="Leads Google"
            dot={{ fill: '#4285f4' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="totalLeads"
            stroke="#321e32"
            strokeWidth={3}
            name="Total de Leads"
            dot={{ fill: '#321e32' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="investment"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Investimento"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
