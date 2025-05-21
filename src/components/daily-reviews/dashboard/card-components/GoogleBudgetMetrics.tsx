
import { formatCurrency } from "@/utils/formatters";

interface GoogleBudgetMetricsProps {
  formattedMonthlyBudget: string;
  formattedTotalSpent: string;
  formattedLastFiveDaysSpent: string;
  formattedCurrentDaily: string;
  formattedIdealDaily: string;
  compact: boolean;
}

export const GoogleBudgetMetrics = ({ 
  formattedMonthlyBudget, 
  formattedTotalSpent, 
  formattedLastFiveDaysSpent, 
  formattedCurrentDaily,
  formattedIdealDaily,
  compact 
}: GoogleBudgetMetricsProps) => {
  if (compact) {
    return (
      <div className="flex justify-between items-center mt-2 text-xs gap-2">
        <div>
          <span className="text-gray-500 mr-1">Orçamento:</span>
          <span className="font-semibold">{formattedMonthlyBudget}</span>
        </div>
        <div>
          <span className="text-gray-500 mr-1">Gasto:</span>
          <span className="font-semibold">{formattedTotalSpent}</span>
        </div>
        <div className="flex-1 p-3 border-l">
          <div className="text-xs text-gray-500">Média 5 dias</div>
          <div className="flex items-center">
            {formattedLastFiveDaysSpent}
          </div>
        </div>
        <div>
          <span className="text-gray-500 mr-1">Atual:</span>
          <span className="font-semibold">{formattedCurrentDaily}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="bg-gray-50 p-2 rounded">
        <div className="text-gray-500">Orçamento</div>
        <div className="font-semibold">{formattedMonthlyBudget}</div>
      </div>
      <div className="bg-gray-50 p-2 rounded">
        <div className="text-gray-500">Gasto Total</div>
        <div className="font-semibold">{formattedTotalSpent}</div>
      </div>
      <div className="bg-gray-50 p-2 rounded">
        <div className="text-gray-500">Média 5 dias</div>
        <div className="font-semibold">{formattedLastFiveDaysSpent}</div>
      </div>
      <div className="bg-gray-50 p-2 rounded">
        <div className="text-gray-500">Orç. Diário Atual</div>
        <div className="font-semibold">{formattedCurrentDaily}</div>
      </div>
      <div className="bg-gray-50 p-2 rounded">
        <div className="text-gray-500">Orç. Diário Ideal</div>
        <div className="font-semibold">{formattedIdealDaily}</div>
      </div>
    </div>
  );
};
