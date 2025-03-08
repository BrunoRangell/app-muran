
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { ArrowRight, TrendingDown, TrendingUp, MinusCircle, Info, AlertCircle } from "lucide-react";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { calculateIdealDailyBudget, generateRecommendation, getRemainingDaysInMonth } from "../summary/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "../hooks/useEdgeFunction";
import { getCurrentDateInBrasiliaTz } from "../summary/utils";

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
  const [calculatedTotalSpent, setCalculatedTotalSpent] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculationAttempted, setCalculationAttempted] = useState(false);
  
  // Verificar se o cliente tem uma revisão recente
  const hasReview = !!client.lastReview;
  
  // Obter dias restantes no mês atual
  const remainingDaysValue = getRemainingDaysInMonth();
  
  // Calcular valores para exibição
  const monthlyBudget = client.meta_ads_budget || 0;
  const totalSpentFromDB = hasReview ? (client.lastReview?.meta_total_spent || 0) : 0;
  const totalSpent = calculatedTotalSpent !== null ? calculatedTotalSpent : totalSpentFromDB;
  const remainingBudget = monthlyBudget - totalSpent;
  
  // Calcular o orçamento diário ideal com base no orçamento restante e dias restantes
  const idealDailyBudget = remainingDaysValue > 0 ? remainingBudget / remainingDaysValue : 0;

  // Verificar se o cliente tem valor de orçamento diário atual
  const currentDailyBudget = hasReview && client.lastReview?.meta_daily_budget_current !== null
    ? client.lastReview.meta_daily_budget_current
    : 0;

  // Gerar recomendação com base nos orçamentos
  const budgetDifference = idealDailyBudget - currentDailyBudget;
  const recommendation = budgetDifference > 5 
    ? `Aumentar o orçamento diário`
    : budgetDifference < -5 
      ? `Diminuir o orçamento diário`
      : "Manter o orçamento diário atual";

  // Calcular total gasto diretamente do Meta Ads API
  useEffect(() => {
    const calculateTotalSpent = async () => {
      if (!client.meta_account_id) {
        setCalculationError("Cliente sem ID de conta Meta configurado");
        return;
      }

      try {
        setIsCalculating(true);
        setCalculationError(null);
        
        // Obter token de acesso
        const accessToken = await getMetaAccessToken();
        
        if (!accessToken) {
          throw new Error("Token de acesso Meta não disponível");
        }
        
        // Preparar datas para o período (primeiro dia do mês até hoje)
        const now = getCurrentDateInBrasiliaTz();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const dateRange = {
          start: firstDayOfMonth.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
        
        console.log(`[ClientReviewCard] Calculando total gasto para ${client.company_name} no período: ${dateRange.start} até ${dateRange.end}`);
        
        // Chamar função de borda para obter insights
        const { data, error } = await supabase.functions.invoke("meta-budget-calculator", {
          body: {
            accountId: client.meta_account_id,
            accessToken,
            dateRange: dateRange,
            fetchSeparateInsights: true
          }
        });
        
        if (error) {
          console.error(`[ClientReviewCard] Erro ao calcular total gasto para ${client.company_name}:`, error);
          throw new Error(`Erro ao calcular total gasto: ${error.message}`);
        }
        
        if (!data) {
          throw new Error("Resposta vazia da API");
        }
        
        // Extrair o total gasto da resposta
        const metaTotalSpent = data.totalSpent || 0;
        
        console.log(`[ClientReviewCard] Total gasto calculado para ${client.company_name}: ${metaTotalSpent}`);
        
        setCalculatedTotalSpent(metaTotalSpent);
      } catch (error) {
        console.error(`[ClientReviewCard] Erro ao calcular total gasto para ${client.company_name}:`, error);
        setCalculationError(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setIsCalculating(false);
        setCalculationAttempted(true);
      }
    };
    
    // Calcular apenas quando o cartão é renderizado e não foi calculado anteriormente
    if (client.meta_account_id && !calculatedTotalSpent && !isCalculating && !calculationAttempted) {
      calculateTotalSpent();
    }
  }, [client, calculatedTotalSpent, isCalculating, calculationAttempted]);
  
  // Funções auxiliares para UI
  const getRecommendationIcon = () => {
    if (!hasReview) return null;
    
    if (budgetDifference > 5) {
      return <TrendingUp className="text-green-500" size={16} />;
    } else if (budgetDifference < -5) {
      return <TrendingDown className="text-red-500" size={16} />;
    } else {
      return <MinusCircle className="text-gray-500" size={16} />;
    }
  };

  const getRecommendationColor = () => {
    if (!hasReview) return "";
    
    if (budgetDifference > 5) {
      return "text-green-600";
    } else if (budgetDifference < -5) {
      return "text-red-600";
    }
    return "text-gray-600";
  };

  const hasSignificantDifference = () => {
    if (!hasReview) return false;
    return Math.abs(budgetDifference) >= 5;
  };

  const getFormattedReviewDate = () => {
    if (!hasReview) return "Sem revisão";
    
    try {
      // Usar review_date se created_at não estiver disponível
      const dateToFormat = client.lastReview.review_date;
      
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
    if (budgetDifference > 5) {
      return `Ajuste recomendado: Aumentar ${formatCurrency(Math.abs(budgetDifference))}`;
    } else if (budgetDifference < -5) {
      return `Ajuste recomendado: Diminuir ${formatCurrency(Math.abs(budgetDifference))}`;
    }
    return "";
  };

  // Renderizar tooltip de detalhes do cálculo
  const renderCalculationDetails = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info size={14} className="text-gray-400 hover:text-gray-600 cursor-help ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-md p-3">
          <div className="space-y-1 text-xs">
            <p><b>Cálculo do orçamento diário ideal:</b></p>
            <p>Orçamento mensal: {formatCurrency(monthlyBudget)}</p>
            <p>Total gasto: {formatCurrency(totalSpent)}</p>
            <p>Orçamento restante: {formatCurrency(remainingBudget)}</p>
            <p>Dias restantes no mês: {remainingDaysValue}</p>
            <p className="font-medium">Fórmula: Orçamento restante ÷ Dias restantes</p>
            <p className="font-medium">
              {formatCurrency(remainingBudget)} ÷ {remainingDaysValue} = {formatCurrency(idealDailyBudget)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  console.log("Dados do cálculo no card:", {
    clientId: client.id,
    clientName: client.company_name,
    monthlyBudget,
    totalSpentFromDB,
    calculatedTotalSpent,
    totalSpent,
    remainingBudget,
    remainingDaysValue,
    idealDailyBudget,
    currentDailyBudget,
    budgetDifference,
    calculationAttempted,
    isCalculating
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
            <div>{formatCurrency(monthlyBudget)}</div>
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
            <div className="text-gray-500 flex items-center">
              Orçamento Sugerido
              {renderCalculationDetails()}
            </div>
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
              <div className={`${budgetDifference > 0 ? 'text-green-600' : 'text-red-600'} text-sm font-medium`}>
                {getAdjustmentMessage()}
              </div>
            </div>
          )}

          {/* Detalhes do cálculo para visualização rápida */}
          <div className="col-span-2 mt-2 p-2 bg-gray-50 rounded text-xs">
            <div className="font-medium mb-1">Detalhes do cálculo:</div>
            <div className="flex flex-col space-y-1">
              <div>Orçamento mensal: {formatCurrency(monthlyBudget)}</div>
              <div className="flex items-start gap-1">
                <span>Total gasto:</span>
                <div>
                  <div>{formatCurrency(totalSpent)}
                  {isCalculating && <span className="text-gray-500 ml-1">(calculando...)</span>}
                  </div>
                  
                  {calculatedTotalSpent !== null && totalSpentFromDB !== calculatedTotalSpent && (
                    <div className="text-amber-600 flex items-center gap-1">
                      <AlertCircle size={10} />
                      <span>DB: {formatCurrency(totalSpentFromDB)}, API: {formatCurrency(calculatedTotalSpent)}</span>
                    </div>
                  )}
                  
                  {calculationError && (
                    <div className="text-red-500 text-xs">
                      Erro: {calculationError}
                    </div>
                  )}

                  {!isCalculating && !calculatedTotalSpent && calculationAttempted && (
                    <div className="text-amber-600 text-xs">
                      Não foi possível obter dados diretos da API Meta.
                    </div>
                  )}
                </div>
              </div>
              <div>Orçamento restante: {formatCurrency(remainingBudget)}</div>
              <div>Dias restantes: {remainingDaysValue}</div>
              <div className="font-medium pt-1">
                {formatCurrency(remainingBudget)} ÷ {remainingDaysValue} = {formatCurrency(idealDailyBudget)}
              </div>
            </div>
          </div>
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
