
import { formatCurrency } from "@/utils/formatters";

interface GoogleBudgetRecommendationProps {
  budgetDifference: number;
  needsBudgetAdjustment: boolean;
}

export const GoogleBudgetRecommendation = ({ 
  budgetDifference,
  needsBudgetAdjustment
}: GoogleBudgetRecommendationProps) => {
  if (!needsBudgetAdjustment || !budgetDifference) {
    return null;
  }

  return (
    <div className="mt-2 text-xs p-2 rounded flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-muran-primary"></div>
      <span className="font-medium">
        {budgetDifference > 0 ? 
          `Aumentar orçamento diário em ${formatCurrency(Math.abs(budgetDifference))}` : 
          `Diminuir orçamento diário em ${formatCurrency(Math.abs(budgetDifference))}`}
      </span>
    </div>
  );
};
