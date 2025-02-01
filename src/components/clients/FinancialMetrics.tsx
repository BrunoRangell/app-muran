import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Users, DollarSign, CreditCard, Calendar, Percent, BarChart, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";

export const FinancialMetrics = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["clientMetrics"],
    queryFn: async () => {
      console.log("Fetching client metrics...");
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching client metrics:", error);
        throw error;
      }

      return calculateFinancialMetrics(clients);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDecimal = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    tooltip,
    formatter = (v: number) => v.toString()
  }: {
    icon: any;
    title: string;
    value: number;
    tooltip: string;
    formatter?: (value: number) => string;
  }) => (
    <Card className="p-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-muran-primary/10 rounded-full">
          <Icon className="h-6 w-6 text-muran-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-4">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <h3 className="text-2xl font-bold text-muran-dark">
            {formatter(value || 0)}
          </h3>
        </div>
      </div>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('MRR') 
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Métricas Financeiras</h2>
      
      {isLoading ? (
        <p className="text-gray-600">Carregando métricas...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              icon={Users}
              title="Total de Clientes"
              value={metrics?.totalClients || 0}
              tooltip="Número total de clientes cadastrados no sistema, incluindo ativos e inativos"
              formatter={(value) => value.toString()}
            />

            <MetricCard
              icon={DollarSign}
              title="MRR"
              value={metrics?.mrr || 0}
              tooltip="Monthly Recurring Revenue - Receita mensal recorrente total dos clientes ativos. Soma dos valores de contrato de todos os clientes ativos"
              formatter={formatCurrency}
            />

            <MetricCard
              icon={BarChart}
              title="ARR"
              value={metrics?.arr || 0}
              tooltip="Annual Recurring Revenue - Receita anual recorrente. Calculado multiplicando o MRR por 12"
              formatter={formatCurrency}
            />

            <MetricCard
              icon={Calendar}
              title="Retenção Média"
              value={metrics?.averageRetention || 0}
              tooltip="Tempo médio que os clientes permanecem ativos na plataforma, calculado desde a data do primeiro pagamento"
              formatter={(value) => `${formatDecimal(value)} meses`}
            />

            <MetricCard
              icon={CreditCard}
              title="LTV Médio"
              value={(metrics?.ltv || 0) / (metrics?.totalClients || 1)}
              tooltip="Lifetime Value Médio - Valor médio gerado por cliente durante sua permanência. Calculado dividindo o LTV total pelo número de clientes"
              formatter={formatCurrency}
            />

            <MetricCard
              icon={Percent}
              title="Churn Rate"
              value={metrics?.churnRate || 0}
              tooltip="Taxa de cancelamento mensal de clientes. Porcentagem de clientes que cancelaram em relação ao total"
              formatter={(value) => `${formatDecimal(value)}%`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Evolução do MRR e Total de Clientes</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { month: 'Jan', mrr: metrics?.mrr || 0, clients: metrics?.totalClients || 0 },
                      { month: 'Fev', mrr: metrics?.mrr || 0, clients: metrics?.totalClients || 0 },
                      { month: 'Mar', mrr: metrics?.mrr || 0, clients: metrics?.totalClients || 0 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="mrr"
                      name="MRR"
                      stroke="#ff6e00"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="clients"
                      name="Total de Clientes"
                      stroke="#321e32"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Clientes Cancelados por Mês</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { month: 'Jan', value: metrics?.churnRate || 0 },
                      { month: 'Fev', value: metrics?.churnRate || 0 },
                      { month: 'Mar', value: metrics?.churnRate || 0 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Clientes Cancelados"
                      stroke="#ff6e00"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};