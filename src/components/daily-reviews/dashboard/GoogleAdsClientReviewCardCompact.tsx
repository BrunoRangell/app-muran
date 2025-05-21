
import { Card } from "@/components/ui/card";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useGoogleAdsBudgetCalculation } from "../hooks/useGoogleAdsBudgetCalculation";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { GoogleAdsClientInfo } from "./card-components/GoogleAdsClientInfo";
import { GoogleReviewButton } from "./card-components/GoogleReviewButton";
import { CustomBudgetInfo } from "./card-components/CustomBudgetInfo";
import { GoogleBudgetMetrics } from "./card-components/GoogleBudgetMetrics";
import { GoogleBudgetRecommendation } from "./card-components/GoogleBudgetRecommendation";

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
          <GoogleAdsClientInfo 
            client={client}
            formattedLastReviewDate={formattedLastReviewDate}
            hasGoogleAccounts={hasGoogleAccounts}
            accountsLabel={accountsLabel}
            usingCustomBudget={usingCustomBudget}
          />
          
          <GoogleReviewButton 
            onReviewClick={handleReviewClick}
            isProcessing={isProcessing}
            inactive={inactive}
          />
        </div>

        {usingCustomBudget && (
          <CustomBudgetInfo 
            customBudgetAmount={customBudgetAmount}
            formattedCustomBudgetStartDate={formattedCustomBudgetStartDate}
            formattedCustomBudgetEndDate={formattedCustomBudgetEndDate}
          />
        )}

        <GoogleBudgetMetrics 
          formattedMonthlyBudget={formattedMonthlyBudget}
          formattedTotalSpent={formattedTotalSpent}
          formattedLastFiveDaysSpent={formattedLastFiveDaysSpent}
          formattedCurrentDaily={formattedCurrentDaily}
          formattedIdealDaily={formattedIdealDaily}
          compact={compact}
        />

        <GoogleBudgetRecommendation 
          budgetDifference={budgetDifference}
          needsBudgetAdjustment={needsBudgetAdjustment}
        />
      </div>
    </Card>
  );
};
