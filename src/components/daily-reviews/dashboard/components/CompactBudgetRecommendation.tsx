
import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";

export interface CompactBudgetRecommendationProps {
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  shouldShow: boolean;
  shouldShowAverage: boolean;
  lastFiveDaysAverage?: number;
  usingCustomBudget?: boolean;
}

export const CompactBudgetRecommendation = ({
  budgetDifference,
  budgetDifferenceBasedOnAverage,
  shouldShow,
  shouldShowAverage,
  lastFiveDaysAverage,
  usingCustomBudget = false
}: CompactBudgetRecommendationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Pequena animação para carregamento do componente
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldShow) return null;

  return (
    <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex items-center gap-1.5 text-xs">
        {budgetDifference >= 0 ? (
          <CheckCircle size={14} className="text-green-500" />
        ) : (
          <AlertTriangle size={14} className="text-amber-500" />
        )}
        <span className={budgetDifference >= 0 ? "text-green-600" : "text-amber-600"}>
          {budgetDifference >= 0
            ? `Orçamento ideal (${Math.abs(budgetDifference).toFixed(2)}% abaixo do ideal)`
            : `Atenção (${Math.abs(budgetDifference).toFixed(2)}% acima do ideal)`}
        </span>

        {usingCustomBudget && (
          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
            Orçamento personalizado
          </span>
        )}
      </div>

      {shouldShowAverage && budgetDifferenceBasedOnAverage !== undefined && lastFiveDaysAverage !== undefined && (
        <div className="flex items-center gap-1.5 text-xs mt-1">
          <TrendingUp size={14} className="text-blue-500" />
          <span className="text-blue-600">
            Média dos últimos 5 dias: R$ {lastFiveDaysAverage.toFixed(2)}/dia
          </span>
        </div>
      )}
    </div>
  );
};
