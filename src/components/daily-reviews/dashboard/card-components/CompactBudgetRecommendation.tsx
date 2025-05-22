
import { TrendingUp, TrendingDown, MinusCircle } from "lucide-react";
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
  showRecommendation: boolean;
  showRecommendationAverage?: boolean;
  needsIncrease?: boolean;
  needsIncreaseAverage?: boolean;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  lastFiveDaysAverage?: number;
  platform?: "meta" | "google";
}

export const CompactBudgetRecommendation = ({
  hasReview = true,
  inactive = false,
  showRecommendation,
  showRecommendationAverage = false,
  needsIncrease = false,
  needsIncreaseAverage = false,
  budgetDifference,
  budgetDifferenceBasedOnAverage = 0,
  lastFiveDaysAverage = 0,
  platform = "meta"
}: CompactBudgetRecommendationProps) => {
  // Não exibe nada se não tiver revisão ou estiver inativo
  if (!hasReview || inactive) {
    if (platform === "google" && inactive) {
      return (
        <div className="p-3 flex items-center gap-2 border-l border-yellow-300 bg-yellow-50">
          <div className="text-yellow-600 text-sm">
            Dados da API indisponíveis - clique em "Buscar dados"
          </div>
        </div>
      );
    }
    return null;
  }

  // Só mostrar recomendação baseada na média dos últimos 5 dias para Google Ads
  const displayAverageRecommendation = platform === "google" && showRecommendationAverage && lastFiveDaysAverage > 0;

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

      {displayAverageRecommendation && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className={`flex items-center ${
                needsIncreaseAverage 
                  ? 'text-blue-600' 
                  : 'text-orange-600'
              }`}>
                <span className="ml-1 font-medium text-xs">
                  ({needsIncreaseAverage ? "+" : "-"}{formatCurrency(Math.abs(budgetDifferenceBasedOnAverage))})
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Recomendação baseada na média dos últimos 5 dias</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {!showRecommendation && !displayAverageRecommendation && (
        <div className="text-gray-600 flex items-center">
          <MinusCircle size={16} />
          <span className="ml-1 font-medium">
            OK
          </span>
        </div>
      )}
    </div>
  );
}
