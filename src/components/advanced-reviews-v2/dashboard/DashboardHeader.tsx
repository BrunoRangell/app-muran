
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetricsData } from "../context/types";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardHeaderProps {
  lastReviewTime?: Date | null;
  onRefresh?: () => void;
  isLoading?: boolean;
  metrics?: MetricsData;
  platform: "meta" | "google" | "combined";
}

export function DashboardHeader({
  lastReviewTime,
  onRefresh,
  isLoading = false,
  metrics,
  platform
}: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    if (isRefreshing || isLoading) return;
    
    setIsRefreshing(true);
    
    if (onRefresh) {
      await onRefresh();
    }
    
    // Simular um tempo mínimo para feedback visual
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  const platformName = platform === "meta" ? "Meta Ads" : 
                         platform === "google" ? "Google Ads" : "Consolidado";

  return (
    <Card className="p-4 bg-gradient-to-r from-[#ebebf0]/50 to-white">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-[#321e32]">
              Dashboard {platformName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lastReviewTime ? (
                <>
                  Última atualização: {format(lastReviewTime, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </>
              ) : (
                "Nenhuma revisão recente"
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshClick}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing || isLoading ? "animate-spin" : ""}`}
              />
              {isRefreshing || isLoading ? "Atualizando..." : "Atualizar dados"}
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Ajuda
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Esta página exibe uma visão geral dos orçamentos e 
                  permite realizar revisões de orçamentos para ajustar gastos diários.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Métricas resumidas */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            <MetricCard 
              title="Clientes" 
              value={metrics.clientsCount} 
              tooltipText="Total de clientes com conta ativa nesta plataforma" 
            />
            <MetricCard 
              title="Precisam de ajuste" 
              value={metrics.clientsNeedingAdjustment} 
              tooltipText="Clientes que necessitam ajuste no orçamento diário" 
              highlight={metrics.clientsNeedingAdjustment > 0}
            />
            <MetricCard 
              title="Orçamento total" 
              value={formatCurrency(metrics.totalMonthlyBudget)} 
              tooltipText="Soma de todos os orçamentos mensais" 
            />
            <MetricCard 
              title="Gasto até agora" 
              value={formatCurrency(metrics.totalSpent)} 
              tooltipText="Total gasto no mês atual" 
              subValue={`${metrics.averageSpendPercentage}% do orçamento`}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  tooltipText: string;
  highlight?: boolean;
}

function MetricCard({ title, value, subValue, tooltipText, highlight = false }: MetricCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`p-3 rounded-lg ${highlight ? 'bg-orange-100' : 'bg-slate-50'} flex flex-col`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{title}</span>
              <Info className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div className={`mt-1 font-semibold text-lg ${highlight ? 'text-orange-700' : 'text-[#321e32]'}`}>
              {value}
            </div>
            {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
