import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";
import { calculatePreviousMonthMetrics } from "@/utils/trendsCalculations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths } from "date-fns";

interface ComparativeAnalysisProps {
  filters: CostFilters;
}

export const ComparativeAnalysis = ({ filters }: ComparativeAnalysisProps) => {
  const { allClientsMetrics, isLoadingAllClients, clients } = useFinancialMetrics();

  // Get previous month metrics
  const { data: previousMetrics } = useQuery({
    queryKey: ['previous-month-metrics', clients],
    queryFn: async () => {
      if (!clients || clients.length === 0) return null;
      const previousDate = subMonths(new Date(), 1);
      return await calculatePreviousMonthMetrics(clients, previousDate);
    },
    enabled: !!clients && clients.length > 0,
  });

  if (isLoadingAllClients || !allClientsMetrics || !previousMetrics) {
    return (
      <Card className="p-6 border-l-4 border-l-purple-500">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

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

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const comparisons = [
    {
      metric: 'Receita mensal prevista',
      current: formatCurrency(allClientsMetrics.mrr),
      previous: formatCurrency(previousMetrics.mrr),
      change: calculateChange(allClientsMetrics.mrr, previousMetrics.mrr),
      isPositive: allClientsMetrics.mrr >= previousMetrics.mrr
    },
    {
      metric: 'Churn Rate',
      current: formatDecimal(allClientsMetrics.churnRate) + '%',
      previous: formatDecimal(previousMetrics.churnRate) + '%',
      change: Math.abs(calculateChange(allClientsMetrics.churnRate, previousMetrics.churnRate)),
      isPositive: allClientsMetrics.churnRate <= previousMetrics.churnRate // Lower churn is better
    },
    {
      metric: 'Novos Clientes',
      current: allClientsMetrics.newClientsCount.toString(),
      previous: previousMetrics.newClientsCount.toString(),
      change: calculateChange(allClientsMetrics.newClientsCount, previousMetrics.newClientsCount),
      isPositive: allClientsMetrics.newClientsCount >= previousMetrics.newClientsCount
    },
    {
      metric: 'CAC (3 meses)',
      current: formatCurrency(allClientsMetrics.cac),
      previous: formatCurrency(previousMetrics.cac),
      change: Math.abs(calculateChange(allClientsMetrics.cac, previousMetrics.cac)),
      isPositive: allClientsMetrics.cac <= previousMetrics.cac // Lower CAC is better
    }
  ];

  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (isPositive: boolean) => {
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="p-6 border-l-4 border-l-purple-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Análise Comparativa</h3>
          <p className="text-gray-600">Comparação com período anterior</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparisons.map((comparison, index) => {
          const TrendIcon = getTrendIcon(comparison.change);
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-muran-dark">{comparison.metric}</h4>
                <div className={`flex items-center gap-1 ${getTrendColor(comparison.isPositive)}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {comparison.change > 0 ? '+' : ''}{comparison.change.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Atual:</span>
                  <span className="font-bold text-muran-dark">{comparison.current}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Anterior:</span>
                  <span className="text-gray-600">{comparison.previous}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};