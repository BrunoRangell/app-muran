
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { Loader } from "lucide-react";
import { ClientInfo } from "./card-components/ClientInfo";
import { BudgetDisplay } from "./card-components/BudgetDisplay";
import { ActionButtons } from "./card-components/ActionButtons";

interface ClientReviewCardCompactProps {
  client: ClientWithReview;
  onReviewClient: (clientId: string) => void;
  isProcessing: boolean;
  compact?: boolean;
  inactive?: boolean;
}

export const ClientReviewCardCompact = ({
  client,
  onReviewClient,
  isProcessing,
  compact = false,
  inactive = false,
}: ClientReviewCardCompactProps) => {
  // Utilizar todos os orçamentos configurados
  const accounts = client.meta_accounts || [];
  
  // Se não houver contas configuradas, usar a configuração legada
  if (accounts.length === 0 && client.meta_account_id) {
    accounts.push({
      id: 'legacy',
      account_id: client.meta_account_id,
      account_name: 'Principal',
      budget_amount: client.meta_ads_budget,
      is_primary: true,
      client_id: client.id,
      status: 'active',
      created_at: '',
      updated_at: ''
    });
  }

  return (
    <>
      {accounts.map((account) => {
        // Usar o hook de cálculo para cada conta
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
        } = useClientBudgetCalculation(client, account.id);

        // Flag para mostrar recomendação de orçamento
        const showRecommendation = hasReview && Math.abs(budgetDifference) >= 5;
        const needsIncrease = budgetDifference > 0;

        return (
          <Card 
            key={account.id}
            className={`${compact ? 'border-b last:border-b-0' : ''} ${
              showRecommendation ? 'border-l-4 border-l-amber-500' : ''
            } ${inactive ? 'opacity-60' : ''}`}
          >
            <CardContent className={`${compact ? 'p-4' : 'p-6'}`}>
              <div className="space-y-4">
                <ClientInfo 
                  client={client} 
                  accountName={account.account_name}
                  customBudget={customBudget}
                  isUsingCustomBudgetInReview={isUsingCustomBudgetInReview}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Orçamento Mensal
                    </div>
                    <div className="font-medium">
                      {formatCurrency(account.budget_amount)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Total Gasto
                    </div>
                    {isCalculating ? (
                      <span className="text-gray-400 flex items-center">
                        <Loader size={14} className="animate-spin mr-2" /> 
                        Calculando...
                      </span>
                    ) : calculationError ? (
                      <span className="text-red-500 text-sm">
                        Erro ao calcular
                      </span>
                    ) : (
                      <div className="font-medium">{formatCurrency(totalSpent)}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Orçamento Atual / Recomendado
                    </div>
                    <BudgetDisplay 
                      idealDailyBudget={idealDailyBudget}
                      showRecommendation={showRecommendation}
                      needsIncrease={needsIncrease}
                      budgetDifference={budgetDifference}
                      accountName={account.account_name}
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            {!compact && (
              <CardFooter className="px-6 py-4 bg-gray-50">
                <ActionButtons 
                  isUsingCustomBudgetInReview={isUsingCustomBudgetInReview}
                  customBudget={customBudget}
                  onReviewClient={() => onReviewClient(client.id)}
                  isProcessing={isProcessing}
                />
              </CardFooter>
            )}
          </Card>
        );
      })}
    </>
  );
};
