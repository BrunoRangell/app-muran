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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

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

  const { data: allClientsMetrics, isLoading: isLoadingAllClients } = useQuery({
    queryKey: ["allClientsMetrics"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) throw error;
      return calculateFinancialMetrics(clients);
    },
  });

  const { data: filteredClientsData } = useMetricsData(dateRange);

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

  const PeriodSelector = () => (
    <Select value={periodFilter} onValueChange={(v) => handlePeriodChange(v as PeriodFilter)}>
      <SelectTrigger className="w-[180px] bg-[#0f0f15] border-[#ff6e00]/20">
        <SelectValue placeholder="Selecione o período" />
      </SelectTrigger>
      <SelectContent className="bg-[#0f0f15] border-[#ff6e00]/20">
        <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
        <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
        <SelectItem value="last-12-months">Últimos 12 meses</SelectItem>
        <SelectItem value="this-year">Este ano</SelectItem>
        <SelectItem value="last-year">Ano anterior</SelectItem>
        <SelectItem value="custom">Personalizado</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 bg-gradient-to-b from-[#0f0f15] to-[#1a0b2e] rounded-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff6e00] to-[#ff914d] bg-clip-text text-transparent">
            Métricas Financeiras
          </h2>
          <p className="text-sm text-[#ff914d]/80 mt-1">Dados atualizados em tempo real</p>
        </div>
        <div className="flex gap-2 items-center">
          <PeriodSelector />
          {isCustomDateOpen && (
            <div className="flex gap-2">
              <DatePicker
                selected={dateRange.start}
                onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                className="bg-[#0f0f15] border-[#ff6e00]/20"
              />
              <DatePicker
                selected={dateRange.end}
                onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                className="bg-[#0f0f15] border-[#ff6e00]/20"
              />
              <Button 
                onClick={() => setIsCustomDateOpen(false)}
                className="bg-[#ff6e00] hover:bg-[#ff914d]"
                size="sm"
              >
                Aplicar
              </Button>
            </div>
          )}
        </div>
      </div>

      {isLoadingAllClients ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-[#ff914d]">Carregando métricas...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              icon={Users}
              title="Clientes Ativos"
              value={allClientsMetrics?.activeClientsCount || 0}
              trend={8.2}
              tooltip="Clientes com contrato ativo"
              formatValue={(v) => v.toString()}
              className="bg-[#160B21] border-[#ff6e00]/20"
            />

            <MetricCard
              icon={DollarSign}
              title="MRR"
              value={allClientsMetrics?.mrr || 0}
              trend={12.5}
              tooltip="Receita Mensal Recorrente"
              formatValue={formatCurrency}
              className="bg-[#160B21] border-[#ff6e00]/20"
            />

            <MetricCard
              icon={BarChart}
              title="ARR"
              value={allClientsMetrics?.arr || 0}
              trend={15.3}
              tooltip="Receita Anual Recorrente"
              formatValue={formatCurrency}
              className="bg-[#160B21] border-[#ff6e00]/20"
            />

            <MetricCard
              icon={Calendar}
              title="Retenção"
              value={allClientsMetrics?.averageRetention || 0}
              trend={-2.1}
              tooltip="Média de permanência (meses)"
              formatValue={(v) => `${formatDecimal(v)}m`}
              className="bg-[#160B21] border-[#ff6e00]/20"
            />

            <MetricCard
              icon={CreditCard}
              title="LTV Médio"
              value={(allClientsMetrics?.ltv || 0) / (allClientsMetrics?.totalClients || 1)}
              trend={9.8}
              tooltip="Valor médio por cliente"
              formatValue={formatCurrency}
              className="bg-[#160B21] border-[#ff6e00]/20"
            />

            <MetricCard
              icon={Percent}
              title="Churn Rate"
              value={allClientsMetrics?.churnRate || 0}
              trend={-4.5}
              tooltip="Taxa de cancelamento mensal"
              formatValue={(v) => `${formatDecimal(v)}%`}
              inverseTrend
              className="bg-[#160B21] border-[#ff6e00]/20"
            />
          </div>

          <Tabs defaultValue="mrr" className="space-y-4">
            <TabsList className="bg-[#0f0f15] border border-[#ff6e00]/20">
              <TabsTrigger value="mrr" className="data-[state=active]:bg-[#ff6e00]">MRR</TabsTrigger>
              <TabsTrigger value="churn" className="data-[state=active]:bg-[#ff6e00]">Cancelamentos</TabsTrigger>
              <TabsTrigger value="ltv" className="data-[state=active]:bg-[#ff6e00]">LTV</TabsTrigger>
            </TabsList>

            <TabsContent value="mrr">
              <div className="bg-[#160B21] p-4 rounded-xl border border-[#ff6e00]/20">
                <MetricsChart
                  title="Evolução do MRR"
                  data={filteredClientsData || []}
                  lines={[
                    { key: "mrr", name: "MRR", color: "#ff6e00" },
                    { key: "clients", name: "Clientes", color: "#ff914d", dashed: true }
                  ]}
                  height={300}
                />
              </div>
            </TabsContent>

            <TabsContent value="churn">
              <div className="bg-[#160B21] p-4 rounded-xl border border-[#ff6e00]/20">
                <MetricsChart
                  title="Histórico de Cancelamentos"
                  data={filteredClientsData || []}
                  lines={[
                    { key: "churn", name: "Cancelamentos", color: "#ff6e00" }
                  ]}
                  height={300}
                />
              </div>
            </TabsContent>

            <TabsContent value="ltv">
              <div className="bg-[#160B21] p-4 rounded-xl border border-[#ff6e00]/20">
                <MetricsChart
                  title="Evolução do LTV Médio"
                  data={filteredClientsData || []}
                  lines={[
                    { key: "ltv", name: "LTV Médio", color: "#ff914d" }
                  ]}
                  height={300}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap gap-4 items-center justify-center text-sm text-[#ff914d]">
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#ff6e00]" />
                <span>MRR</span>
              </TooltipTrigger>
              <TooltipContent className="bg-[#0f0f15] border-[#ff6e00]/20">
                Monthly Recurring Revenue
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#ff914d] border-2 border-dashed" />
                <span>Clientes Ativos</span>
              </TooltipTrigger>
              <TooltipContent className="bg-[#0f0f15] border-[#ff6e00]/20">
                Total de clientes com contrato ativo
              </TooltipContent>
            </Tooltip>
          </div>
        </>
      )}
      </div>
    </TooltipProvider>
  );
};
