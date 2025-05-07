
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BudgetDisplayProps {
  idealDailyBudget: number;
  showRecommendation: boolean;
  showRecommendationAverage?: boolean;
  needsIncrease: boolean;
  needsIncreaseAverage?: boolean;
  budgetDifference: number;
  budgetDifferenceAverage?: number;
  accountName?: string;
  lastFiveDaysAverage?: number;
}

export const BudgetDisplay = ({ 
  idealDailyBudget, 
  showRecommendation, 
  showRecommendationAverage = false,
  needsIncrease, 
  needsIncreaseAverage = false,
  budgetDifference,
  budgetDifferenceAverage = 0,
  accountName,
  lastFiveDaysAverage = 0
}: BudgetDisplayProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="font-medium">
          {idealDailyBudget > 0 
            ? formatCurrency(idealDailyBudget) 
            : "Não disponível"}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {showRecommendation && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className={`flex items-center ${needsIncrease ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {accountName && (
                    <span className="mr-1 font-medium">{accountName}:</span>
                  )}
                  {needsIncrease ? (
                    <TrendingUp size={14} className="mr-1" />
                  ) : (
                    <TrendingDown size={14} className="mr-1" />
                  )}
                  {needsIncrease ? "+" : "-"}{formatCurrency(Math.abs(budgetDifference))}
                  <Info size={10} className="ml-1 text-gray-500" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recomendação baseada no orçamento diário atual configurado nas campanhas.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {showRecommendationAverage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className={`flex items-center ${needsIncreaseAverage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <span className="mr-1 text-xs">5d:</span>
                  {needsIncreaseAverage ? (
                    <TrendingUp size={14} className="mr-1" />
                  ) : (
                    <TrendingDown size={14} className="mr-1" />
                  )}
                  {needsIncreaseAverage ? "+" : "-"}{formatCurrency(Math.abs(budgetDifferenceAverage))}
                  <Info size={10} className="ml-1 text-gray-500" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recomendação baseada na média de gasto dos últimos 5 dias ({formatCurrency(lastFiveDaysAverage)}).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
