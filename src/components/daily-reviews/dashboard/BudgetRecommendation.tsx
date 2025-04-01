
import { formatCurrency } from "@/utils/formatters";
import { MinusCircle, TrendingDown, TrendingUp } from "lucide-react";

interface BudgetRecommendationProps {
  budgetDifference: number;
  shouldShow: boolean;
  hasReview: boolean;
}

export const BudgetRecommendation = ({ 
  budgetDifference,
  shouldShow,
  hasReview
}: BudgetRecommendationProps) => {
  if (!hasReview) return null;
  
  if (shouldShow) {
    return (
      <div className={`mt-2 p-3 rounded-lg ${
        budgetDifference > 0 
          ? 'bg-[#F2FCE2]' 
          : 'bg-[#FEC6A1]'
      }`}>
        <div className={`flex items-center gap-2 font-medium ${
          budgetDifference > 0 
            ? 'text-green-700' 
            : 'text-[#ea384c]'
        }`}>
          {budgetDifference > 0 ? (
            <TrendingUp size={18} />
          ) : (
            <TrendingDown size={18} />
          )}
          Recomendação: {budgetDifference > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifference))}
        </div>
      </div>
    );
  } else {
    return (
      <div className="mt-2 p-3 rounded-lg bg-[#F1F0FB]">
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <MinusCircle size={18} />
          Recomendação: Nenhum ajuste necessário
        </div>
      </div>
    );
  }
};
