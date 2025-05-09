
import React from "react";
import { RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { PlatformMetrics, PlatformType } from "./types";

interface MetricsPanelProps {
  metrics: PlatformMetrics;
  onBatchReview?: () => void;
  isProcessing?: boolean;
  platform?: PlatformType;
}

export function MetricsPanel({
  metrics,
  onBatchReview,
  isProcessing = false,
  platform = "meta"
}: MetricsPanelProps) {
  // Determinando texto baseado na plataforma
  const platformName = platform === "meta" ? "Meta Ads" : "Google Ads";
  
  return (
    <Card className="shadow-sm border border-gray-100">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-bold text-[#321e32] mb-2 md:mb-0">
            Métricas de {platformName}
          </h2>

          {onBatchReview && (
            <Button
              onClick={onBatchReview}
              disabled={isProcessing}
              className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                "Analisar Todos"
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-1">Total de Clientes</div>
            <div className="text-2xl font-bold text-gray-800">{metrics.totalClients}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-1">Necessitam Ajustes</div>
            <div className="text-2xl font-bold text-gray-800">
              {metrics.clientsNeedingAdjustment}
              <span className="text-sm font-normal text-gray-500 ml-1">
                ({Math.round((metrics.clientsNeedingAdjustment / metrics.totalClients) * 100) || 0}%)
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-1">Orçamento Total</div>
            <div className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.totalBudget)}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-1">Gasto Atual</div>
            <div className="flex items-end">
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(metrics.totalSpent)}</div>
              <div className="ml-2 mb-1 flex items-center">
                <div 
                  className={`text-sm font-medium ${
                    metrics.spentPercentage > 90 ? "text-red-500" : 
                    metrics.spentPercentage > 70 ? "text-amber-500" : 
                    "text-emerald-500"
                  }`}
                >
                  {Math.round(metrics.spentPercentage)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
