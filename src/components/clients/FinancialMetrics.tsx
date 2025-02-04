import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, CreditCard, Calendar, Percent, BarChart, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";
import { DateRangeFilter, PeriodFilter } from "./types";
import { addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from "date-fns";
import { MetricCard } from "./metrics/MetricCard";
import { MetricsChart } from "./metrics/MetricsChart";
import { useMetricsData } from "./metrics/useMetricsData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const FinancialMetrics = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('last-12-months');
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const now = new Date();
    return {
      start: startOfMonth(addMonths(now, -11)),
      end: endOfMonth(now)
    };
  });
  
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  const handlePeriodChange = (value: PeriodFilter) => {
    setPeriodFilter(value);
    const now = new Date();
    
    if (value === 'custom') {
      setIsCustomDateOpen(true);
      return;
    }
    
    switch (value) {
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
    }
  };

  // Query para buscar todos os clientes sem filtro (para os cards)
  const { data: allClientsMetrics, isLoading: isLoadingAllClients } = useQuery({
    queryKey: ["allClientsMetrics"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching all clients metrics:", error);
        throw error;
      }

      return calculateFinancialMetrics(clients);
    },
  });

  // Query para buscar clientes filtrados por período (para os gráficos)
  const { data: filteredClientsData, isLoading: isLoadingFilteredClients } = useMetricsData(dateRange);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff6e00] to-[#ff914d] bg-clip-text text-transparent">
          Performance Financeira
        </h2>
        <div className="flex items-center gap-2 bg-[#ff6e00]/10 px-3 py-1.5 rounded-lg">
          <Info className="h-4 w-4 text-[#ff914d]" />
          <span className="text-sm text-[#ff6e00]">Dados atualizados em tempo real</span>
        </div>
      </div>

      {isLoadingAllClients ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-[#ff914d]">Carregando métricas...</div>
        </div>
      ) : (
        <>
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              icon={Users}
              title="Clientes Ativos"
              value={allClientsMetrics?.activeClientsCount || 0}
              trend={12} // % de crescimento
              tooltip="Clientes com contrato ativo no último mês"
              className="bg-gradient-to-br from-[#160B21] to-[#1A0B2E] border border-[#ff6e00]/20"
            />

            <MetricCard
              icon={DollarSign}
              title="MRR"
              value={allClientsMetrics?.mrr || 0}
              trend={8.5}
              tooltip="Receita Recorrente Mensal"
              formatter={formatCurrency}
              className="bg-gradient-to-br from-[#160B21] to-[#1A0B2E] border border-[#ff6e00]/20"
              currency
            />

            <MetricCard
              icon={BarChart}
              title="ARR"
              value={allClientsMetrics?.arr || 0}
              trend={allClientsMetrics?.arrTrend || 0}
              tooltip="Receita Recorrente Anual"
              formatter={formatCurrency}
              className="bg-gradient-to-br from-[#160B21] to-[#1A0B2E] border border-[#ff6e00]/20"
              currency
            />

            <MetricCard
              icon={Calendar}
              title="Retenção"
              value={allClientsMetrics?.averageRetention || 0}
              trend={-2.3}
              tooltip="Média de permanência (meses)"
              formatter={(value) => `${formatDecimal(value)}m`}
              className="bg-gradient-to-br from-[#160B21] to-[#1A0B2E] border border-[#ff6e00]/20"
            />

            <MetricCard
              icon={CreditCard}
              title="LTV Médio"
              value={(allClientsMetrics?.ltv || 0) / (allClientsMetrics?.totalClients || 1)}
              trend={15}
              tooltip="Valor médio por cliente"
              formatter={formatCurrency}
              className="bg-gradient-to-br from-[#160B21] to-[#1A0B2E] border border-[#ff6e00]/20"
              currency
            />

            <MetricCard
              icon={Percent}
              title="Churn Rate"
              value={allClientsMetrics?.churnRate || 0}
              trend={-4.1}
              tooltip="Taxa de cancelamento mensal"
              formatter={(value) => `${formatDecimal(value)}%`}
              className="bg-gradient-to-br from-[#160B21] to-[#1A0B2E] border border-[#ff6e00]/20"
              inverseTrend
            />
          </div>

          {/* Gráficos com Abas */}
          <Tabs defaultValue="mrr" className="space-y-4">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <TabsList className="bg-[#0f0f15] border border-[#ff6e00]/20">
                <TabsTrigger 
                  value="mrr" 
                  className="data-[state=active]:bg-[#ff6e00] data-[state=active]:text-white"
                >
                  MRR vs Clientes
                </TabsTrigger>
                <TabsTrigger
                  value="churn"
                  className="data-[state=active]:bg-[#ff6e00] data-[state=active]:text-white"
                >
                  Cancelamentos
                </TabsTrigger>
                <TabsTrigger
                  value="ltv"
                  className="data-[state=active]:bg-[#ff6e00] data-[state=active]:text-white"
                >
                  LTV
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2 items-center">
                <PeriodSelector
                  periodFilter={periodFilter}
                  onPeriodChange={handlePeriodChange}
                  isCustomDateOpen={isCustomDateOpen}
                  onCustomDateOpenChange={setIsCustomDateOpen}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>
            </div>

            <TabsContent value="mrr">
              <div className="bg-gradient-to-br from-[#160B21] to-[#1A0B2E] p-4 rounded-xl border border-[#ff6e00]/20">
                <MetricsChart
                  title="Evolução do MRR"
                  data={filteredClientsData || []}
                  lines={[
                    {
                      key: "mrr",
                      name: "MRR",
                      color: "#ff6e00",
                      yAxisId: "left"
                    },
                    {
                      key: "clients",
                      name: "Clientes Ativos",
                      color: "#ff914d",
                      yAxisId: "right",
                      dashed: true
                    }
                  ]}
                  height={300}
                />
              </div>
            </TabsContent>

            <TabsContent value="churn">
              <div className="bg-gradient-to-br from-[#160B21] to-[#1A0B2E] p-4 rounded-xl border border-[#ff6e00]/20">
                <MetricsChart
                  title="Histórico de Cancelamentos"
                  data={filteredClientsData || []}
                  lines={[
                    {
                      key: "churn",
                      name: "Clientes Cancelados",
                      color: "#ff6e00",
                      strokeWidth: 2
                    }
                  ]}
                  height={300}
                />
              </div>
            </TabsContent>

            <TabsContent value="ltv">
              <div className="bg-gradient-to-br from-[#160B21] to-[#1A0B2E] p-4 rounded-xl border border-[#ff6e00]/20">
                <MetricsChart
                  title="Evolução do LTV Médio"
                  data={filteredClientsData || []}
                  lines={[
                    {
                      key: "ltv",
                      name: "LTV Médio",
                      color: "#ff914d",
                      yAxisId: "left"
                    }
                  ]}
                  height={300}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Legenda Interativa */}
          <div className="flex flex-wrap gap-4 items-center justify-center text-sm text-[#ff914d]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#ff6e00]" />
              <span>MRR</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#ff914d] border-2 border-dashed" />
              <span>Clientes Ativos</span>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-[#ff914d]/70 hover:text-[#ff914d] cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-[#0f0f15] border border-[#ff6e00]/20">
                <p className="text-sm">Dados atualizados diariamente às 00:00</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
};
