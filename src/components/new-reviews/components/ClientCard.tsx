
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";
import { TrendingUp, TrendingDown, ArrowRight, Loader, BadgeDollarSign } from "lucide-react";
import { BudgetRecommendation } from "./BudgetRecommendation";
import { ClientWithReview } from "../types/clientTypes";
import { useBudgetCalculator } from "../hooks/useBudgetCalculator";

interface ClientCardProps {
  client: ClientWithReview;
  isProcessing: boolean;
  platform: 'meta' | 'google';
  onReviewClient: (clientId: string) => void;
  onViewDetails: (clientId: string) => void;
}

export function ClientCard({ 
  client, 
  isProcessing, 
  platform, 
  onReviewClient, 
  onViewDetails 
}: ClientCardProps) {
  const { calculate } = useBudgetCalculator();
  
  // Determinar se o cliente tem uma conta de anúncios configurada
  const accountId = platform === 'meta' ? client.meta_account_id : client.google_account_id;
  const hasAccount = !!accountId;
  
  // Verificar se há uma revisão e se está usando orçamento personalizado
  const hasReview = !!client.lastReview;
  const usingCustomBudget = hasReview && client.lastReview?.using_custom_budget;
  
  // Obter os valores relevantes com base na plataforma
  const monthlyBudget = platform === 'meta' ? client.meta_ads_budget : client.google_ads_budget;
  const totalSpent = platform === 'meta' 
    ? client.lastReview?.meta_total_spent 
    : client.lastReview?.google_total_spent;
  const currentDailyBudget = platform === 'meta'
    ? client.lastReview?.meta_daily_budget_current
    : client.lastReview?.google_daily_budget_current;
  const lastFiveDaysAverage = platform === 'meta'
    ? client.lastReview?.meta_last_five_days_spent
    : client.lastReview?.google_last_five_days_spent;
  
  // Calcular orçamento ideal e recomendações
  const budgetInfo = calculate({
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    lastFiveDaysAverage,
    customBudgetAmount: usingCustomBudget ? client.lastReview?.custom_budget_amount : undefined,
    customBudgetEndDate: usingCustomBudget ? client.lastReview?.custom_budget_end_date : undefined,
    usingCustomBudget
  });

  // Data da última revisão
  const lastReviewDate = client.lastReview?.updated_at 
    ? formatDateInBrasiliaTz(client.lastReview.updated_at, "dd 'de' MMMM 'às' HH:mm")
    : "Nunca revisado";
    
  // Classe de borda baseada no status de ajuste
  let borderClass = "";
  if (hasReview) {
    if (budgetInfo.needsBudgetAdjustment) {
      borderClass = budgetInfo.budgetDifference > 0
        ? "border-l-4 border-l-green-500"  // Aumentar orçamento
        : "border-l-4 border-l-red-500";   // Diminuir orçamento
    }
  }
    
  return (
    <Card className={`h-full flex flex-col ${borderClass}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold flex items-center gap-1">
              {client.company_name}
              {usingCustomBudget && (
                <BadgeDollarSign size={16} className="text-[#ff6e00]" />
              )}
            </div>
            <div className="text-xs text-gray-500">{lastReviewDate}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Status da conta */}
          {!hasAccount && (
            <div className="bg-amber-50 text-amber-700 p-2 rounded text-xs">
              Sem conta {platform.toUpperCase()} configurada
            </div>
          )}
          
          {/* Orçamentos */}
          {hasAccount && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-gray-500 text-xs">Orçamento {usingCustomBudget ? 'Personalizado' : 'Mensal'}</div>
                <div className={`font-medium ${usingCustomBudget ? 'text-[#ff6e00]' : ''}`}>
                  {formatCurrency(budgetInfo.monthlyBudget)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 text-xs">Gasto Total</div>
                <div className="font-medium">
                  {hasReview ? formatCurrency(budgetInfo.totalSpent) : "N/A"}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 text-xs">Orç. Diário Atual</div>
                <div className="font-medium">
                  {hasReview && budgetInfo.currentDailyBudget 
                    ? formatCurrency(budgetInfo.currentDailyBudget) 
                    : "N/A"}
                </div>
              </div>
              
              <div>
                <div className="text-gray-500 text-xs">Orç. Diário Ideal</div>
                <div className="font-medium">
                  {hasReview ? formatCurrency(budgetInfo.idealDailyBudget) : "N/A"}
                </div>
              </div>
            </div>
          )}
          
          {/* Recomendação */}
          {hasAccount && hasReview && (
            <div className="mt-2">
              <BudgetRecommendation 
                needsAdjustment={budgetInfo.needsBudgetAdjustment}
                budgetDifference={budgetInfo.budgetDifference}
                needsAdjustmentBasedOnAverage={budgetInfo.needsAdjustmentBasedOnAverage}
                budgetDifferenceBasedOnAverage={budgetInfo.budgetDifferenceBasedOnAverage}
                lastFiveDaysAverage={budgetInfo.lastFiveDaysAverage}
              />
            </div>
          )}
        </div>
        
        {/* Botões de ação */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isProcessing || !hasAccount}
            onClick={() => onReviewClient(client.id)}
          >
            {isProcessing ? (
              <>
                <Loader size={14} className="mr-1 animate-spin" />
                Analisando...
              </>
            ) : "Analisar"}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="w-full bg-[#ff6e00] hover:bg-[#e66300]"
            onClick={() => onViewDetails(client.id)}
          >
            Detalhes
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
