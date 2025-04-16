import { Loader } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";
import { ClientInfo } from "./card-components/ClientInfo";
import { BudgetDisplay } from "./card-components/BudgetDisplay";
import { ActionButtons } from "./card-components/ActionButtons";

interface ClientAltCardProps {
  client: ClientWithReview;
  onReviewClient: (clientId: string) => void;
  isProcessing: boolean;
  accountId?: string;
}

export const ClientAltCard = ({ 
  client, 
  onReviewClient,
  isProcessing,
  accountId
}: ClientAltCardProps) => {
  const {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    // Informações sobre orçamento personalizado
    customBudget,
    isUsingCustomBudgetInReview,
    actualBudgetAmount,
    accountName
  } = useClientBudgetCalculation(client, accountId);

  // Flag para mostrar recomendação de orçamento - Apenas para clientes com revisão e diferença significativa
  const showRecommendation = hasReview && Math.abs(budgetDifference) >= 5;
  const needsIncrease = budgetDifference > 0;

  return (
    <tr className={`hover:bg-gray-50 ${
      showRecommendation ? 'border-l-4 border-l-amber-500' : ''
    }`}>
      <td className="px-6 py-4">
        <ClientInfo 
          client={client} 
          customBudget={customBudget} 
          isUsingCustomBudgetInReview={isUsingCustomBudgetInReview}
          accountName={accountName}
        />
      </td>
      <td className="px-6 py-4">
        <div className="font-medium">{formatCurrency(actualBudgetAmount || monthlyBudget)}</div>
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
          accountName={accountName}
        />
      </td>
      <td className="px-6 py-4">
        <ActionButtons 
          isUsingCustomBudgetInReview={isUsingCustomBudgetInReview}
          customBudget={customBudget}
          onReviewClient={() => onReviewClient(client.id)}
          isProcessing={isProcessing}
        />
      </td>
    </tr>
  );
};
