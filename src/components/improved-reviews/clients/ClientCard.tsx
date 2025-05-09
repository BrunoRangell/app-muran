
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { Badge } from "@/components/ui/badge";
import { BadgeDollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";

interface ClientCardProps {
  client: ClientWithReview;
  onReview?: (clientId: string) => void;
  isProcessing?: boolean;
  platform?: "meta" | "google";
}

export function ClientCard({ 
  client, 
  onReview, 
  isProcessing = false,
  platform = "meta" 
}: ClientCardProps) {
  const lastReview = client.lastReview;
  const hasReview = !!lastReview;
  
  // Determinar se o cliente está usando orçamento personalizado
  const isUsingCustomBudget = hasReview && lastReview?.using_custom_budget;
  const customBudgetAmount = hasReview && lastReview?.custom_budget_amount;
  
  // Determinar valores para exibição
  const metaAccountName = platform === 'meta' 
    ? (lastReview?.meta_account_name || client.meta_account_id || "Conta principal") 
    : (lastReview?.google_account_name || client.google_account_id || "Conta principal");
  
  const totalSpent = hasReview 
    ? (platform === 'meta' ? lastReview.meta_total_spent : lastReview.google_total_spent) 
    : 0;
  
  const currentBudget = hasReview 
    ? (platform === 'meta' ? lastReview.meta_daily_budget_current : lastReview.google_daily_budget_current) 
    : 0;
  
  const monthlyBudget = platform === 'meta' 
    ? (isUsingCustomBudget && customBudgetAmount ? customBudgetAmount : client.meta_ads_budget) 
    : client.google_ads_budget;
  
  // Calcular porcentagem de gasto
  const spentPercentage = monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0;
  
  // Determinar cor da barra de progresso
  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return "bg-green-500";
    if (percentage < 90) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Verificar se o cliente precisa de ajuste (diferença > 5 reais)
  const needsAdjustment = hasReview && lastReview?.needsBudgetAdjustment;
  
  return (
    <Card className={`overflow-hidden border ${needsAdjustment ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-900 flex items-center gap-1">
              {client.company_name}
              {isUsingCustomBudget && (
                <BadgeDollarSign size={16} className="text-[#ff6e00]" />
              )}
            </div>
            {hasReview && needsAdjustment && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">
                Necessita ajuste
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">{metaAccountName}</div>
          
          {isUsingCustomBudget && customBudgetAmount && (
            <div className="mt-1">
              <Badge className="bg-[#ff6e00]/10 text-[#ff6e00] hover:bg-[#ff6e00]/20 border-none">
                Orçamento personalizado: {formatCurrency(customBudgetAmount)}
              </Badge>
            </div>
          )}
        </div>
        
        {hasReview ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500">Gasto Atual</p>
                <p className="text-lg font-medium">{formatCurrency(totalSpent)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Orçamento Mensal</p>
                <p className="text-lg font-medium">{formatCurrency(monthlyBudget)}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Progresso</span>
                <span>{spentPercentage}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(spentPercentage)}`} 
                  style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 p-2 rounded-md">
                <p className="text-xs text-gray-500">Orçamento Diário</p>
                <p className="font-medium">{formatCurrency(currentBudget)}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-md">
                <p className="text-xs text-gray-500">Revisado</p>
                <p className="font-medium">
                  {new Date(lastReview.updated_at).toLocaleDateString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
            <p className="text-sm text-gray-500 text-center">
              Sem dados de revisão disponíveis
            </p>
          </div>
        )}
      </CardContent>

      {onReview && (
        <CardFooter className="p-0">
          <Button
            onClick={() => onReview(client.id)}
            disabled={isProcessing}
            className="w-full rounded-t-none bg-gray-50 hover:bg-gray-100 text-gray-700 border-t"
            variant="ghost"
          >
            {isProcessing && processingIds?.includes(client.id) ? (
              <>Analisando...</>
            ) : (
              <>Revisar</>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
