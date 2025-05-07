
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { ClientCardInfo } from "./ClientCardInfo";
import { CompactBudgetRecommendation } from "@/components/daily-reviews/dashboard/card-components/CompactBudgetRecommendation";

interface ClientCardProps {
  client: ClientWithReview;
  onReviewClient?: (clientId: string, accountId?: string) => void;
  isProcessing?: boolean;
  platform?: "meta" | "google";
}

export const ClientCard = ({ 
  client, 
  onReviewClient = () => {}, 
  isProcessing = false,
  platform = "meta"
}: ClientCardProps) => {
  const hasReview = Boolean(client.lastReview);
  const monthlyBudget = client.meta_ads_budget || 0;
  
  // Cálculos de orçamento
  const totalSpent = client.lastReview?.meta_total_spent || 0;
  const currentDailyBudget = client.lastReview?.meta_daily_budget_current || 0;
  
  // Calcular o orçamento diário ideal baseado no orçamento mensal restante
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDate = new Date().getDate();
  const remainingDays = daysInMonth - currentDate + 1; // +1 para incluir o dia atual
  
  const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
  const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
  
  // Calcular se o ajuste de orçamento é necessário
  const budgetDifference = idealDailyBudget - currentDailyBudget;
  const significantDifference = Math.abs(budgetDifference) > (idealDailyBudget * 0.05); // Diferença maior que 5%
  const needsAdjustment = hasReview && currentDailyBudget > 0 && idealDailyBudget > 0 && significantDifference;
  
  // Nome da conta Meta (vindo do lastReview)
  const accountName = client.lastReview?.account_display_name || "Conta Meta";

  return (
    <Card className={`border ${needsAdjustment ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex flex-col">
          <ClientCardInfo 
            client={client} 
            hasReview={hasReview} 
            accountName={accountName} 
            platform={platform}
          />
          
          <div className="grid grid-cols-2 gap-4 my-3">
            <div>
              <p className="text-sm text-gray-600">Orçamento</p>
              <p className="font-semibold">{formatCurrency(monthlyBudget)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gasto</p>
              <p className="font-semibold">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Atual</p>
              <p className="font-semibold">{formatCurrency(currentDailyBudget)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recomendado</p>
              <p className="font-semibold">{formatCurrency(idealDailyBudget)}</p>
            </div>
          </div>
          
          {needsAdjustment && (
            <CompactBudgetRecommendation
              budgetDifference={budgetDifference}
              shouldShow={true}
            />
          )}
          
          {!hasReview && (
            <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
              <AlertTriangle size={16} />
              <span>Nenhuma revisão recente</span>
            </div>
          )}
          
          <Button 
            onClick={() => onReviewClient(client.id)}
            disabled={isProcessing}
            variant="outline"
            className="w-full mt-4"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              "Analisar Conta"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
