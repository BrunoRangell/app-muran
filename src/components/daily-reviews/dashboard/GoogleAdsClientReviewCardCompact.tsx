
import { Card } from "@/components/ui/card";
import { Loader, CloudOff } from "lucide-react";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useGoogleAdsBudgetCalculation } from "../hooks/useGoogleAdsBudgetCalculation";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { CompactBudgetRecommendation } from "./card-components/CompactBudgetRecommendation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    budgetDifferenceBasedOnAverage,
    isCalculating,
    remainingDaysValue,
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage
  } = useGoogleAdsBudgetCalculation(client);

  // Verificar se os dados são reais ou simulados
  const usingRealData = client?.lastReview?.usingRealData !== false;

  const handleReviewClick = () => {
    if (!isProcessing && !inactive) {
      onReviewClient(client.id);
    }
  };

  // Formatação de valores
  const formattedMonthlyBudget = formatCurrency(monthlyBudget || 0);
  const formattedTotalSpent = formatCurrency(totalSpent || 0);
  const formattedLastFiveDaysSpent = formatCurrency(lastFiveDaysSpent || 0);
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

  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow ${
        inactive ? 'opacity-60' : ''
      } ${cardBorderClass}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 mb-1">
              {client.company_name}
            </h3>
            <div className="flex items-center flex-wrap gap-1">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {formattedLastReviewDate}
              </span>
              {hasGoogleAccounts && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {accountsLabel}
                </span>
              )}
              {!usingRealData && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded flex items-center">
                        <CloudOff className="h-3 w-3 mr-1" />
                        Simulado
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Dados estimados ou históricos. Não foi possível obter dados reais da API.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
        )}

        <CompactBudgetRecommendation
          budgetDifference={budgetDifference || 0}
          budgetDifferenceBasedOnAverage={budgetDifferenceBasedOnAverage}
          shouldShow={!!needsBudgetAdjustment}
          shouldShowAverage={!!needsAdjustmentBasedOnAverage}
          lastFiveDaysAverage={lastFiveDaysSpent}
          platform="google"
          usingRealData={usingRealData}
        />
      </div>
    </Card>
  );
};
