
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatters";
import { ClientMetrics } from "../hooks/useUnifiedReviewsData";
import { AlertTriangle, TrendingUp, PiggyBank, BarChart3, RefreshCcw } from "lucide-react";
import { BatchProgressBar } from "./BatchProgressBar";

interface MetricsPanelProps {
  metrics: ClientMetrics;
  onBatchReview?: () => void;
  isProcessing?: boolean;
  progress?: number;
  total?: number;
  currentClientName?: string;
  platform?: "meta" | "google";
  onCancelBatchProcessing?: () => void;
}

export function MetricsPanel({ 
  metrics, 
  onBatchReview, 
  isProcessing = false,
  progress = 0,
  total = 0,
  currentClientName,
  platform = "meta",
  onCancelBatchProcessing
}: MetricsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {isProcessing ? (
          <BatchProgressBar
            progress={progress}
            total={total}
            currentClientName={currentClientName}
            platform={platform}
            onCancel={onCancelBatchProcessing}
          />
        ) : (
          onBatchReview && (
            <Button 
              onClick={onBatchReview}
              disabled={metrics.totalClients === 0}
              className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Revisar todos ({metrics.totalClients})
            </Button>
          )
        )}
      </div>
      
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
              <AlertTriangle size={16} className="text-gray-500" />
              Clientes sem conta cadastrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.clientsWithoutAccount}
              <span className="text-sm text-gray-500 ml-2">
                ({Math.round((metrics.clientsWithoutAccount / Math.max(1, metrics.totalClients + metrics.clientsWithoutAccount)) * 100)}%)
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Clientes ativos sem conta configurada
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
              Investimento este mês
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
    </div>
  );
}
