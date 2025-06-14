
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { UnifiedLoadingState } from "@/components/common/UnifiedLoadingState";

interface HealthMetricsProps {
  metrics: {
    totalClients: number;
    healthyClients: number;
    problemClients: number;
    totalSpendToday: number;
    totalImpressionsToday: number;
    clientsWithErrors: number;
  } | null;
  isLoading: boolean;
}

export function HealthMetrics({ metrics, isLoading }: HealthMetricsProps) {
  if (isLoading) {
    return <UnifiedLoadingState message="Carregando métricas..." size="sm" />;
  }

  if (!metrics) {
    return null;
  }

  const healthPercentage = metrics.totalClients > 0 
    ? Math.round((metrics.healthyClients / metrics.totalClients) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          <CheckCircle className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalClients}</div>
          <p className="text-xs text-gray-600">
            {metrics.healthyClients} saudáveis, {metrics.problemClients} com problemas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saúde Geral</CardTitle>
          {healthPercentage >= 80 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{healthPercentage}%</div>
          <p className="text-xs text-gray-600">
            Campanhas funcionando normalmente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gasto Total Hoje</CardTitle>
          <TrendingUp className="h-4 w-4 text-[#ff6e00]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalSpendToday)}</div>
          <p className="text-xs text-gray-600">
            Todas as plataformas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Campanhas com Erro</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{metrics.clientsWithErrors}</div>
          <p className="text-xs text-gray-600">
            Requer atenção imediata
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
