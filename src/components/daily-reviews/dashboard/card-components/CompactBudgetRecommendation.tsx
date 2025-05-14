
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Info, CloudOff } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CompactBudgetRecommendationProps {
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  shouldShow: boolean;
  shouldShowAverage?: boolean;
  lastFiveDaysAverage?: number;
  platform?: 'google' | 'meta';
  usingRealData?: boolean;
}

export const CompactBudgetRecommendation = ({ 
  budgetDifference,
  budgetDifferenceBasedOnAverage = 0,
  shouldShow,
  shouldShowAverage = false,
  lastFiveDaysAverage = 0,
  platform = 'meta',
  usingRealData = true
}: CompactBudgetRecommendationProps) => {
  const hasAnyRecommendation = shouldShow || shouldShowAverage;
  
  // Determinar se deve mostrar recomendação baseada na média dos últimos 5 dias
  // Apenas para Google Ads e se houver valor
  const showAverageRecommendation = shouldShowAverage && 
                                   budgetDifferenceBasedOnAverage !== undefined && 
                                   lastFiveDaysAverage > 0 &&
                                   platform === 'google';
                                   
  console.log(`[DEBUG] CompactBudgetRecommendation - platform: ${platform}, shouldShowAverage: ${shouldShowAverage}, budgetDifferenceBasedOnAverage: ${budgetDifferenceBasedOnAverage}, lastFiveDaysAverage: ${lastFiveDaysAverage}, showAverageRecommendation: ${showAverageRecommendation}`);
  
  if (!hasAnyRecommendation) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {!usingRealData && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="flex items-center bg-amber-100 text-amber-800">
                <CloudOff size={10} className="mr-1" />
                <span className="text-xs">Dados simulados</span>
                <Info size={10} className="ml-1 text-amber-600" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Não foi possível obter dados reais da API. Estes valores são estimados ou recuperados de dados históricos.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    
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
      
      {showAverageRecommendation && (
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
