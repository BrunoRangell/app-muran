
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { ArrowRight, TrendingDown, TrendingUp, MinusCircle } from "lucide-react";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { calculateIdealDailyBudget, generateRecommendation } from "../summary/utils";

interface ClientReviewCardProps {
  client: ClientWithReview;
  onViewDetails: (clientId: string) => void;
  onReviewClient: (clientId: string) => void;
  isProcessing: boolean;
}

export const ClientReviewCard = ({ 
  client, 
  onViewDetails, 
  onReviewClient,
  isProcessing 
}: ClientReviewCardProps) => {
  // Verificar se o cliente tem uma revisão recente
  const hasReview = !!client.lastReview;
  
  // Calcular o orçamento diário ideal com base no orçamento mensal
  const idealDailyBudget = client.meta_ads_budget
    ? calculateIdealDailyBudget(client.meta_ads_budget, new Date())
    : 0;

  // Gerar recomendação com base nos orçamentos
  const recommendation = hasReview && client.lastReview?.meta_daily_budget_current
    ? generateRecommendation(client.lastReview.meta_daily_budget_current, idealDailyBudget)
    : null;
  
  // Funções auxiliares para UI
  const getRecommendationIcon = () => {
    if (!hasReview || !recommendation) return null;
    
    if (recommendation.includes("Aumentar")) {
      return <TrendingUp className="text-green-500" size={16} />;
    } else if (recommendation.includes("Diminuir")) {
      return <TrendingDown className="text-red-500" size={16} />;
    } else {
      return <MinusCircle className="text-gray-500" size={16} />;
    }
  };

  const getRecommendationColor = () => {
    if (!hasReview || !recommendation) return "";
    
    if (recommendation.includes("Aumentar")) {
      return "text-green-600";
    } else if (recommendation.includes("Diminuir")) {
      return "text-red-600";
    }
    return "text-gray-600";
  };

  const hasSignificantDifference = () => {
    if (!hasReview || !client.lastReview?.meta_daily_budget_current) {
      return false;
    }
    
    const diff = Math.abs(client.lastReview.meta_daily_budget_current - idealDailyBudget);
    return diff >= 5;
  };

  const getBudgetDifference = () => {
    if (!hasReview || !client.lastReview?.meta_daily_budget_current) {
      return 0;
    }
    
    return idealDailyBudget - client.lastReview.meta_daily_budget_current;
  };

  const getFormattedReviewDate = () => {
    if (!hasReview) return "Sem revisão";
    
    try {
      // Usar review_date se created_at não estiver disponível
      const dateToFormat = client.lastReview.created_at || client.lastReview.review_date;
      
      return formatDateInBrasiliaTz(
        new Date(dateToFormat), 
        "'Última revisão em' dd 'de' MMMM 'às' HH:mm"
      );
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  const getAdjustmentMessage = () => {
    const diff = getBudgetDifference();
    if (diff > 0) {
      return `Ajuste recomendado: Aumentar ${formatCurrency(Math.abs(diff))}`;
    } else if (diff < 0) {
      return `Ajuste recomendado: Diminuir ${formatCurrency(Math.abs(diff))}`;
    }
    return "";
  };

  console.log("Dados do cliente no card:", {
    clientId: client.id,
    clientName: client.company_name,
    hasReview,
    lastReview: client.lastReview,
    idealDailyBudget,
    recommendation,
    metaAdsBudget: client.meta_ads_budget
  });

  return (
    <Card className={`overflow-hidden ${hasSignificantDifference() ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium truncate">{client.company_name}</h3>
          {hasReview && (
            <span className="text-xs text-gray-500">
              {getFormattedReviewDate()}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-500">Orçamento Mensal</div>
            <div>{formatCurrency(client.meta_ads_budget || 0)}</div>
          </div>

          <div>
            <div className="text-gray-500">Orçamento Diário</div>
            <div>
              {hasReview && client.lastReview?.meta_daily_budget_current !== null 
                ? formatCurrency(client.lastReview.meta_daily_budget_current) 
                : "Não disponível"}
            </div>
          </div>

          <div>
            <div className="text-gray-500">Orçamento Sugerido</div>
            <div>
              {idealDailyBudget > 0 
                ? formatCurrency(idealDailyBudget) 
                : "Não disponível"}
            </div>
          </div>

          <div>
            <div className="text-gray-500">Recomendação</div>
            <div className={`flex items-center gap-1 ${getRecommendationColor()} font-medium`}>
              {getRecommendationIcon()}
              {recommendation || "Não disponível"}
            </div>
          </div>
          
          {hasSignificantDifference() && (
            <div className="col-span-2 mt-1">
              <div className={`${getBudgetDifference() > 0 ? 'text-green-600' : 'text-red-600'} text-sm font-medium`}>
                {getAdjustmentMessage()}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onReviewClient(client.id)}
          disabled={isProcessing}
        >
          {isProcessing ? "Analisando..." : "Analisar"}
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => onViewDetails(client.id)}
          className="ml-2"
          style={{ backgroundColor: "#ff6e00", color: "white" }}
        >
          Ver detalhes
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
