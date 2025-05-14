
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { 
  BarChart, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  MinusCircle,
  Info
} from "lucide-react";
import { ReviewHistoryTable } from "./ReviewHistoryTable";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { Tooltip } from "@/components/ui/tooltip";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientDetailsContentProps {
  client: any;
  latestReview: any;
  reviewHistory: any[] | null;
  recommendation: string | null;
  recommendationAverage: string | null;
  idealDailyBudget: number;
  suggestedBudgetChange: number;
  suggestedBudgetChangeAverage: number;
  lastFiveDaysAverage: number;
  isLoadingHistory: boolean;
  onRefresh: () => void;
  // Parâmetros para mostrar detalhes do cálculo
  remainingDays?: number;
  remainingBudget?: number;
  monthlyBudget?: number;
  totalSpent?: number;
}

export const ClientDetailsContent = ({
  client,
  latestReview,
  reviewHistory,
  recommendation,
  recommendationAverage,
  idealDailyBudget,
  suggestedBudgetChange,
  suggestedBudgetChangeAverage,
  lastFiveDaysAverage,
  isLoadingHistory,
  onRefresh,
  remainingDays,
  remainingBudget,
  monthlyBudget,
  totalSpent
}: ClientDetailsContentProps) => {
  const getLastReviewDate = () => {
    if (!latestReview || !latestReview.review_date) return "Sem revisão recente";
    
    return formatDateInBrasiliaTz(
      latestReview.review_date,
      "dd 'de' MMMM 'às' HH:mm"
    );
  };

  const getRecommendationIcon = (rec: string | null) => {
    if (!rec) return <MinusCircle className="text-gray-500" size={18} />;
    
    if (rec.includes("Aumentar")) {
      return <TrendingUp className="text-green-500" size={18} />;
    } else if (rec.includes("Diminuir")) {
      return <TrendingDown className="text-red-500" size={18} />;
    } else {
      return <MinusCircle className="text-gray-500" size={18} />;
    }
  };

  const getRecommendationColorClass = (rec: string | null) => {
    if (!rec) return "text-gray-600";
    
    if (rec.includes("Aumentar")) {
      return "text-green-600";
    } else if (rec.includes("Diminuir")) {
      return "text-red-600";
    }
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="text-muran-primary" size={18} />
              Status da Revisão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 mb-2">
              {getLastReviewDate()}
            </div>
            
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Recomendação:</div>
              <div className={`flex items-center gap-1 ${getRecommendationColorClass(recommendation)} font-medium`}>
                {getRecommendationIcon(recommendation)}
                {recommendation || "Nenhum ajuste necessário"}
                {recommendation && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info size={14} className="text-gray-500 cursor-help ml-1" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Recomendação baseada no orçamento diário atual configurado nas campanhas.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              {lastFiveDaysAverage > 0 && recommendationAverage && (
                <div className={`flex items-center gap-1 mt-2 ${getRecommendationColorClass(recommendationAverage)} font-medium`}>
                  {getRecommendationIcon(recommendationAverage)}
                  {recommendationAverage || "Nenhum ajuste necessário"}
                  {recommendationAverage && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={14} className="text-gray-500 cursor-help ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Recomendação baseada na média de gasto dos últimos 5 dias: {formatCurrency(lastFiveDaysAverage)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart className="text-muran-primary" size={18} />
              Orçamento Meta Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-sm font-medium mb-1">Orçamento Mensal:</div>
              <div className="text-xl font-semibold">
                {formatCurrency(client.meta_ads_budget || 0)}
              </div>
            </div>
            
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Orç. diário atual:</div>
              <div className="text-xl font-semibold">
                {latestReview?.google_daily_budget_current 
                  ? formatCurrency(latestReview.google_daily_budget_current)
                  : "Não configurado"}
              </div>
            </div>

            {lastFiveDaysAverage > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Média últimos 5 dias:</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(lastFiveDaysAverage)}
                </div>
              </div>
            )}

            {totalSpent !== undefined && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Total Gasto no Mês:</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(totalSpent)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="text-muran-primary" size={18} />
              Orçamento Sugerido
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={16} className="text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-4">
                    <div className="space-y-2">
                      <p className="font-semibold">Cálculo do orçamento diário ideal:</p>
                      <div className="text-sm space-y-1">
                        <p>Orçamento mensal: {formatCurrency(monthlyBudget || 0)}</p>
                        <p>Total gasto no mês até agora: {formatCurrency(totalSpent || 0)}</p>
                        <p>Orçamento restante: {formatCurrency(remainingBudget || 0)}</p>
                        <p>Dias restantes no mês: {remainingDays || 0}</p>
                        <p className="font-medium">Fórmula: Orçamento restante ÷ Dias restantes</p>
                        <p className="font-medium">
                          {formatCurrency(remainingBudget || 0)} ÷ {remainingDays || 0} = {formatCurrency(idealDailyBudget)}
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-sm font-medium mb-1">Orç. diário ideal:</div>
              <div className="text-xl font-semibold">
                {formatCurrency(idealDailyBudget)}
              </div>
            </div>
            
            {suggestedBudgetChange !== 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Ajuste Sugerido (orç. diário):</div>
                <div className={`flex items-center gap-1 text-lg font-semibold ${suggestedBudgetChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {suggestedBudgetChange > 0 ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  {suggestedBudgetChange > 0 ? '+' : ''}
                  {formatCurrency(Math.abs(suggestedBudgetChange))}
                </div>
              </div>
            )}

            {lastFiveDaysAverage > 0 && suggestedBudgetChangeAverage !== 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Ajuste Sugerido (últ. 5 dias):</div>
                <div className={`flex items-center gap-1 text-lg font-semibold ${suggestedBudgetChangeAverage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {suggestedBudgetChangeAverage > 0 ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  {suggestedBudgetChangeAverage > 0 ? '+' : ''}
                  {formatCurrency(Math.abs(suggestedBudgetChangeAverage))}
                </div>
              </div>
            )}

            {remainingDays !== undefined && remainingBudget !== undefined && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
                <p className="font-medium mb-1">Detalhes do cálculo:</p>
                <p>Orçamento restante: {formatCurrency(remainingBudget)}</p>
                <p>Dias restantes: {remainingDays}</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(remainingBudget)} ÷ {remainingDays} = {formatCurrency(idealDailyBudget)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ReviewHistoryTable 
        isLoading={isLoadingHistory} 
        reviewHistory={reviewHistory} 
      />
    </div>
  );
};
