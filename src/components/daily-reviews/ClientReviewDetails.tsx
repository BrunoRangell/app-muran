
import { ErrorState } from "@/components/clients/components/ErrorState";
import { ClientHeader } from "./client-details/ClientHeader";
import { LoadingState } from "./client-details/LoadingState";
import { ClientNotFound } from "./client-details/ClientNotFound";
import { ClientSummaryCard } from "./client-details/ClientSummaryCard";
import { BudgetCard } from "./client-details/BudgetCard";
import { RecommendationCard } from "./client-details/RecommendationCard";
import { ReviewHistoryTable } from "./client-details/ReviewHistoryTable";
import { useClientReviewDetails } from "./client-details/useClientReviewDetails";

interface ClientReviewDetailsProps {
  clientId: string;
  onBack: () => void;
}

export const ClientReviewDetails = ({ clientId, onBack }: ClientReviewDetailsProps) => {
  const {
    client,
    latestReview,
    reviewHistory,
    recommendation,
    idealDailyBudget,
    isLoading,
    isLoadingHistory,
    hasError
  } = useClientReviewDetails(clientId);

  if (hasError) {
    return (
      <div className="space-y-6">
        <ClientHeader onBack={onBack} />
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientHeader onBack={onBack} />

      {isLoading ? (
        <LoadingState />
      ) : !client ? (
        <ClientNotFound />
      ) : (
        <>
          <ClientSummaryCard client={client} latestReview={latestReview} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <BudgetCard 
              latestReview={latestReview} 
              idealDailyBudget={idealDailyBudget} 
            />
            <RecommendationCard recommendation={recommendation} />
          </div>

          <ReviewHistoryTable 
            isLoading={isLoadingHistory} 
            reviewHistory={reviewHistory} 
          />
        </>
      )}
    </div>
  );
};
