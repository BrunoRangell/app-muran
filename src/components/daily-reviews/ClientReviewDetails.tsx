
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClientHeader } from "@/components/daily-reviews/client-details/ClientHeader";
import { ClientSummaryCard } from "@/components/daily-reviews/client-details/ClientSummaryCard";
import { BudgetCard } from "@/components/daily-reviews/client-details/BudgetCard";
import { RecommendationCard } from "@/components/daily-reviews/client-details/RecommendationCard";
import { ReviewHistoryTable } from "@/components/daily-reviews/client-details/ReviewHistoryTable";
import { LoadingState } from "@/components/daily-reviews/client-details/LoadingState";
import { ClientNotFound } from "@/components/daily-reviews/client-details/ClientNotFound";
import { useClientReviewDetails } from "@/components/daily-reviews/client-details/useClientReviewDetails";
import { useClientAnalysis } from "./hooks/useClientAnalysis";
import { useToast } from "@/hooks/use-toast";

interface ClientReviewDetailsProps {
  clientId: string;
  onBack: () => void;
}

export const ClientReviewDetails = ({ clientId, onBack }: ClientReviewDetailsProps) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    client,
    latestReview,
    reviewHistory,
    recommendation,
    idealDailyBudget,
    isLoading,
    isLoadingHistory,
    hasError,
    refetchData
  } = useClientReviewDetails(clientId);

  // Importamos o hook useClientAnalysis para analisar o cliente
  const { analyzeMutation } = useClientAnalysis((data) => {
    toast({
      title: "Análise concluída",
      description: `Análise do cliente ${client?.company_name} atualizada com sucesso.`,
    });
    
    // Após análise bem-sucedida, atualizamos os dados
    refetchData();
    setIsRefreshing(false);
  });

  const handleRefreshAnalysis = () => {
    if (!client) return;
    
    setIsRefreshing(true);
    analyzeMutation.mutate(clientId);
  };

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
        isRefreshing={isRefreshing || analyzeMutation.isPending}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ClientSummaryCard client={client} />
        
        <BudgetCard 
          latestReview={latestReview}
          client={client} 
          idealDailyBudget={idealDailyBudget}
        />
        
        <RecommendationCard recommendation={recommendation} />
      </div>

      <ReviewHistoryTable 
        isLoading={isLoadingHistory} 
        reviewHistory={reviewHistory} 
      />
    </div>
  );
};
