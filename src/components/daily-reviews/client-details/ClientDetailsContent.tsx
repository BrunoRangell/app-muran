
import { ClientSummaryCard } from "./ClientSummaryCard";
import { BudgetCard } from "./BudgetCard";
import { RecommendationCard } from "./RecommendationCard";

interface ClientDetailsContentProps {
  client: any;
  latestReview: any;
  idealDailyBudget: number | null;
  recommendation: string | null;
  suggestedBudgetChange: number | null;
}

export const ClientDetailsContent = ({
  client,
  latestReview,
  idealDailyBudget,
  recommendation,
  suggestedBudgetChange
}: ClientDetailsContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      <ClientSummaryCard 
        client={client} 
        latestReview={latestReview}
      />
      
      <BudgetCard 
        latestReview={latestReview}
        client={client} 
        idealDailyBudget={idealDailyBudget}
      />
      
      <RecommendationCard 
        recommendation={recommendation} 
        suggestedBudgetChange={suggestedBudgetChange}
      />
    </div>
  );
};
