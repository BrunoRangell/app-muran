
import { formatCurrency } from "@/utils/formatters";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BudgetRecommendationProps {
  needsAdjustment: boolean;
  budgetDifference: number;
  needsAdjustmentBasedOnAverage?: boolean;
  budgetDifferenceBasedOnAverage?: number;
  lastFiveDaysAverage?: number;
}

export function BudgetRecommendation({
  needsAdjustment,
  budgetDifference,
  needsAdjustmentBasedOnAverage,
  budgetDifferenceBasedOnAverage,
  lastFiveDaysAverage
}: BudgetRecommendationProps) {
  // Se não precisa de ajuste, mostrar mensagem padrão
  if (!needsAdjustment && !needsAdjustmentBasedOnAverage) {
    return (
      <div className="text-xs text-gray-600 flex items-center">
        Nenhum ajuste necessário
      </div>
    );
  }
  
  // Verificar se devemos mostrar a recomendação baseada na média
  const showAverageRecommendation = 
    needsAdjustmentBasedOnAverage !== undefined && 
    budgetDifferenceBasedOnAverage !== undefined &&
    lastFiveDaysAverage !== undefined &&
    lastFiveDaysAverage > 0;
  
  console.log("[DEBUG] CompactBudgetRecommendation - platform: meta, shouldShowAverage:", showAverageRecommendation, 
    "budgetDifferenceBasedOnAverage:", budgetDifferenceBasedOnAverage, 
    "lastFiveDaysAverage:", lastFiveDaysAverage, 
    "showAverageRecommendation:", showAverageRecommendation);
  
  return (
    <div className="space-y-1">
      {/* Recomendação baseada no orçamento diário atual */}
      {needsAdjustment && (
        <RecommendationItem 
          action={budgetDifference > 0 ? "aumentar" : "diminuir"}
          difference={Math.abs(budgetDifference)}
          tooltip="Recomendação baseada no orçamento diário atual configurado nas campanhas."
        />
      )}
      
      {/* Recomendação baseada na média dos últimos 5 dias */}
      {showAverageRecommendation && needsAdjustmentBasedOnAverage && (
        <RecommendationItem 
          action={budgetDifferenceBasedOnAverage! > 0 ? "aumentar" : "diminuir"}
          difference={Math.abs(budgetDifferenceBasedOnAverage!)}
          tooltip={`Recomendação baseada na média de gasto dos últimos 5 dias: ${formatCurrency(lastFiveDaysAverage!)}`}
          isSecondary={true}
        />
      )}
    </div>
  );
}

interface RecommendationItemProps {
  action: "aumentar" | "diminuir";
  difference: number;
  tooltip: string;
  isSecondary?: boolean;
}

function RecommendationItem({ action, difference, tooltip, isSecondary = false }: RecommendationItemProps) {
  const isIncrease = action === "aumentar";
  
  return (
    <div className={`flex items-center gap-1 text-xs font-medium
      ${isIncrease ? 'text-green-600' : 'text-red-600'}
      ${isSecondary ? 'opacity-80' : ''}`}
    >
      {isIncrease ? (
        <TrendingUp size={14} />
      ) : (
        <TrendingDown size={14} />
      )}
      
      {action === "aumentar" ? "Aumentar" : "Diminuir"} {formatCurrency(difference)}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Info size={12} className="text-gray-400 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
