
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export interface CompactBudgetRecommendationProps {
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  shouldShow: boolean;
  shouldShowAverage?: boolean;
  lastFiveDaysAverage?: number;
  platform?: 'google' | 'meta';
  usingRealData?: boolean;
  usingCustomBudget?: boolean;
}

export const CompactBudgetRecommendation = ({ 
  budgetDifference, 
  budgetDifferenceBasedOnAverage = 0, 
  shouldShow = false, 
  shouldShowAverage = false,
  lastFiveDaysAverage = 0,
  platform = 'meta',
  usingRealData = true,
  usingCustomBudget = false
}: CompactBudgetRecommendationProps) => {
  const hasAnyRecommendation = shouldShow || shouldShowAverage;
  
  if (!hasAnyRecommendation) {
    return null;
  }
  
  const isIncrease = budgetDifference > 0;
  const isIncreaseAverage = budgetDifferenceBasedOnAverage > 0;
  
  const getChangeBadgeClasses = (isIncrease: boolean) => {
    const baseClasses = "flex items-center gap-1 text-xs px-2 py-0.5 rounded-md";
    return isIncrease
      ? `${baseClasses} bg-green-50 text-green-700`
      : `${baseClasses} bg-red-50 text-red-700`;
  };
  
  return (
    <div className="space-y-1.5">
      {shouldShow && (
        <div className="flex items-center gap-1">
          <div className={getChangeBadgeClasses(isIncrease)}>
            {isIncrease ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>
              {isIncrease ? "Aumentar" : "Reduzir"} {formatCurrency(Math.abs(budgetDifference))}
            </span>
          </div>
        </div>
      )}
      
      {shouldShowAverage && (
        <div className="flex items-center gap-1">
          <div className={getChangeBadgeClasses(isIncreaseAverage)}>
            {isIncreaseAverage ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>
              {platform === 'google' ? "Média 5 dias:" : "Tendência:"} {formatCurrency(Math.abs(lastFiveDaysAverage))}
            </span>
          </div>
        </div>
      )}
      
      {usingCustomBudget && (
        <div className="text-xs text-indigo-600 font-medium mt-0.5">
          Orçamento personalizado
        </div>
      )}
      
      {platform === 'google' && !usingRealData && (
        <div className="text-xs text-amber-600 font-medium mt-0.5">
          Dados simulados
        </div>
      )}
    </div>
  );
};
