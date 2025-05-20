
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/formatters";
import { BadgeDollarSign } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BudgetProgressProps {
  spentAmount: number;
  budgetAmount: number;
  spentPercentage: number;
  isUsingCustomBudget: boolean;
  originalBudgetAmount: number;
}

export function BudgetProgress({
  spentAmount,
  budgetAmount,
  spentPercentage,
  isUsingCustomBudget,
  originalBudgetAmount
}: BudgetProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Gasto</span>
        <span className="font-medium">{formatCurrency(spentAmount)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          <span className="flex items-center gap-1">
            Orçamento
            {isUsingCustomBudget && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BadgeDollarSign className="h-3 w-3 text-[#ff6e00]" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="p-2">
                      <p className="font-medium">Orçamento Personalizado Ativo</p>
                      <p className="text-sm">Orçamento original: {formatCurrency(originalBudgetAmount)}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>
        </span>
        <span className="font-medium">{formatCurrency(budgetAmount)}</span>
      </div>
      <Progress 
        value={spentPercentage} 
        className="h-2"
        indicatorClassName={`${
          spentPercentage > 90 
            ? "bg-red-500" 
            : spentPercentage > 70 
            ? "bg-amber-500" 
            : "bg-emerald-500"
        }`}
      />
      <div className="text-xs text-right text-gray-500">
        {Math.round(spentPercentage)}% utilizado
      </div>
    </div>
  );
}
