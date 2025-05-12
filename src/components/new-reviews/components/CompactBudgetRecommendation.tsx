
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CompactBudgetRecommendationProps {
  budgetDifference: number;
  budgetDifferenceBasedOnAverage: number;
  shouldShow: boolean;
  shouldShowAverage: boolean;
  lastFiveDaysAverage: number;
  usingCustomBudget?: boolean;
}

export function CompactBudgetRecommendation({
  budgetDifference,
  budgetDifferenceBasedOnAverage,
  shouldShow,
  shouldShowAverage,
  lastFiveDaysAverage,
  usingCustomBudget = false,
}: CompactBudgetRecommendationProps) {
  if (!shouldShow) return null;

  const isPositive = budgetDifference >= 0;
  const isAveragePositive = budgetDifferenceBasedOnAverage >= 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center text-xs gap-1">
        <span className="font-medium">Recomendação:</span>
        <div className="flex items-center">
          <span
            className={cn(
              "flex items-center font-medium",
              isPositive ? "text-green-600" : "text-red-500"
            )}
          >
            {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(budgetDifference).toFixed(2)}
          </span>
        </div>
        {usingCustomBudget && (
          <span className="bg-[#ff6e00] text-white text-[10px] px-1.5 py-0.5 rounded-sm ml-1">
            Personalizado
          </span>
        )}
      </div>

      {shouldShowAverage && (
        <div className="flex items-center text-xs gap-1">
          <span className="font-medium">Média 5 dias:</span>
          <span>{lastFiveDaysAverage.toFixed(2)}</span>
          <div className="flex items-center">
            <span
              className={cn(
                "flex items-center font-medium",
                isAveragePositive ? "text-green-600" : "text-red-500"
              )}
            >
              {isAveragePositive ? (
                <ArrowUp size={14} />
              ) : (
                <ArrowDown size={14} />
              )}
              {Math.abs(budgetDifferenceBasedOnAverage).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
