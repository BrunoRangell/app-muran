
import { Button } from "@/components/ui/button";
import { Loader, TrendingUp, TrendingDown, BadgeDollarSign, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ClientAltCardProps {
  client: ClientWithReview;
  onReviewClient: (clientId: string) => void;
  isProcessing: boolean;
}

export const ClientAltCard = ({ 
  client, 
  onReviewClient,
  isProcessing 
}: ClientAltCardProps) => {
  // Usar o hook personalizado para cálculos de orçamento
  const {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    // Informações sobre orçamento personalizado
    customBudget,
    isUsingCustomBudgetInReview
  } = useClientBudgetCalculation(client);

  // Flag para mostrar recomendação de orçamento - Apenas para clientes com revisão e diferença significativa
  const showRecommendation = hasReview && Math.abs(budgetDifference) >= 5;
  const needsIncrease = budgetDifference > 0;
  
  const lastReviewDate = client.lastReview?.updated_at;

  return (
    <tr className={`hover:bg-gray-50 ${
      showRecommendation ? 'border-l-4 border-l-amber-500' : ''
    }`}>
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900 flex items-center gap-1">
          {client.company_name}
          {customBudget && isUsingCustomBudgetInReview && (
            <BadgeDollarSign size={16} className="text-[#ff6e00]" />
          )}
        </div>
        {lastReviewDate && (
          <div className="text-sm text-gray-500">
            Última revisão: {formatDateInBrasiliaTz(lastReviewDate, "dd/MM 'às' HH:mm")}
          </div>
        )}
        {customBudget && isUsingCustomBudgetInReview && (
          <div className="mt-1">
            <Badge className="bg-[#ff6e00]/10 text-[#ff6e00] hover:bg-[#ff6e00]/20 border-none">
              Orçamento personalizado ativo
            </Badge>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="font-medium">{formatCurrency(monthlyBudget)}</div>
      </td>
      <td className="px-6 py-4">
        {isCalculating ? (
          <span className="text-gray-400 flex items-center">
            <Loader size={14} className="animate-spin mr-2" /> Calculando...
          </span>
        ) : calculationError ? (
          <span className="text-red-500 text-sm">Erro ao calcular</span>
        ) : (
          <div className="font-medium">{formatCurrency(totalSpent)}</div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="font-medium">
          {hasReview && currentDailyBudget 
            ? formatCurrency(currentDailyBudget) 
            : "Não disponível"}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="font-medium">
            {idealDailyBudget > 0 
              ? formatCurrency(idealDailyBudget) 
              : "Não disponível"}
          </div>
          
          {showRecommendation && (
            <Badge className={`flex items-center ${needsIncrease ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {needsIncrease ? (
                <TrendingUp size={14} className="mr-1" />
              ) : (
                <TrendingDown size={14} className="mr-1" />
              )}
              {needsIncrease ? "Aumentar" : "Diminuir"} {formatCurrency(Math.abs(budgetDifference))}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          {customBudget && isUsingCustomBudgetInReview && (
            <Link to="/revisao-meta?tab=custom-budgets">
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#ff6e00] text-[#ff6e00] hover:bg-[#ff6e00]/10"
              >
                <ExternalLink size={14} className="mr-1" />
                Orçamentos
              </Button>
            </Link>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onReviewClient(client.id)}
            disabled={isProcessing}
            className="w-full"
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
        </div>
      </td>
    </tr>
  );
};
