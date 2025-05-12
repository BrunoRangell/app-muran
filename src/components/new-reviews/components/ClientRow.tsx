
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";
import { ArrowRight, Loader, BadgeDollarSign } from "lucide-react";
import { BudgetRecommendation } from "./BudgetRecommendation";
import { ClientWithReview } from "../types/clientTypes";
import { useBudgetCalculator } from "../hooks/useBudgetCalculator";

interface ClientRowProps {
  client: ClientWithReview;
  isProcessing: boolean;
  platform: 'meta' | 'google';
  onReviewClient: (clientId: string) => void;
  onViewDetails: (clientId: string) => void;
}

export function ClientRow({ 
  client, 
  isProcessing, 
  platform, 
  onReviewClient, 
  onViewDetails 
}: ClientRowProps) {
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
    ? formatDateInBrasiliaTz(client.lastReview.updated_at, "dd/MM HH:mm")
    : "Nunca revisado";
  
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="font-medium text-gray-900 flex items-center">
              {client.company_name}
              {usingCustomBudget && (
                <BadgeDollarSign size={14} className="ml-1 text-[#ff6e00]" />
              )}
            </div>
            <div className="text-xs text-gray-500">{lastReviewDate}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`${usingCustomBudget ? 'text-[#ff6e00] font-medium' : 'text-gray-900'}`}>
          {hasAccount ? formatCurrency(budgetInfo.monthlyBudget) : "N/A"}
        </div>
        {usingCustomBudget && (
          <div className="text-xs text-[#ff6e00]">Personalizado</div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-gray-900">
          {hasAccount && hasReview ? formatCurrency(budgetInfo.totalSpent) : "N/A"}
        </div>
        <div className="text-xs text-gray-500">
          {hasAccount && hasReview ? `${budgetInfo.spentPercentage}%` : ""}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-gray-900">
          {hasAccount && hasReview && budgetInfo.currentDailyBudget
            ? formatCurrency(budgetInfo.currentDailyBudget)
            : "N/A"}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-gray-900">
          {hasAccount && hasReview
            ? formatCurrency(budgetInfo.idealDailyBudget)
            : "N/A"}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {hasAccount && hasReview && (
          <BudgetRecommendation
            needsAdjustment={budgetInfo.needsBudgetAdjustment}
            budgetDifference={budgetInfo.budgetDifference}
            needsAdjustmentBasedOnAverage={budgetInfo.needsAdjustmentBasedOnAverage}
            budgetDifferenceBasedOnAverage={budgetInfo.budgetDifferenceBasedOnAverage}
            lastFiveDaysAverage={budgetInfo.lastFiveDaysAverage}
          />
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isProcessing || !hasAccount}
            onClick={() => onReviewClient(client.id)}
          >
            {isProcessing ? (
              <Loader size={14} className="animate-spin" />
            ) : "Analisar"}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="bg-[#ff6e00] hover:bg-[#e66300]"
            onClick={() => onViewDetails(client.id)}
          >
            <ArrowRight size={14} />
          </Button>
        </div>
      </td>
    </tr>
  );
}
