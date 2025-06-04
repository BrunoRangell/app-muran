
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface CompactBudgetRecommendationProps {
  budgetDifference: number;
  shouldShow: boolean;
}

export function CompactBudgetRecommendation({ 
  budgetDifference, 
  shouldShow 
}: CompactBudgetRecommendationProps) {
  if (!shouldShow || budgetDifference === 0) {
    return null;
  }

  const isIncrease = budgetDifference > 0;
  const Icon = isIncrease ? TrendingUp : TrendingDown;
  const bgColor = isIncrease ? "bg-green-50" : "bg-red-50";
  const textColor = isIncrease ? "text-green-700" : "text-red-700";
  const iconColor = isIncrease ? "text-green-600" : "text-red-600";

  return (
    <div className={`${bgColor} border border-dashed ${isIncrease ? 'border-green-200' : 'border-red-200'} rounded-lg p-3`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <div className="flex-1">
          <div className={`text-xs font-medium ${textColor}`}>
            {isIncrease ? "Aumentar" : "Reduzir"} orçamento
          </div>
          <div className={`text-xs ${textColor}`}>
            {formatCurrency(Math.abs(budgetDifference))}
          </div>
        </div>
      </div>
    </div>
  );
}
