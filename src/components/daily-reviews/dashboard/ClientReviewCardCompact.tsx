
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, RotateCw } from "lucide-react";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientReviewCardCompactProps {
  client: ClientWithReview;
  onReviewClient: (clientId: string) => void;
  isProcessing: boolean;
  compact?: boolean;
  inactive?: boolean;
  onViewDetails?: (clientId: string) => void;
}

export const ClientReviewCardCompact = ({
  client,
  onReviewClient,
  isProcessing,
  compact = false,
  inactive = false,
  onViewDetails
}: ClientReviewCardCompactProps) => {
  const {
    hasReview,
    monthlyBudget,
    totalSpent,
    idealDailyBudget,
    currentDailyBudget,
    budgetDifference
  } = useClientBudgetCalculation(client);

  // Verificar se o orçamento precisa de ajuste
  const needsAdjustment = Math.abs(budgetDifference) >= 5;
  
  // Formatar data da última revisão
  const lastReviewDate = client.lastReview?.review_date 
    ? formatDistanceToNow(new Date(client.lastReview.review_date), { 
        addSuffix: true,
        locale: ptBR
      }) 
    : null;

  return (
    <Card className={`overflow-hidden border ${inactive ? 'bg-gray-50 border-dashed' : ''} ${needsAdjustment && !inactive ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className={`p-4 ${compact ? 'pb-2' : ''}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm md:text-base line-clamp-1">{client.company_name}</h3>
            {lastReviewDate && (
              <p className="text-xs text-gray-500">Revisão: {lastReviewDate}</p>
            )}
            {!hasReview && !inactive && (
              <p className="text-xs text-orange-500">Sem revisão</p>
            )}
            {inactive && (
              <p className="text-xs text-gray-500">Sem ID Meta configurado</p>
            )}
          </div>
          {needsAdjustment && !inactive && (
            <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
              Ajuste necessário
            </div>
          )}
        </div>
        
        {!compact && !inactive && (
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Orçamento Mensal</p>
              <p className="font-medium">{monthlyBudget ? `R$ ${monthlyBudget.toFixed(2)}` : '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Gasto Total</p>
              <p className="font-medium">{totalSpent ? `R$ ${totalSpent.toFixed(2)}` : '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Diário Atual</p>
              <p className="font-medium">{currentDailyBudget ? `R$ ${currentDailyBudget.toFixed(2)}` : '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Diário Ideal</p>
              <p className={`font-medium ${needsAdjustment ? 'text-amber-600' : ''}`}>
                {idealDailyBudget ? `R$ ${idealDailyBudget.toFixed(2)}` : '-'}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-0 border-t flex gap-1">
        <Button 
          onClick={() => onReviewClient(client.id)} 
          variant="ghost" 
          className="rounded-none flex-1 h-10 text-xs"
          disabled={isProcessing || inactive}
        >
          {isProcessing ? (
            <>
              <RotateCw className="h-4 w-4 mr-1 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <RotateCw className="h-4 w-4 mr-1" />
              Analisar
            </>
          )}
        </Button>
        
        {onViewDetails && (
          <Button 
            onClick={() => onViewDetails(client.id)}
            variant="ghost" 
            className="rounded-none flex-1 h-10 text-xs"
            disabled={inactive}
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
