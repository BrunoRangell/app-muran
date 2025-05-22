
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { AlertCircle, Calendar, AlertTriangle } from "lucide-react";
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { BudgetRecommendation } from "@/components/daily-reviews/dashboard/BudgetRecommendation";
import { getRemainingDaysInMonth } from "@/components/daily-reviews/summary/utils";
import { Badge } from "@/components/ui/badge";

export interface ExpandedDetailsProps {
  client: any;
  platform?: "meta" | "google";
  isUsingCustomBudget?: boolean;
  customBudget?: any;
  originalBudgetAmount?: number;
  budgetAmount?: number;
  lastFiveDaysAvg?: number;
}

export function ExpandedDetails({ 
  client, 
  platform = "meta",
  isUsingCustomBudget = false,
  customBudget = null,
  originalBudgetAmount = 0,
  budgetAmount = 0,
  lastFiveDaysAvg = 0
}: ExpandedDetailsProps) {
  const reviewData = client.review;
  const budgetCalc = client.budgetCalculation || {};
  const spentAmount = reviewData?.[`${platform}_total_spent`] || 0;
  const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const currentDailyBudget = reviewData?.[`${platform}_daily_budget_current`] || 0;
  const remainingDays = getRemainingDaysInMonth();
  
  const hasReview = !!reviewData;
  const hasRealData = platform === "google" ? (reviewData?.has_real_data !== false) : true;
  const needsAdjustment = budgetCalc.needsBudgetAdjustment || false;
  const needsAdjustmentAverage = platform === "google" ? (budgetCalc.needsAdjustmentBasedOnAverage || false) : false;
  const showRecommendation = needsAdjustment;
  const showRecommendationAverage = platform === "google" ? needsAdjustmentAverage : false;
  const budgetDifference = budgetCalc.budgetDifference || 0;
  const budgetDifferenceAverage = platform === "google" ? (budgetCalc.budgetDifferenceBasedOnAverage || 0) : 0;

  return (
    <div className="mt-4 space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
          Detalhes de Orçamento
          {platform === "google" && !hasRealData && (
            <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">
              <AlertTriangle size={12} className="mr-1" />
              Sem dados da API
            </Badge>
          )}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Orçamento Mensal</div>
            <div className="font-medium">
              {formatCurrency(budgetAmount)}
              {isUsingCustomBudget && (
                <span className="text-xs ml-1 text-[#ff6e00]">
                  (personalizado)
                </span>
              )}
            </div>
            {isUsingCustomBudget && originalBudgetAmount !== budgetAmount && (
              <div className="text-xs text-gray-500 mt-1">
                Original: {formatCurrency(originalBudgetAmount)}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Gasto Total</div>
            <div className="font-medium">
              {hasReview && hasRealData ? (
                <>
                  {formatCurrency(spentAmount)}
                  <span className="text-xs ml-1 text-gray-500">
                    ({formatPercentage(spentPercentage)})
                  </span>
                </>
              ) : (
                <span className="text-gray-400">Não disponível</span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Orçamento Restante</div>
            <div className="font-medium">
              {hasReview && hasRealData ? (
                formatCurrency(Math.max(budgetAmount - spentAmount, 0))
              ) : (
                <span className="text-gray-400">Não disponível</span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">
              <span className="flex items-center">
                Dias Restantes
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle size={12} className="ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Dias restantes no mês atual</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
            </div>
            <div className="font-medium flex items-center">
              <Calendar size={14} className="mr-1 text-gray-500" />
              {remainingDays} {remainingDays === 1 ? 'dia' : 'dias'}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Orçamento Diário Atual</div>
            <div className="font-medium">
              {hasReview && hasRealData ? formatCurrency(currentDailyBudget) : (
                <span className="text-gray-400">Não disponível</span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Orçamento Diário Ideal</div>
            <div className="font-medium">
              {hasReview ? formatCurrency(budgetCalc.idealDailyBudget || 0) : "-"}
            </div>
          </div>
          
          {platform === "google" && (
            <div className="bg-gray-50 p-3 rounded col-span-2">
              <div className="text-xs text-gray-500">Média de Gasto (últimos 5 dias)</div>
              <div className="font-medium">
                {hasReview && hasRealData && lastFiveDaysAvg > 0 ? (
                  formatCurrency(lastFiveDaysAvg)
                ) : (
                  <span className="text-gray-400">Não disponível</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-sm font-medium mb-2">Recomendações</h4>
        <BudgetRecommendation 
          budgetDifference={budgetDifference}
          budgetDifferenceBasedOnAverage={budgetDifferenceAverage}
          shouldShow={showRecommendation}
          shouldShowAverage={showRecommendationAverage}
          hasReview={hasReview}
          lastFiveDaysAverage={lastFiveDaysAvg}
          platform={platform}
        />
      </div>
      
      {isUsingCustomBudget && customBudget && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-2 text-[#ff6e00]">Orçamento Personalizado</h4>
            <div className="bg-orange-50 p-3 rounded border border-orange-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-700">Valor</div>
                  <div className="font-medium">{formatCurrency(customBudget.budget_amount)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">Período</div>
                  <div className="font-medium text-sm">
                    {customBudget.start_date && customBudget.end_date ? (
                      `${new Date(customBudget.start_date).toLocaleDateString('pt-BR')} a ${new Date(customBudget.end_date).toLocaleDateString('pt-BR')}`
                    ) : (
                      "Período não definido"
                    )}
                  </div>
                </div>
                {customBudget.description && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-700">Descrição</div>
                    <div className="text-sm">{customBudget.description}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
