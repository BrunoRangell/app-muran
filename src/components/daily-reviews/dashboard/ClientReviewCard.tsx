
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { ArrowRight, TrendingDown, TrendingUp, Loader, AlertCircle } from "lucide-react";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { formatDateInBrasiliaTz } from "../summary/utils";
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
  const now = getCurrentDateInBrasiliaTz();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const remainingDaysValue = Math.ceil((lastDayOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
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

  // Calcular total gasto diretamente do Meta Ads API
  useEffect(() => {
    const calculateTotalSpent = async () => {
      if (!client.meta_account_id) {
        setCalculationError("Cliente sem ID de conta Meta configurado");
        setCalculationAttempted(true);
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

  const getFormattedReviewDate = () => {
    if (!hasReview) return "Sem revisão";
    
    try {
      // Usar review_date se created_at não estiver disponível
      const dateToFormat = client.lastReview.review_date;
      
      return formatDateInBrasiliaTz(
        new Date(dateToFormat), 
        "'Última revisão em' dd 'de' MMMM"
      );
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  return (
    <Card className={`overflow-hidden border ${Math.abs(budgetDifference) >= 5 ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-lg truncate text-gray-800">{client.company_name}</h3>
          {hasReview && (
            <span className="text-xs text-gray-500">
              {getFormattedReviewDate()}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Orçamento Mensal</div>
            <div className="text-base font-semibold">{formatCurrency(monthlyBudget)}</div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Custo Total (mês)</div>
            <div className="text-base font-semibold relative">
              {isCalculating ? (
                <span className="text-gray-400">Calculando...</span>
              ) : calculationError ? (
                <span className="text-red-500 text-sm">Erro ao calcular</span>
              ) : (
                formatCurrency(totalSpent)
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Orçamento Diário Atual</div>
            <div className="text-base font-semibold">
              {hasReview && client.lastReview?.meta_daily_budget_current !== null 
                ? formatCurrency(client.lastReview.meta_daily_budget_current) 
                : "Não disponível"}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Orçamento Diário Sugerido</div>
            <div className="text-base font-semibold">
              {idealDailyBudget > 0 
                ? formatCurrency(idealDailyBudget) 
                : "Não disponível"}
            </div>
          </div>
        </div>

        {Math.abs(budgetDifference) >= 5 && (
          <div className={`mt-2 p-3 rounded-lg ${budgetDifference > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className={`flex items-center gap-2 font-medium ${budgetDifference > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {budgetDifference > 0 ? (
                <TrendingUp size={18} />
              ) : (
                <TrendingDown size={18} />
              )}
              Ajuste recomendado: {budgetDifference > 0 ? 'Aumentar' : 'Diminuir'} {formatCurrency(Math.abs(budgetDifference))}
            </div>
          </div>
        )}

        {calculationError && (
          <div className="mt-2 p-2 bg-amber-50 rounded-lg flex items-center gap-2 text-xs text-amber-700">
            <AlertCircle size={14} />
            {calculationError}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onReviewClient(client.id)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader className="animate-spin mr-2" size={14} />
              Analisando...
            </>
          ) : (
            "Analisar"
          )}
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
