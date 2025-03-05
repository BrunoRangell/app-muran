
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { ArrowRight, TrendingDown, TrendingUp, MinusCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientWithReview } from "../hooks/useBatchReview";
import { formatInTimeZone } from "date-fns-tz";

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
  const hasReview = !!client.lastReview;
  
  const getRecommendationIcon = () => {
    if (!hasReview || !client.lastReview?.recommendation) return null;
    
    if (client.lastReview.recommendation.includes("Aumentar")) {
      return <TrendingUp className="text-green-500" size={16} />;
    } else if (client.lastReview.recommendation.includes("Diminuir")) {
      return <TrendingDown className="text-red-500" size={16} />;
    } else {
      return <MinusCircle className="text-gray-500" size={16} />;
    }
  };

  const getRecommendationColor = () => {
    if (!hasReview || !client.lastReview?.recommendation) return "";
    
    if (client.lastReview.recommendation.includes("Aumentar")) {
      return "text-green-600";
    } else if (client.lastReview.recommendation.includes("Diminuir")) {
      return "text-red-600";
    }
    return "text-gray-600";
  };

  // Verificar se há diferença significativa (R$ 5,00 ou mais)
  const hasSignificantDifference = () => {
    if (!hasReview || !client.lastReview?.meta_daily_budget_current || !client.lastReview?.idealDailyBudget) {
      return false;
    }
    
    const diff = Math.abs(client.lastReview.meta_daily_budget_current - client.lastReview.idealDailyBudget);
    return diff >= 5;
  };

  // Calcular a diferença entre o orçamento atual e o sugerido
  const getBudgetDifference = () => {
    if (!hasReview || !client.lastReview?.meta_daily_budget_current || !client.lastReview?.idealDailyBudget) {
      return 0;
    }
    
    return client.lastReview.idealDailyBudget - client.lastReview.meta_daily_budget_current;
  };

  // Formatar a data da revisão usando fuso horário de Brasília
  const getFormattedReviewDate = () => {
    if (!hasReview || !client.lastReview?.review_date) return "Sem revisão";
    
    try {
      return formatInTimeZone(
        new Date(client.lastReview.review_date), 
        'America/Sao_Paulo', 
        "dd/MM/yyyy HH:mm", 
        { locale: ptBR }
      );
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return format(new Date(client.lastReview.review_date), "dd/MM/yyyy", { locale: ptBR });
    }
  };

  // Formatação da mensagem de ajuste recomendado
  const getAdjustmentMessage = () => {
    const diff = getBudgetDifference();
    if (diff > 0) {
      return `Ajuste recomendado: Aumentar ${formatCurrency(Math.abs(diff))}`;
    } else if (diff < 0) {
      return `Ajuste recomendado: Diminuir ${formatCurrency(Math.abs(diff))}`;
    }
    return "";
  };

  return (
    <Card className={`overflow-hidden ${hasSignificantDifference() ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium truncate">{client.company_name}</h3>
          {hasReview && (
            <span className="text-xs text-gray-500">
              Revisão: {getFormattedReviewDate()}
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
              {hasReview && client.lastReview?.meta_daily_budget_current 
                ? formatCurrency(client.lastReview.meta_daily_budget_current) 
                : "Não disponível"}
            </div>
          </div>

          <div>
            <div className="text-gray-500">Orçamento Sugerido</div>
            <div>
              {hasReview && client.lastReview?.idealDailyBudget 
                ? formatCurrency(client.lastReview.idealDailyBudget) 
                : "Não disponível"}
            </div>
          </div>

          <div>
            <div className="text-gray-500">Recomendação</div>
            <div className={`flex items-center gap-1 ${getRecommendationColor()} font-medium`}>
              {getRecommendationIcon()}
              {hasReview && client.lastReview?.recommendation 
                ? client.lastReview.recommendation 
                : "Não disponível"}
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
        >
          Ver detalhes
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
