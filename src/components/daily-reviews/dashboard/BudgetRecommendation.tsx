
import { formatCurrency } from "@/utils/formatters";
import { MinusCircle, TrendingDown, TrendingUp, Info, AlertTriangle } from "lucide-react";
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
}

export const BudgetRecommendation = ({ 
  budgetDifference,
  budgetDifferenceBasedOnAverage = 0,
  shouldShow,
  shouldShowAverage = false,
  hasReview,
  lastFiveDaysAverage = 0,
  compact = false,
  platform = "meta"
}: BudgetRecommendationProps) => {
  if (!hasReview) return null;

  // Se modo compacto estiver ativado, renderizar a versão compacta
  if (compact) {
    return (
      <CompactBudgetRecommendation
        budgetDifference={budgetDifference}
        budgetDifferenceBasedOnAverage={budgetDifferenceBasedOnAverage}
        showRecommendation={shouldShow}
        showRecommendationAverage={shouldShowAverage && platform === "google"}
        needsIncrease={budgetDifference > 0}
        needsIncreaseAverage={budgetDifferenceBasedOnAverage > 0}
        lastFiveDaysAverage={lastFiveDaysAverage}
        platform={platform}
      />
    );
  }

  // Verificar se há alguma recomendação para exibir
  const hasAnyRecommendation = shouldShow || (shouldShowAverage && platform === "google");
  
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

  // Verificar se não temos dados reais disponíveis para recomendar (apenas para Google)
  const noRealData = platform === "google" && lastFiveDaysAverage === 0 && !shouldShow;
  
  if (noRealData) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-yellow-50 border-l-4 border-l-yellow-500">
        <div className="flex items-center gap-2 font-medium text-yellow-700">
          <AlertTriangle size={18} className="text-yellow-500" />
          Dados insuficientes para gerar recomendações
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

      {shouldShowAverage && platform === "google" && lastFiveDaysAverage > 0 && (
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
            {budgetDifferenceBasedOnAverage > 0 ? (
              <TrendingUp size={18} className="text-blue-500" />
            ) : (
              <TrendingDown size={18} className="text-orange-500" />
            )}
            <span>
              Baseado na média 5 dias: {budgetDifferenceBasedOnAverage > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifferenceBasedOnAverage))}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={14} className="text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="p-3 max-w-xs">
                  <p>Recomendação baseada na diferença entre o orçamento diário ideal e a média de gastos dos últimos 5 dias.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
}
