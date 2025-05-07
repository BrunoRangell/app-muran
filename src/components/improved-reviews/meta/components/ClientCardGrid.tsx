
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientWithReview } from "../../../daily-reviews/hooks/types/reviewTypes";
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "../../../daily-reviews/summary/utils";
import { Badge } from "@/components/ui/badge";

interface ClientCardGridProps {
  client: ClientWithReview;
  isProcessing: boolean;
  onReviewClient: (clientId: string) => Promise<void>;
}

export const ClientCardGrid = ({
  client,
  isProcessing,
  onReviewClient
}: ClientCardGridProps) => {
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
    ? formatDateInBrasiliaTz(new Date(client.lastReview.review_date), "dd/MM")
    : "N/A";

  const borderColorClass = needsAdjustment 
    ? "border-l-4 border-l-amber-500" 
    : "border";

  return (
    <Card className={`overflow-hidden ${borderColorClass}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-1">{client.company_name}</CardTitle>
          {client.lastReview?.using_custom_budget && (
            <Badge variant="outline" className="text-xs bg-blue-50">Orç. Personalizado</Badge>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Última revisão: {lastReviewDate}
        </p>
      </CardHeader>
      
      <CardContent className="pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500">Orçamento Mensal</p>
            <p className="font-semibold">
              {formatCurrency(client.meta_ads_budget || 0)}
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500">Total Gasto</p>
            <p className="font-semibold">
              {client.lastReview?.meta_total_spent !== undefined 
                ? formatCurrency(client.lastReview.meta_total_spent)
                : "N/A"}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500">Orçamento Diário Atual</p>
            <p className="font-semibold">
              {currentBudget ? formatCurrency(currentBudget) : "N/A"}
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500">Orçamento Diário Ideal</p>
            <p className="font-semibold">
              {formatCurrency(idealBudget)}
            </p>
          </div>
        </div>
        
        {needsAdjustment && (
          <div className={`flex items-center gap-1 text-sm font-medium ${budgetDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button
          className="w-full"
          onClick={() => onReviewClient(client.id)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Analisar
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
