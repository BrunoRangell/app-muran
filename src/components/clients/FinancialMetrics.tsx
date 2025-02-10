import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";
import { DateRangeFilter, PeriodFilter as PeriodFilterType } from "./types";
import { addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from "date-fns";
import { MetricsChart } from "./metrics/MetricsChart";
import { useMetricsData } from "./metrics/useMetricsData";
import { MetricsHeader } from "./metrics/MetricsHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

// Cores consistentes para cada métrica
const METRIC_COLORS = {
  mrr: "#ff6e00",        // Cor principal Muran
  clients: "#321e32",    // Cor complementar Muran
  churn: "#c41e3a",      // Vermelho para churn (negativo)
  churnRate: "#8b0000",  // Vermelho mais escuro para taxa
  newClients: "#228b22", // Verde para novos clientes (positivo)
} as const;

export const FinancialMetrics = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('last-12-months');
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const now = new Date();
    return {
      start: startOfMonth(addMonths(now, -11)),
      end: endOfMonth(now)
    };
  });
  
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    mrr: true,
    clients: false,
    churn: false,
    churnRate: false,
    newClients: false,
  });

  const handlePeriodChange = (value: PeriodFilterType) => {
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

      if (error) {
        console.error("Error fetching all clients metrics:", error);
        throw error;
      }

      return calculateFinancialMetrics(clients);
    },
  });

  const { data: filteredClientsData, isLoading: isLoadingFilteredClients } = useMetricsData(dateRange);

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching clients:", error);
        throw error;
      }

      return data;
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

  const getActiveLines = () => {
    const lines = [];
    
    if (selectedMetrics.mrr) {
      lines.push({
        key: "mrr",
        name: "Receita Mensal",
        color: METRIC_COLORS.mrr,
        yAxisId: "mrr"
      });
    }
    
    if (selectedMetrics.clients) {
      lines.push({
        key: "clients",
        name: "Total de Clientes",
        color: METRIC_COLORS.clients,
        yAxisId: "clients"
      });
    }
    
    if (selectedMetrics.churn) {
      lines.push({
        key: "churn",
        name: "Clientes Cancelados",
        color: METRIC_COLORS.churn,
        yAxisId: "clients"
      });
    }
    
    if (selectedMetrics.churnRate) {
      lines.push({
        key: "churnRate",
        name: "Churn Rate",
        color: METRIC_COLORS.churnRate,
        yAxisId: "percentage"
      });
    }
    
    if (selectedMetrics.newClients) {
      lines.push({
        key: "newClients",
        name: "Clientes Adquiridos",
        color: METRIC_COLORS.newClients,
        yAxisId: "clients"
      });
    }
    
    return lines;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Métricas Financeiras</h2>
      
      {isLoadingAllClients ? (
        <p className="text-gray-600">Carregando métricas...</p>
      ) : (
        <>
          {allClientsMetrics && (
            <MetricsHeader
              metrics={allClientsMetrics}
              formatCurrency={formatCurrency}
              formatDecimal={formatDecimal}
            />
          )}

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Métricas ao Longo do Tempo</h3>
                </div>

                <ScrollArea className="w-full p-4 border rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="mrr"
                        checked={selectedMetrics.mrr}
                        onCheckedChange={(checked) => 
                          setSelectedMetrics(prev => ({ ...prev, mrr: checked }))
                        }
                      />
                      <Label htmlFor="mrr">Receita Mensal</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="clients"
                        checked={selectedMetrics.clients}
                        onCheckedChange={(checked) => 
                          setSelectedMetrics(prev => ({ ...prev, clients: checked }))
                        }
                      />
                      <Label htmlFor="clients">Total de Clientes</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="churn"
                        checked={selectedMetrics.churn}
                        onCheckedChange={(checked) => 
                          setSelectedMetrics(prev => ({ ...prev, churn: checked }))
                        }
                      />
                      <Label htmlFor="churn">Clientes Cancelados</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="churnRate"
                        checked={selectedMetrics.churnRate}
                        onCheckedChange={(checked) => 
                          setSelectedMetrics(prev => ({ ...prev, churnRate: checked }))
                        }
                      />
                      <Label htmlFor="churnRate">Churn Rate</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="newClients"
                        checked={selectedMetrics.newClients}
                        onCheckedChange={(checked) => 
                          setSelectedMetrics(prev => ({ ...prev, newClients: checked }))
                        }
                      />
                      <Label htmlFor="newClients">Clientes Adquiridos</Label>
                    </div>
                  </div>
                </ScrollArea>

                <MetricsChart
                  title=""
                  data={filteredClientsData || []}
                  periodFilter={periodFilter}
                  onPeriodChange={handlePeriodChange}
                  isCustomDateOpen={isCustomDateOpen}
                  onCustomDateOpenChange={setIsCustomDateOpen}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  lines={getActiveLines()}
                  clients={clients}
                />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
