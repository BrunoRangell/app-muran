
import { formatCurrency } from "@/utils/formatters";
import { MinusCircle, TrendingDown, TrendingUp, Info, Stars } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompactBudgetRecommendation } from "./card-components/CompactBudgetRecommendation";

interface BudgetRecommendationProps {
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  shouldShow: boolean;
  shouldShowAverage?: boolean;
  hasReview: boolean;
  lastFiveDaysAverage?: number;
  compact?: boolean;
  platform?: "meta" | "google";
  usingCustomBudget?: boolean;
  customBudgetAmount?: number;
  usingRealData?: boolean;
}

export const BudgetRecommendation = ({ 
  budgetDifference,
  budgetDifferenceBasedOnAverage = 0,
  shouldShow,
  shouldShowAverage = false,
  hasReview,
  lastFiveDaysAverage = 0,
  compact = false,
  platform = "meta",
  usingCustomBudget = false,
  customBudgetAmount,
  usingRealData = true
}: BudgetRecommendationProps) => {
  if (!hasReview) return null;

  // Se modo compacto estiver ativado, renderizar a versão compacta
  if (compact) {
    return (
      <CompactBudgetRecommendation
        budgetDifference={budgetDifference}
        budgetDifferenceBasedOnAverage={platform === "google" ? budgetDifferenceBasedOnAverage : undefined}
        shouldShow={shouldShow}
        shouldShowAverage={platform === "google" ? shouldShowAverage : false}
        lastFiveDaysAverage={platform === "google" ? lastFiveDaysAverage : undefined}
        platform={platform}
        usingRealData={usingRealData}
        usingCustomBudget={usingCustomBudget}
        customBudgetAmount={customBudgetAmount}
      />
    );
  }

  const shouldShowAverageForPlatform = shouldShowAverage && platform === "google";
  const hasAnyRecommendation = shouldShow || shouldShowAverageForPlatform;
  
  return (
    <div className="mt-2 space-y-2">
      {usingCustomBudget && (
        <div className="p-3 rounded-lg bg-purple-50 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 font-medium text-purple-700">
            <Stars size={18} className="text-purple-500" />
            <span>
              Usando orçamento personalizado: {formatCurrency(customBudgetAmount || 0)}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={14} className="text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="p-3 max-w-xs">
                  <p>Este cliente está usando um orçamento personalizado que substitui o orçamento padrão.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
      
      {!hasAnyRecommendation && (
        <div className="mt-2 p-3 rounded-lg bg-gray-50 border-l-4 border-l-gray-500">
          <div className="flex items-center gap-2 font-medium text-gray-700">
            <MinusCircle size={18} className="text-gray-500" />
            Recomendação: Nenhum ajuste necessário
          </div>
        </div>
      )}
      
      {shouldShow && (
        <div className={`p-3 rounded-lg ${
          budgetDifference > 0 
            ? 'bg-green-50 border-l-4 border-l-green-500' 
            : 'bg-red-50 border-l-4 border-l-red-500'
        }`}>
          <div className={`flex items-center gap-2 font-medium ${
            budgetDifference > 0 
              ? 'text-green-700' 
              : 'text-red-700'
          }`}>
            {budgetDifference > 0 ? (
              <TrendingUp size={18} className="text-green-500" />
            ) : (
              <TrendingDown size={18} className="text-red-500" />
            )}
            <span>
              Recomendado (orç. diário): {budgetDifference > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifference))}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={14} className="text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="p-3 max-w-xs">
                  <p>Recomendação baseada na diferença entre o orçamento diário ideal e o orçamento diário atual configurado nas campanhas.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {shouldShowAverageForPlatform && (
        <div className={`p-3 rounded-lg ${
          budgetDifferenceBasedOnAverage > 0 
            ? 'bg-green-50 border-l-4 border-l-green-500' 
            : 'bg-red-50 border-l-4 border-l-red-500'
        }`}>
          <div className={`flex items-center gap-2 font-medium ${
            budgetDifferenceBasedOnAverage > 0 
              ? 'text-green-700' 
              : 'text-red-700'
          }`}>
            {budgetDifferenceBasedOnAverage > 0 ? (
              <TrendingUp size={18} className="text-green-500" />
            ) : (
              <TrendingDown size={18} className="text-red-500" />
            )}
            <span>
              Recomendado (últ. 5 dias): {budgetDifferenceBasedOnAverage > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifferenceBasedOnAverage))}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={14} className="text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="p-3 max-w-xs">
                  <p>Recomendação baseada na diferença entre o orçamento diário ideal e a média de gasto real dos últimos 5 dias ({formatCurrency(lastFiveDaysAverage)}).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
};
