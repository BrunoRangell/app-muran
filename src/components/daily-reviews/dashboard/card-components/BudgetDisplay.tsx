
import { ArrowUp, ArrowDown } from "lucide-react";
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
    <div>
      <div className="font-medium">
        {formatCurrency(idealDailyBudget)}
      </div>
      
      {showRecommendation && (
        <div className={`text-xs mt-1 flex items-center ${
          needsIncrease ? 'text-amber-600' : 'text-blue-600'
        }`}>
          {needsIncrease ? (
            <>
              <ArrowUp size={12} className="mr-1" />
              Aumentar ({formatCurrency(budgetDifference)})
              {accountName && <span className="text-gray-500 ml-1">- {accountName}</span>}
            </>
          ) : (
            <>
              <ArrowDown size={12} className="mr-1" />
              Diminuir ({formatCurrency(Math.abs(budgetDifference))})
              {accountName && <span className="text-gray-500 ml-1">- {accountName}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
};
