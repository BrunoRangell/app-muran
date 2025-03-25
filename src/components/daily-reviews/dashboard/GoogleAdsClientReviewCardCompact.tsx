
import { Card } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useGoogleAdsBudgetCalculation } from "../hooks/useGoogleAdsBudgetCalculation";
import { formatCurrency } from "@/lib/utils";

interface GoogleAdsClientReviewCardCompactProps {
  client: ClientWithReview;
  onReviewClient: (clientId: string) => void;
  isProcessing: boolean;
  compact?: boolean;
  inactive?: boolean;
}

export const GoogleAdsClientReviewCardCompact = ({
  client,
  onReviewClient,
  isProcessing,
  compact = false,
  inactive = false
}: GoogleAdsClientReviewCardCompactProps) => {
  const {
    hasReview,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    isCalculating,
    remainingDaysValue,
    needsBudgetAdjustment
  } = useGoogleAdsBudgetCalculation(client);

  const handleReviewClick = () => {
    if (!isProcessing && !inactive) {
      onReviewClient(client.id);
    }
  };

  // Formatação de valores
  const formattedMonthlyBudget = formatCurrency(monthlyBudget || 0);
  const formattedTotalSpent = formatCurrency(totalSpent || 0);
  const formattedCurrentDaily = formatCurrency(currentDailyBudget || 0);
  const formattedIdealDaily = formatCurrency(idealDailyBudget || 0);
  const formattedDifference = formatCurrency(Math.abs(budgetDifference || 0));

  // Determinar se precisa de ajuste (diferença maior ou igual a R$5)
  const needsAdjustmentClass = needsBudgetAdjustment
    ? 'border-yellow-400 bg-yellow-50'
    : 'border-gray-200';

  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow ${
        inactive ? 'opacity-60 border-gray-200 bg-gray-50' : needsAdjustmentClass
      }`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 mb-1">
              {client.company_name}
            </h3>
            <div className="flex items-center">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {client.google_account_id || 'Sem ID Google Ads'}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleReviewClick}
            disabled={isProcessing || inactive}
            className={`px-3 py-1 rounded text-xs font-medium ${
              inactive
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isProcessing
                ? 'bg-blue-100 text-blue-700 cursor-wait'
                : 'bg-muran-primary text-white hover:bg-muran-primary/90'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader className="animate-spin mr-1 h-3 w-3" />
                <span>Analisando</span>
              </div>
            ) : inactive ? (
              'Sem Conta'
            ) : (
              'Analisar'
            )}
          </button>
        </div>

        {!compact && (
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
              <div className="text-gray-500">Orç. Diário Atual</div>
              <div className="font-semibold">{formattedCurrentDaily}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-500">Orç. Diário Ideal</div>
              <div className="font-semibold">{formattedIdealDaily}</div>
            </div>
          </div>
        )}

        {compact && (
          <div className="flex justify-between items-center mt-2 text-xs gap-2">
            <div>
              <span className="text-gray-500 mr-1">Orçamento:</span>
              <span className="font-semibold">{formattedMonthlyBudget}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-1">Gasto:</span>
              <span className="font-semibold">{formattedTotalSpent}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-1">Atual:</span>
              <span className="font-semibold">{formattedCurrentDaily}</span>
            </div>
          </div>
        )}

        {needsBudgetAdjustment && budgetDifference && (
          <div className="mt-2 text-xs bg-yellow-100 p-2 rounded text-yellow-800">
            {budgetDifference > 0 ? (
              <span>Aumentar orçamento diário em {formattedDifference}</span>
            ) : (
              <span>Diminuir orçamento diário em {formattedDifference}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
