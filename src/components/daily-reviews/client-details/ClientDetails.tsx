
import { useState, useEffect } from "react";
import { useClientDetails } from "../hooks/useClientDetails";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  RefreshCw, 
  Loader 
} from "lucide-react";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { ClientDetailsContent } from "./ClientDetailsContent";
import { ClientDetailsSkeleton } from "./ClientDetailsSkeleton";
import { ReviewClientAction } from "./ReviewClientAction";
import { SessionExpiredAlert } from "./SessionExpiredAlert";
import { useGoogleAdsBudgetCalculation } from "../hooks/useGoogleAdsBudgetCalculation";

export const ClientDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { 
    client, 
    reviewHistory, 
    latestReview, 
    isLoadingClient, 
    isLoadingHistory,
    reviewClient,
    isReviewing,
    error,
    refreshClient
  } = useClientDetails(clientId || "");
  
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);
  
  // Usar o hook de cálculo de orçamento do Google Ads
  const {
    idealDailyBudget,
    budgetDifference,
    budgetDifferenceBasedOnAverage,
    lastFiveDaysSpent,
    remainingDaysValue,
    totalSpent,
    monthlyBudget,
    remainingBudget = monthlyBudget - (totalSpent || 0),
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage
  } = useGoogleAdsBudgetCalculation(client || { id: "", company_name: "", status: "" });
  
  // Verificar a presença de token de acesso quando a página carrega
  useEffect(() => {
    const checkToken = async () => {
      // Lógica para verificar o token de acesso
      const hasValidToken = localStorage.getItem("meta_access_token") !== null;
      
      if (!hasValidToken) {
        setShowExpiredAlert(true);
      }
    };
    
    checkToken();
  }, []);
  
  // Gerar recomendação com base na diferença do orçamento
  const getRecommendation = () => {
    if (!needsBudgetAdjustment) return null;
    
    return budgetDifference > 0 
      ? `Aumentar ${budgetDifference.toFixed(2)} reais` 
      : `Diminuir ${Math.abs(budgetDifference).toFixed(2)} reais`;
  };
  
  // Gerar recomendação com base na diferença da média dos últimos 5 dias
  const getRecommendationAverage = () => {
    if (!needsAdjustmentBasedOnAverage || !lastFiveDaysSpent) return null;
    
    return budgetDifferenceBasedOnAverage > 0 
      ? `Aumentar ${budgetDifferenceBasedOnAverage.toFixed(2)} reais` 
      : `Diminuir ${Math.abs(budgetDifferenceBasedOnAverage).toFixed(2)} reais`;
  };
  
  // Se estiver carregando, mostrar um placeholder
  if (isLoadingClient) {
    return <ClientDetailsSkeleton />;
  }
  
  // Se o cliente não existir, mostrar uma mensagem
  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/revisao-diaria-avancada?tab=google-ads">
              <ArrowLeft className="mr-2" size={16} />
              Voltar
            </Link>
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Cliente não encontrado</h2>
          <p className="text-gray-600">O cliente solicitado não existe ou foi removido.</p>
          <Button className="mt-4" asChild>
            <Link to="/revisao-diaria-avancada?tab=google-ads">
              Voltar para a lista
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4 space-y-6">
      {showExpiredAlert && <SessionExpiredAlert />}

      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/revisao-diaria-avancada?tab=google-ads">
              <ArrowLeft className="mr-2" size={16} />
              Voltar
            </Link>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">{client.company_name}</h1>
            <p className="text-sm text-gray-500">
              Última revisão: {latestReview 
                ? formatDateInBrasiliaTz(latestReview.updated_at, "dd 'de' MMMM 'às' HH:mm") 
                : "Nunca revisado"}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshClient}
            disabled={isLoadingClient}
          >
            {isLoadingClient ? (
              <Loader className="animate-spin mr-2" size={14} />
            ) : (
              <RefreshCw className="mr-2" size={14} />
            )}
            Atualizar
          </Button>
          
          <ReviewClientAction 
            clientId={client.id} 
            onReviewClient={reviewClient}
            isReviewing={isReviewing}
          />
        </div>
      </div>
      
      <ClientDetailsContent 
        client={client}
        latestReview={latestReview}
        reviewHistory={reviewHistory}
        recommendation={getRecommendation()}
        recommendationAverage={getRecommendationAverage()}
        idealDailyBudget={idealDailyBudget}
        suggestedBudgetChange={budgetDifference}
        suggestedBudgetChangeAverage={budgetDifferenceBasedOnAverage}
        lastFiveDaysAverage={lastFiveDaysSpent}
        isLoadingHistory={isLoadingHistory}
        onRefresh={refreshClient}
        remainingDays={remainingDaysValue}
        remainingBudget={remainingBudget}
        monthlyBudget={monthlyBudget}
        totalSpent={totalSpent}
      />
    </div>
  );
};
