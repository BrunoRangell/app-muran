
import { formatCurrency } from "@/utils/formatters";
import { MinusCircle, TrendingDown, TrendingUp, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BudgetRecommendationProps {
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  shouldShow: boolean;
  shouldShowAverage?: boolean;
  hasReview: boolean;
  lastFiveDaysAverage?: number;
}

export const BudgetRecommendation = ({ 
  budgetDifference,
  budgetDifferenceBasedOnAverage = 0,
  shouldShow,
  shouldShowAverage = false,
  hasReview,
  lastFiveDaysAverage = 0
}: BudgetRecommendationProps) => {
  if (!hasReview) return null;

  const hasAnyRecommendation = shouldShow || shouldShowAverage;
  
  if (!hasAnyRecommendation) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-gray-50 border-l-4 border-l-gray-500">
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <MinusCircle size={18} className="text-gray-500" />
          Recomendação: Nenhum ajuste necessário
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-2 space-y-2">
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
              Recomendação (orçamento atual): {budgetDifference > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifference))}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-gray-500 cursor-help">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent className="p-3 max-w-xs">
                  <p>Recomendação baseada na diferença entre o orçamento diário ideal e o orçamento diário atual configurado nas campanhas.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {shouldShowAverage && (
        <div className={`p-3 rounded-lg ${
          budgetDifferenceBasedOnAverage > 0 
            ? 'bg-blue-50 border-l-4 border-l-blue-500' 
            : 'bg-orange-50 border-l-4 border-l-orange-500'
        }`}>
          <div className={`flex items-center gap-2 font-medium ${
            budgetDifferenceBasedOnAverage > 0 
              ? 'text-blue-700' 
              : 'text-orange-700'
          }`}>
            <Clock size={18} className={budgetDifferenceBasedOnAverage > 0 ? "text-blue-500" : "text-orange-500"} />
            <span>
              Recomendação (média 5 dias: {formatCurrency(lastFiveDaysAverage)}): {budgetDifferenceBasedOnAverage > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifferenceBasedOnAverage))}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-gray-500 cursor-help">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent className="p-3 max-w-xs">
                  <p>Recomendação baseada na diferença entre o orçamento diário ideal e a média de gasto real dos últimos 5 dias.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
};
