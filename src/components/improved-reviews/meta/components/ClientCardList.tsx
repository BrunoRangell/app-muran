
import { Card, CardContent } from "@/components/ui/card";
import { ClientWithReview } from "../../../daily-reviews/hooks/types/reviewTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader, RefreshCw, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "../../../daily-reviews/summary/utils";

interface ClientCardListProps {
  client: ClientWithReview;
  isProcessing: boolean;
  onReviewClient: (clientId: string) => Promise<void>;
}

export const ClientCardList = ({
  client,
  isProcessing,
  onReviewClient
}: ClientCardListProps) => {
  // Função para calcular o orçamento ideal se não estiver presente
  const calculateIdealBudget = (): number => {
    if (client.lastReview?.idealDailyBudget !== undefined) {
      return client.lastReview.idealDailyBudget;
    }
    
    if (!client.lastReview) return 0;
    
    const totalSpent = client.lastReview.meta_total_spent || 0;
    const budgetAmount = client.lastReview.using_custom_budget 
      ? client.lastReview.custom_budget_amount || client.meta_ads_budget || 0
      : client.meta_ads_budget || 0;
    
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
    
    return remainingDays > 0 ? (budgetAmount - totalSpent) / remainingDays : 0;
  };
  
  const idealBudget = calculateIdealBudget();
  const currentBudget = client.lastReview?.meta_daily_budget_current || 0;
  const budgetDifference = idealBudget - currentBudget;
  const needsAdjustment = Math.abs(budgetDifference) >= 5;
  
  const lastReviewDate = client.lastReview?.review_date 
    ? formatDateInBrasiliaTz(new Date(client.lastReview.review_date), "dd/MM/yyyy 'às' HH:mm")
    : "Nunca revisado";

  const borderColorClass = needsAdjustment 
    ? "border-l-4 border-l-amber-500" 
    : "";

  return (
    <Card className={`${borderColorClass}`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{client.company_name}</h3>
              {client.lastReview?.using_custom_budget && (
                <Badge variant="outline" className="text-xs bg-blue-50">Orçamento Personalizado</Badge>
              )}
              {needsAdjustment && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Ajuste necessário
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Última revisão: {lastReviewDate}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 flex-1">
            <div>
              <p className="text-xs text-gray-500">Orçamento Mensal</p>
              <p className="font-semibold">
                {formatCurrency(client.meta_ads_budget || 0)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">Orçamento Diário Atual</p>
              <p className="font-semibold">
                {currentBudget ? formatCurrency(currentBudget) : "N/A"}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">Orçamento Diário Ideal</p>
              <p className="font-semibold">
                {formatCurrency(idealBudget)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {needsAdjustment && (
              <div className={`flex items-center gap-1 text-sm font-medium whitespace-nowrap ${budgetDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {budgetDifference > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Aumentar {formatCurrency(Math.abs(budgetDifference))}
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4" />
                    Reduzir {formatCurrency(Math.abs(budgetDifference))}
                  </>
                )}
              </div>
            )}
            
            <Button
              onClick={() => onReviewClient(client.id)}
              disabled={isProcessing}
              size="sm"
              className="whitespace-nowrap"
            >
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-3 w-3 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Analisar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
