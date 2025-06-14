import { Card } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useGoogleAdsBudgetCalculation } from "../hooks/useGoogleAdsBudgetCalculation";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";

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
    lastFiveDaysSpent,
    weightedAverage,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    isCalculating,
    remainingDaysValue,
    needsBudgetAdjustment,
    usingCustomBudget,
    customBudgetAmount,
    customBudgetStartDate,
    customBudgetEndDate
  } = useGoogleAdsBudgetCalculation(client);

  const handleReviewClick = () => {
    if (!isProcessing && !inactive) {
      onReviewClient(client.id);
    }
  };

  // Formatação de valores
  const formattedMonthlyBudget = formatCurrency(monthlyBudget || 0);
  const formattedTotalSpent = formatCurrency(totalSpent || 0);
  const formattedLastFiveDaysSpent = formatCurrency(lastFiveDaysSpent || 0);
  const formattedWeightedAverage = formatCurrency(weightedAverage || 0);
  const formattedCurrentDaily = formatCurrency(currentDailyBudget || 0);
  const formattedIdealDaily = formatCurrency(idealDailyBudget || 0);

  // Formatação da data da última revisão
  const formattedLastReviewDate = client.lastReview?.updated_at ? 
    formatDateInBrasiliaTz(new Date(client.lastReview.updated_at), "dd/MM 'às' HH:mm") : 
    "Sem revisão";

  // Determinar se o card deve ter destaque
  const cardBorderClass = needsBudgetAdjustment
    ? 'border-l-4 border-l-muran-primary'
    : '';

  // Verificar se o cliente tem contas Google configuradas
  const hasGoogleAccounts = client.google_accounts && client.google_accounts.length > 0;
  
  // Definir rótulo baseado no número de contas
  let accountsLabel = "Sem Conta";
  if (hasGoogleAccounts) {
    accountsLabel = client.google_accounts.length > 1 
      ? `${client.google_accounts.length} Contas` 
      : client.google_accounts[0].account_name || "1 Conta";
  }

  // Formato de datas para orçamento personalizado
  const formatCustomBudgetDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Formatação de datas de início e fim do orçamento personalizado
  const formattedCustomBudgetStartDate = customBudgetStartDate ? formatCustomBudgetDate(customBudgetStartDate) : '';
  const formattedCustomBudgetEndDate = customBudgetEndDate ? formatCustomBudgetDate(customBudgetEndDate) : '';

  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow ${
        inactive ? 'opacity-60' : ''
      } ${cardBorderClass} ${usingCustomBudget ? 'border-r-4 border-r-[#ff6e00]' : ''}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 mb-1">
              {client.company_name}
            </h3>
            <div className="flex items-center">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {formattedLastReviewDate}
              </span>
              {hasGoogleAccounts && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded ml-1">
                  {accountsLabel}
                </span>
              )}
              {usingCustomBudget && (
                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded ml-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                  </svg>
                  Orç. Personalizado
                </span>
              )}
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

        {usingCustomBudget && (
          <div className="bg-orange-50 p-2 rounded mb-2 text-xs">
            <div className="text-orange-600 font-medium mb-1">Orçamento personalizado ativo</div>
            <div className="flex justify-between">
              <div>
                <span className="text-gray-600">Valor:</span>{" "}
                <span className="font-medium">{formatCurrency(customBudgetAmount || 0)}</span>
              </div>
              <div>
                <span className="text-gray-600">Período:</span>{" "}
                <span className="font-medium">{formattedCustomBudgetStartDate} - {formattedCustomBudgetEndDate}</span>
              </div>
            </div>
          </div>
        )}

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
              <div className="text-gray-500">Média 5 dias</div>
              <div className="font-semibold">{formattedLastFiveDaysSpent}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-500">Média Pond</div>
              <div className="font-semibold">{formattedWeightedAverage}</div>
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
              <span className="text-gray-500 mr-1">Média Pond:</span>
              <span className="font-semibold">{formattedWeightedAverage}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-1">Atual:</span>
              <span className="font-semibold">{formattedCurrentDaily}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-1">Ideal:</span>
              <span className="font-semibold">{formattedIdealDaily}</span>
            </div>
          </div>
        )}

        {needsBudgetAdjustment && budgetDifference && (
          <div className="mt-2 text-xs p-2 rounded flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-muran-primary"></div>
            <span className="font-medium">
              {budgetDifference > 0 ? 
                `Reduzir orçamento diário em -${formatCurrency(Math.abs(budgetDifference))}` : 
                `Aumentar orçamento diário em +${formatCurrency(Math.abs(budgetDifference))}`}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
