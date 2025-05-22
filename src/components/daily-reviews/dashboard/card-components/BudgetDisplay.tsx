
import { formatCurrency } from "@/utils/formatters";

interface BudgetDisplayProps {
  displayBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage?: number;
  hasReview: boolean;
  hasCustomBudget: boolean;
  platform?: "meta" | "google";
}

export const BudgetDisplay = ({
  displayBudget,
  totalSpent,
  currentDailyBudget,
  lastFiveDaysAverage,
  hasReview,
  hasCustomBudget,
  platform = "meta"
}: BudgetDisplayProps) => {
  const showLastFiveDaysAverage = platform === "google" && lastFiveDaysAverage !== undefined && lastFiveDaysAverage > 0;

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
      
      {showLastFiveDaysAverage ? (
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-xs text-gray-500">Média últimos 5 dias</div>
          <div className="font-medium">
            {formatCurrency(lastFiveDaysAverage || 0)}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-xs text-gray-500">Status</div>
          <div className="font-medium">
            {hasReview ? "Dados atualizados" : "Pendente"}
          </div>
        </div>
      )}
    </div>
  );
};
