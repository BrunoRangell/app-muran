
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
    budgetDifference
  } = useClientBudgetCalculation(client);

  // Flag para mostrar recomendação de orçamento
  const showRecommendation = Math.abs(budgetDifference) >= 5;

  return (
    <Card className={`overflow-hidden border ${showRecommendation ? 'border-l-4 border-l-amber-500' : ''}`}>
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
          idealDailyBudget={idealDailyBudget}
          isCalculating={isCalculating}
          calculationError={calculationError}
          hasReview={hasReview}
        />

        <BudgetRecommendation 
          budgetDifference={budgetDifference}
          shouldShow={showRecommendation}
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
