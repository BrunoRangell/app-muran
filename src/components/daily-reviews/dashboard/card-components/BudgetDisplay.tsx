
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface BudgetDisplayProps {
  idealDailyBudget: number;
  showRecommendation: boolean;
  needsIncrease: boolean;
  budgetDifference: number;
}

export const BudgetDisplay = ({ 
  idealDailyBudget, 
  showRecommendation, 
  needsIncrease, 
  budgetDifference 
}: BudgetDisplayProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="font-medium">
        {idealDailyBudget > 0 
          ? formatCurrency(idealDailyBudget) 
          : "Não disponível"}
      </div>
      
      {showRecommendation && (
        <Badge className={`flex items-center ${needsIncrease ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {needsIncrease ? (
            <TrendingUp size={14} className="mr-1" />
          ) : (
            <TrendingDown size={14} className="mr-1" />
          )}
          {needsIncrease ? "Aumentar" : "Diminuir"} {formatCurrency(Math.abs(budgetDifference))}
        </Badge>
      )}
    </div>
  );
};
