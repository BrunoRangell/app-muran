
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatters";
import { ClientMetrics } from "../hooks/useUnifiedReviewsData";
import { AlertTriangle, TrendingUp, PiggyBank, BarChart3 } from "lucide-react";

interface MetricsPanelProps {
  metrics: ClientMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
            <BarChart3 size={16} className="text-[#ff6e00]" />
            Clientes Monitorados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalClients}</div>
          <div className="text-xs text-gray-500 mt-1">
            Clientes ativos com orçamentos configurados
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Necessitam Ajuste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.clientsNeedingAdjustment}
            <span className="text-sm text-gray-500 ml-2">
              ({Math.round((metrics.clientsNeedingAdjustment / Math.max(1, metrics.totalClients)) * 100)}%)
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Clientes com recomendação de ajuste
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" />
            Orçamento Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalBudget)}</div>
          <div className="text-xs text-gray-500 mt-1">
            Total de orçamento mensal configurado
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
            <PiggyBank size={16} className="text-blue-500" />
            Gastos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.totalSpent)}
            <span className="text-sm text-gray-500 ml-2">
              ({Math.round(metrics.spentPercentage)}%)
            </span>
          </div>
          <div className="mt-2">
            <Progress
              value={metrics.spentPercentage}
              className="h-2"
              indicatorClassName={`${
                metrics.spentPercentage > 90
                  ? "bg-red-500"
                  : metrics.spentPercentage > 70
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
