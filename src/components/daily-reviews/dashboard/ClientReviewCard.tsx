
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";
import { CardHeader } from "./CardHeader";
import { BudgetInfoGrid } from "./BudgetInfoGrid";
import { BudgetRecommendation } from "./BudgetRecommendation";
import { CalculationError } from "./CalculationError";
import { CardActions } from "./CardActions";

interface ClientReviewCardProps {
  client: ClientWithReview;
  onViewDetails: (clientId: string) => void;
  onReviewClient: (clientId: string) => void;
  isProcessing: boolean;
}

export const ClientReviewCard = ({ 
  client, 
  onReviewClient,
  isProcessing 
}: ClientReviewCardProps) => {
  // Usar o hook personalizado para cálculos de orçamento
  const {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    budgetDifferenceBasedOnAverage,
    lastFiveDaysAverage,
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage
  } = useClientBudgetCalculation(client);

  // Flag para mostrar recomendação de orçamento baseada no orçamento atual
  const showRecommendation = needsBudgetAdjustment;
  
  // Flag para mostrar recomendação baseada na média dos últimos 5 dias
  const showRecommendationAverage = needsAdjustmentBasedOnAverage && lastFiveDaysAverage > 0;

  // Determinar se o card deve ter destaque (se houver qualquer recomendação)
  const shouldHighlight = showRecommendation || showRecommendationAverage;
  
  // Obter o nome da conta para exibição - corrigindo as propriedades
  const accountName = client.lastReview?.account_display_name || "Conta de anúncios";

  return (
    <Card className={`overflow-hidden border ${shouldHighlight ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-4">
        <CardHeader 
          companyName={client.company_name} 
          lastReviewDate={client.lastReview?.review_date}
          lastReviewUpdatedAt={client.lastReview?.updated_at}
        />
        
        <BudgetInfoGrid 
          monthlyBudget={monthlyBudget}
          totalSpent={totalSpent}
          currentDailyBudget={currentDailyBudget}
          lastFiveDaysAverage={lastFiveDaysAverage}
          idealDailyBudget={idealDailyBudget}
          isCalculating={isCalculating}
          calculationError={calculationError}
          hasReview={hasReview}
        />

        <BudgetRecommendation 
          budgetDifference={budgetDifference}
          budgetDifferenceBasedOnAverage={budgetDifferenceBasedOnAverage}
          shouldShow={showRecommendation}
          shouldShowAverage={showRecommendationAverage}
          hasReview={hasReview}
          lastFiveDaysAverage={lastFiveDaysAverage}
          compact={true} // Usar versão compacta
          accountName={accountName}
        />

        <CalculationError error={calculationError} />
      </CardContent>

      <CardFooter className="p-0">
        <CardActions 
          onReviewClient={() => onReviewClient(client.id)}
          isProcessing={isProcessing}
        />
      </CardFooter>
    </Card>
  );
};
