
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompactBudgetRecommendationProps {
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  shouldShow: boolean;
  shouldShowAverage?: boolean;
  lastFiveDaysAverage?: number;
}

export const CompactBudgetRecommendation = ({ 
  budgetDifference,
  budgetDifferenceBasedOnAverage = 0,
  shouldShow,
  shouldShowAverage = false,
  lastFiveDaysAverage = 0
}: CompactBudgetRecommendationProps) => {
  const hasAnyRecommendation = shouldShow || shouldShowAverage;
  
  if (!hasAnyRecommendation) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {shouldShow && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className={`flex items-center ${
                budgetDifference > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <span className="mr-1 text-xs">Orç:</span>
                {budgetDifference > 0 ? (
                  <TrendingUp size={14} className="mr-1" />
                ) : (
                  <TrendingDown size={14} className="mr-1" />
                )}
                {budgetDifference > 0 ? "+" : ""}{formatCurrency(budgetDifference)}
                <Info size={10} className="ml-1 text-gray-500" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Recomendação baseada na diferença entre o orçamento diário ideal e o orçamento diário atual configurado nas campanhas.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {shouldShowAverage && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className={`flex items-center ${
                budgetDifferenceBasedOnAverage > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <span className="mr-1 text-xs">5d:</span>
                {budgetDifferenceBasedOnAverage > 0 ? (
                  <TrendingUp size={14} className="mr-1" />
                ) : (
                  <TrendingDown size={14} className="mr-1" />
                )}
                {budgetDifferenceBasedOnAverage > 0 ? "+" : ""}{formatCurrency(budgetDifferenceBasedOnAverage)}
                <Info size={10} className="ml-1 text-gray-500" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Recomendação baseada na diferença entre o orçamento diário ideal e a média de gasto real dos últimos 5 dias ({formatCurrency(lastFiveDaysAverage)}).</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
