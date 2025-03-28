
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientHeader } from "@/components/daily-reviews/client-details/ClientHeader";
import { ClientDetailsContent } from "./client-details/ClientDetailsContent";
import { LoadingState } from "@/components/daily-reviews/client-details/LoadingState";
import { ClientNotFound } from "@/components/daily-reviews/client-details/ClientNotFound";
import { useClientReviewDetails } from "@/components/daily-reviews/client-details/useClientReviewDetails";
import { useClientReviewAnalysis } from "./hooks/useClientReviewAnalysis";

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
    suggestedBudgetChange,
    isLoading,
    isLoadingHistory,
    hasError,
    refetchData,
    // Detalhes do cálculo
    remainingDays,
    remainingBudget,
    monthlyBudget,
    totalSpent
  } = useClientReviewDetails(clientId);

  const { 
    isRefreshing, 
    isAnalyzing, 
    handleRefreshAnalysis 
  } = useClientReviewAnalysis(clientId, refetchData);

  if (isLoading) {
    return <LoadingState />;
  }

  if (hasError || !client) {
    return <ClientNotFound onBack={onBack} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={onBack}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <ClientHeader 
        client={client} 
        onRefreshAnalysis={handleRefreshAnalysis}
        isRefreshing={isRefreshing || isAnalyzing}
      />

      <ClientDetailsContent
        client={client}
        latestReview={latestReview}
        reviewHistory={reviewHistory}
        recommendation={recommendation}
        idealDailyBudget={idealDailyBudget}
        suggestedBudgetChange={suggestedBudgetChange}
        isLoadingHistory={isLoadingHistory}
        onRefresh={refetchData}
        // Passando detalhes do cálculo
        remainingDays={remainingDays}
        remainingBudget={remainingBudget}
        monthlyBudget={monthlyBudget}
        totalSpent={totalSpent}
      />
    </div>
  );
};
