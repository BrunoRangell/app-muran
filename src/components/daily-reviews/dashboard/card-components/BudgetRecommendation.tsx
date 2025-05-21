
import { TrendingUp, TrendingDown, Clock, MinusCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface BudgetRecommendationProps {
  showRecommendation: boolean;
  showRecommendationAverage: boolean;
  needsIncrease: boolean;
  needsIncreaseAverage: boolean;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage: number;
  lastFiveDaysAverage: number;
}

export const BudgetRecommendation = ({
  showRecommendation,
  showRecommendationAverage,
  needsIncrease,
  needsIncreaseAverage,
  budgetDifference,
  budgetDifferenceBasedOnAverage,
  lastFiveDaysAverage
}: BudgetRecommendationProps) => {
  if (!showRecommendation && !showRecommendationAverage) {
    return (
      <div className="p-2 rounded flex items-center bg-gray-50 text-gray-600">
        <MinusCircle size={16} className="mr-1" />
        <span className="text-sm font-medium">
          Nenhum ajuste necessário
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showRecommendation && (
        <div className={`p-2 rounded flex items-center ${
          needsIncrease 
            ? 'bg-green-50 text-green-600' 
            : 'bg-red-50 text-red-600'
        }`}>
          {needsIncrease 
            ? <TrendingUp size={16} className="mr-1" /> 
            : <TrendingDown size={16} className="mr-1" />
          }
          <span className="text-sm font-medium">
            {needsIncrease ? "Aumentar" : "Diminuir"} {formatCurrency(Math.abs(budgetDifference))}
            <span className="text-xs ml-1 opacity-75">(orç. atual)</span>
          </span>
        </div>
      )}
      
      {showRecommendationAverage && (
        <div className={`p-2 rounded flex items-center ${
          needsIncreaseAverage 
            ? 'bg-blue-50 text-blue-600' 
            : 'bg-orange-50 text-orange-600'
        }`}>
          <Clock size={16} className="mr-1" />
          <span className="text-sm font-medium">
            {needsIncreaseAverage ? "Aumentar" : "Diminuir"} {formatCurrency(Math.abs(budgetDifferenceBasedOnAverage))}
            <span className="text-xs ml-1 opacity-75">(média 5 dias)</span>
          </span>
        </div>
      )}
    </div>
  );
};
