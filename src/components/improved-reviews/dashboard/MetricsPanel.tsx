
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BriefcaseBusiness, 
  BarChart3, 
  DollarSign, 
  PlayCircle,
  Loader2
} from "lucide-react";
import { ClientMetrics } from "../hooks/useUnifiedReviewsData";
import { formatCurrency } from "@/utils/formatters";

interface MetricsPanelProps {
  metrics: ClientMetrics;
  onBatchReview?: () => void;
  isProcessing?: boolean;
}

export function MetricsPanel({ metrics, onBatchReview, isProcessing = false }: MetricsPanelProps) {
  const hasMetrics = metrics && typeof metrics === 'object';
  
  // Garantir que sempre temos valores válidos, mesmo que metrics seja undefined
  const safeMetrics = {
    totalClients: hasMetrics ? metrics.totalClients : 0,
    clientsNeedingAdjustment: hasMetrics ? metrics.clientsNeedingAdjustment : 0,
    totalBudget: hasMetrics ? metrics.totalBudget : 0,
    totalSpent: hasMetrics ? metrics.totalSpent : 0,
    spentPercentage: hasMetrics ? metrics.spentPercentage : 0,
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes</CardTitle>
          <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{safeMetrics.totalClients}</div>
          <p className="text-xs text-muted-foreground">Total de contas</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ajustes Necessários</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{safeMetrics.clientsNeedingAdjustment}</div>
          <p className="text-xs text-muted-foreground">Contas que precisam de ajuste</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(safeMetrics.totalSpent)}</div>
          <p className="text-xs text-muted-foreground">
            {safeMetrics.spentPercentage.toFixed(1)}% do orçamento total
          </p>
        </CardContent>
      </Card>
      
      <Card className={`bg-card ${safeMetrics.clientsNeedingAdjustment > 0 ? 'border-amber-300' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revisar Orçamentos</CardTitle>
          <PlayCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-bold mb-2">
            {safeMetrics.clientsNeedingAdjustment > 0 
              ? `${safeMetrics.clientsNeedingAdjustment} contas precisam de revisão` 
              : "Todos os orçamentos estão OK"}
          </div>
          <Button 
            onClick={onBatchReview}
            disabled={isProcessing || safeMetrics.clientsNeedingAdjustment === 0}
            className="w-full bg-[#ff6e00] hover:bg-[#e56500] text-white"
            size="sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Revisar Todos"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
