
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
    // Diferença positiva (aumentar): verde
    // Diferença negativa (diminuir): vermelho
    return (
      <div className={`mt-2 p-3 rounded-lg ${
        budgetDifference > 0 
          ? 'bg-green-50' 
          : 'bg-red-50'
      }`}>
        <div className={`flex items-center gap-2 font-medium ${
          budgetDifference > 0 
            ? 'text-green-700' 
            : 'text-red-700'
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
    // Nenhum ajuste necessário: cinza
    return (
      <div className="mt-2 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <MinusCircle size={18} />
          Recomendação: Nenhum ajuste necessário
        </div>
      </div>
    );
  }
};
