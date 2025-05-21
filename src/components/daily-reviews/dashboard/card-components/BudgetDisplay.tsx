
import { formatCurrency } from "@/utils/formatters";

interface BudgetDisplayProps {
  displayBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage: number;
  hasReview: boolean;
  hasCustomBudget: boolean;
}

export const BudgetDisplay = ({
  displayBudget,
  totalSpent,
  currentDailyBudget,
  lastFiveDaysAverage,
  hasReview,
  hasCustomBudget
}: BudgetDisplayProps) => {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="bg-gray-50 p-2 rounded">
        <div className="text-xs text-gray-500">Orçamento</div>
        <div className="font-medium flex items-center">
          {formatCurrency(displayBudget)}
          {hasCustomBudget && (
            <span className="text-xs text-[#ff6e00] ml-1">*</span>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 p-2 rounded">
        <div className="text-xs text-gray-500">Gasto</div>
        <div className="font-medium">{formatCurrency(totalSpent)}</div>
      </div>
      
      <div className="bg-gray-50 p-2 rounded">
        <div className="text-xs text-gray-500">Orç. diário atual</div>
        <div className="font-medium">
          {hasReview && currentDailyBudget ? formatCurrency(currentDailyBudget) : "-"}
        </div>
      </div>
      
      <div className="bg-gray-50 p-2 rounded">
        <div className="text-xs text-gray-500">Média últimos 5 dias</div>
        <div className="font-medium">
          {hasReview && lastFiveDaysAverage > 0 ? formatCurrency(lastFiveDaysAverage) : "-"}
        </div>
      </div>
    </div>
  );
};
