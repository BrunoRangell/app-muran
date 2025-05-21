
import { TrendingUp, TrendingDown, Clock, MinusCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface CompactBudgetRecommendationProps {
  hasReview?: boolean;
  inactive?: boolean;
  showRecommendation: boolean; // Renomeado de shouldShow
  showRecommendationAverage: boolean; // Renomeado de shouldShowAverage
  needsIncrease?: boolean;
  needsIncreaseAverage?: boolean;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage: number;
  lastFiveDaysAverage: number;
}

export const CompactBudgetRecommendation = ({
  hasReview = true,
  inactive = false,
  showRecommendation,
  showRecommendationAverage,
  needsIncrease = false,
  needsIncreaseAverage = false,
  budgetDifference,
  budgetDifferenceBasedOnAverage,
  lastFiveDaysAverage
}: CompactBudgetRecommendationProps) => {
  // Não exibe nada se não tiver revisão ou estiver inativo
  if (!hasReview || inactive) {
    return null;
  }

  return (
    <div className="p-3 flex items-center gap-2 border-l">
      {showRecommendation && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className={`flex items-center ${
                needsIncrease 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {needsIncrease 
                  ? <TrendingUp size={16} /> 
                  : <TrendingDown size={16} />
                }
                <span className="ml-1 font-medium">
                  {formatCurrency(Math.abs(budgetDifference))}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Recomendação baseada no orçamento diário atual</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {showRecommendationAverage && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className={`flex items-center ${
                needsIncreaseAverage 
                  ? 'text-blue-600' 
                  : 'text-orange-600'
              }`}>
                <Clock size={16} />
                <span className="ml-1 font-medium">
                  {formatCurrency(Math.abs(budgetDifferenceBasedOnAverage))}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Recomendação baseada na média dos últimos 5 dias: {formatCurrency(lastFiveDaysAverage)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {!showRecommendation && !showRecommendationAverage && (
        <div className="text-gray-600 flex items-center">
          <MinusCircle size={16} />
          <span className="ml-1 font-medium">
            OK
          </span>
        </div>
      )}
    </div>
  );
};
