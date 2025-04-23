
import { Loader } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";
import { ClientInfo } from "./card-components/ClientInfo";
import { BudgetDisplay } from "./card-components/BudgetDisplay";
import { ActionButtons } from "./card-components/ActionButtons";
import { MetaAccount } from "../hooks/types/accountTypes";

interface ClientAltCardProps {
  client: ClientWithReview;
  metaAccount?: MetaAccount;
  onReviewClient: (clientId: string, accountId?: string) => void;
  isProcessing: boolean;
}

export const ClientAltCard = ({ 
  client, 
  metaAccount,
  onReviewClient,
  isProcessing 
}: ClientAltCardProps) => {
  // Usar o hook personalizado para cálculos de orçamento
  // Passar accountId se existir uma conta Meta específica
  const {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    customBudget,
    isUsingCustomBudgetInReview,
    actualBudgetAmount,
    accountName,
    remainingDaysValue
  } = useClientBudgetCalculation(
    client, 
    metaAccount?.account_id
  );

  // Flag para mostrar recomendação de orçamento
  const showRecommendation = hasReview && Math.abs(budgetDifference) >= 5;
  const needsIncrease = budgetDifference > 0;

  // O orçamento a ser mostrado deve ser o da conta específica se estiver disponível
  const displayBudget = metaAccount ? metaAccount.budget_amount : actualBudgetAmount || monthlyBudget;

  return (
    <tr className={`hover:bg-gray-50 ${
      showRecommendation ? 'border-l-4 border-l-amber-500' : ''
    }`}>
      <td className="px-6 py-4">
        <ClientInfo 
          client={client}
          metaAccount={metaAccount}
          customBudget={customBudget}
          isUsingCustomBudgetInReview={isUsingCustomBudgetInReview}
        />
      </td>
      <td className="px-6 py-4">
        <div className="font-medium">{formatCurrency(displayBudget)}</div>
      </td>
      <td className="px-6 py-4">
        {isCalculating ? (
          <span className="text-gray-400 flex items-center">
            <Loader size={14} className="animate-spin mr-2" /> Calculando...
          </span>
        ) : calculationError ? (
          <span className="text-red-500 text-sm">Erro ao calcular</span>
        ) : (
          <div className="font-medium">{formatCurrency(totalSpent)}</div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="font-medium">
          {hasReview && currentDailyBudget 
            ? formatCurrency(currentDailyBudget) 
            : "Não disponível"}
        </div>
      </td>
      <td className="px-6 py-4">
        <BudgetDisplay 
          idealDailyBudget={idealDailyBudget}
          showRecommendation={showRecommendation}
          needsIncrease={needsIncrease}
          budgetDifference={budgetDifference}
          accountName={accountName || metaAccount?.account_name}
        />
      </td>
      <td className="px-6 py-4">
        <ActionButtons 
          isUsingCustomBudgetInReview={isUsingCustomBudgetInReview}
          customBudget={customBudget}
          onReviewClient={() => onReviewClient(client.id, metaAccount?.account_id)}
          isProcessing={isProcessing}
        />
      </td>
    </tr>
  );
};
