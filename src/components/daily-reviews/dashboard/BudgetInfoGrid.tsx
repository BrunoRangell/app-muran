
import { formatCurrency } from "@/utils/formatters";
import { Loader } from "lucide-react";

interface BudgetInfoGridProps {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  idealDailyBudget: number;
  isCalculating: boolean;
  calculationError: string | null;
  hasReview: boolean;
}

export const BudgetInfoGrid = ({
  monthlyBudget,
  totalSpent,
  currentDailyBudget,
  idealDailyBudget,
  isCalculating,
  calculationError,
  hasReview
}: BudgetInfoGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">Orçamento Mensal</div>
        <div className="text-base font-semibold">{formatCurrency(monthlyBudget)}</div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">Custo Total (mês)</div>
        <div className="text-base font-semibold relative">
          {isCalculating ? (
            <span className="text-gray-400">Calculando...</span>
          ) : calculationError ? (
            <span className="text-red-500 text-sm">Erro ao calcular</span>
          ) : (
            formatCurrency(totalSpent)
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">Orçamento Diário Atual</div>
        <div className="text-base font-semibold">
          {hasReview && currentDailyBudget !== null 
            ? formatCurrency(currentDailyBudget) 
            : "Não disponível"}
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">Orçamento Diário Sugerido</div>
        <div className="text-base font-semibold">
          {idealDailyBudget > 0 
            ? formatCurrency(idealDailyBudget) 
            : "Não disponível"}
        </div>
      </div>
    </div>
  );
};
