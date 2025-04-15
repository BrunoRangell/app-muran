
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface BudgetDisplayProps {
  idealDailyBudget: number;
  showRecommendation: boolean;
  needsIncrease: boolean;
  budgetDifference: number;
  accountName?: string;
}

export const BudgetDisplay = ({ 
  idealDailyBudget, 
  showRecommendation, 
  needsIncrease, 
  budgetDifference,
  accountName
}: BudgetDisplayProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium">
        {idealDailyBudget > 0 
          ? formatCurrency(idealDailyBudget) 
          : "Não disponível"}
      </div>
      
      {showRecommendation && (
        <Badge 
          className={`flex items-center w-fit ${
            needsIncrease ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {accountName && (
            <span className="mr-1 font-medium">CA {accountName}:</span>
          )}
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
