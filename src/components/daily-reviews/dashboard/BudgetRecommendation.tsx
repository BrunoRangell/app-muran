
import { formatCurrency } from "@/utils/formatters";
import { TrendingDown, TrendingUp } from "lucide-react";

interface BudgetRecommendationProps {
  budgetDifference: number;
  shouldShow: boolean;
}

export const BudgetRecommendation = ({ 
  budgetDifference,
  shouldShow
}: BudgetRecommendationProps) => {
  if (!shouldShow) return null;
  
  return (
    <div className={`mt-2 p-3 rounded-lg ${budgetDifference > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className={`flex items-center gap-2 font-medium ${budgetDifference > 0 ? 'text-green-700' : 'text-red-700'}`}>
        {budgetDifference > 0 ? (
          <TrendingUp size={18} />
        ) : (
          <TrendingDown size={18} />
        )}
        Recomendação: {budgetDifference > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifference))}
      </div>
    </div>
  );
};
