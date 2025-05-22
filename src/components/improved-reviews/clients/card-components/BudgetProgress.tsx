
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatters";

interface BudgetProgressProps {
  spentAmount: number;
  budgetAmount: number;
  spentPercentage: number;
  isUsingCustomBudget: boolean;
  originalBudgetAmount: number;
  hasRealData?: boolean;
}

export function BudgetProgress({
  spentAmount,
  budgetAmount,
  spentPercentage,
  isUsingCustomBudget,
  originalBudgetAmount,
  hasRealData = true
}: BudgetProgressProps) {
  // Determinar classe de cor com base no percentual gasto
  let progressColor = "bg-gray-500";
  
  if (!hasRealData) {
    progressColor = "bg-yellow-400"; // Amarelo para indicar dados não disponíveis
  } else if (spentPercentage >= 100) {
    progressColor = "bg-red-500"; // Vermelho para orçamento estourado
  } else if (spentPercentage >= 90) {
    progressColor = "bg-amber-500"; // Amarelo para orçamento quase estourado
  } else if (spentPercentage >= 70) {
    progressColor = "bg-orange-400"; // Laranja para alerta moderado
  } else if (spentPercentage >= 0) {
    progressColor = "bg-green-500"; // Verde para níveis saudáveis
  }
  
  return (
    <div>
      <div className="flex justify-between mb-1 text-sm">
        <div className="font-medium">
          {hasRealData 
            ? formatCurrency(spentAmount)
            : <span className="text-gray-500">Sem dados</span>
          }
        </div>
        <div className="text-gray-500">
          {formatCurrency(budgetAmount)}
          {isUsingCustomBudget && originalBudgetAmount !== budgetAmount && (
            <span className="text-xs ml-1 text-[#ff6e00]">(personalizado)</span>
          )}
        </div>
      </div>
      
      <Progress 
        value={hasRealData ? Math.min(spentPercentage, 100) : 0} 
        className="h-2" 
        indicatorClassName={progressColor} 
      />
      
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <div>{hasRealData ? `${Math.round(spentPercentage)}% gasto` : "Dados indisponíveis"}</div>
        <div>
          {hasRealData ? (
            `Restante: ${formatCurrency(Math.max(budgetAmount - spentAmount, 0))}`
          ) : ""}
        </div>
      </div>
    </div>
  );
}
