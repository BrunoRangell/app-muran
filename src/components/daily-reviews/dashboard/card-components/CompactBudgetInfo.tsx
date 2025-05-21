
import { formatCurrency } from "@/utils/formatters";

interface CompactBudgetInfoProps {
  displayBudget: number;
  currentDailyBudget: number;
  idealDailyBudget: number;
  hasReview: boolean;
  hasCustomBudget: boolean;
}

export const CompactBudgetInfo = ({
  displayBudget,
  currentDailyBudget,
  idealDailyBudget,
  hasReview,
  hasCustomBudget
}: CompactBudgetInfoProps) => {
  return (
    <>
      <div className="flex-1 p-3 border-l">
        <div className="text-xs text-gray-500">Orçamento</div>
        <div className="flex items-center">
          {formatCurrency(displayBudget)}
          {hasCustomBudget && (
            <span className="text-xs text-[#ff6e00] ml-1">*</span>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-3 border-l">
        <div className="text-xs text-gray-500">Orç. diário atual / ideal</div>
        <div className="flex items-center gap-1">
          <span>{hasReview && currentDailyBudget ? formatCurrency(currentDailyBudget) : "-"}</span>
          <span>/</span>
          <span>{formatCurrency(idealDailyBudget)}</span>
        </div>
      </div>
    </>
  );
};
