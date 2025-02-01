import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Users, DollarSign, CreditCard, Calendar, Percent, BarChart, Info, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { DateRangeFilter, PeriodFilter } from "./types";
import { addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, format } from "date-fns";

export const FinancialMetrics = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this-month');
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const handlePeriodChange = (value: PeriodFilter) => {
    setPeriodFilter(value);
    const now = new Date();
    
    switch (value) {
      case 'this-month':
        setDateRange({
          start: startOfMonth(now),
          end: endOfMonth(now)
        });
        break;
      case 'last-3-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -2)),
          end: endOfMonth(now)
        });
        break;
      case 'last-6-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -5)),
          end: endOfMonth(now)
        });
        break;
      case 'last-12-months':
        setDateRange({
          start: startOfMonth(addMonths(now, -11)),
          end: endOfMonth(now)
        });
        break;
      case 'this-year':
        setDateRange({
          start: startOfYear(now),
          end: endOfYear(now)
        });
        break;
      case 'last-year':
        setDateRange({
          start: startOfYear(subYears(now, 1)),
          end: endOfYear(subYears(now, 1))
        });
        break;
      // Custom period will be handled separately with a date picker
    }
  };

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["clientMetrics", dateRange],
    queryFn: async () => {
      console.log("Fetching client metrics for period:", dateRange);
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching client metrics:", error);
        throw error;
      }

      // Filtra os clientes pelo período selecionado
      const filteredClients = clients.filter(client => {
        const firstPaymentDate = new Date(client.first_payment_date);
        return firstPaymentDate >= dateRange.start && firstPaymentDate <= dateRange.end;
      });

      console.log("Filtered clients for period:", filteredClients);
      return calculateFinancialMetrics(filteredClients);
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

  const generateChartData = () => {
    const months = [];
    let currentDate = new Date(dateRange.start);
    
    while (currentDate <= dateRange.end) {
      months.push({
        month: format(currentDate, 'MMM/yy'),
        mrr: metrics?.mrr || 0,
        clients: metrics?.activeClientsCount || 0,
        churn: metrics?.churnRate || 0
      });
      currentDate = addMonths(currentDate, 1);
    }

    console.log("Generated chart data:", months);
    return months;
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
              title="Total de Clientes Ativos"
              value={metrics?.activeClientsCount || 0}
              tooltip="Número total de clientes ativos cadastrados no sistema"
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

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Evolução do MRR e Total de Clientes</h3>
                <Select value={periodFilter} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">Este mês</SelectItem>
                    <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                    <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
                    <SelectItem value="last-12-months">Últimos 12 meses</SelectItem>
                    <SelectItem value="this-year">Este ano</SelectItem>
                    <SelectItem value="last-year">Ano passado</SelectItem>
                    <SelectItem value="custom">Data personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={generateChartData()}
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Clientes Cancelados por Mês</h3>
                <Select value={periodFilter} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">Este mês</SelectItem>
                    <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                    <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
                    <SelectItem value="last-12-months">Últimos 12 meses</SelectItem>
                    <SelectItem value="this-year">Este ano</SelectItem>
                    <SelectItem value="last-year">Ano passado</SelectItem>
                    <SelectItem value="custom">Data personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={generateChartData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="churn"
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
