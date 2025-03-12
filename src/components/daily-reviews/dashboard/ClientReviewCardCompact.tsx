
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { 
  Loader, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  MinusCircle, 
  Calendar, 
  BadgeDollarSign 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientReviewCardCompactProps {
  client: ClientWithReview;
  onReviewClient: (clientId: string) => void;
  isProcessing: boolean;
  compact?: boolean;
  inactive?: boolean;
}

export const ClientReviewCardCompact = ({ 
  client, 
  onReviewClient,
  isProcessing,
  compact = false,
  inactive = false
}: ClientReviewCardCompactProps) => {
  const {
    hasReview,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    // Informações sobre orçamento personalizado
    customBudget,
    isUsingCustomBudgetInReview,
    actualBudgetAmount
  } = useClientBudgetCalculation(client);

  // Flag para mostrar recomendação de orçamento
  const showRecommendation = Math.abs(budgetDifference) >= 5;
  const needsIncrease = budgetDifference > 0;
  const lastReviewDate = client.lastReview?.updated_at;

  // Formatar datas do orçamento personalizado
  const formatCustomBudgetDates = () => {
    if (!customBudget) return "";
    
    const startDate = new Date(customBudget.start_date);
    const endDate = new Date(customBudget.end_date);
    
    const formatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
    const start = startDate.toLocaleDateString('pt-BR', formatOptions);
    const end = endDate.toLocaleDateString('pt-BR', formatOptions);
    
    return `${start} até ${end}`;
  };

  // Determinar classes de estilo com base no status
  const cardClasses = `overflow-hidden transition-all ${
    inactive ? 'opacity-60 hover:opacity-80' : ''
  } ${
    hasReview && !inactive && showRecommendation
      ? 'border-l-4 border-l-amber-500' 
      : customBudget && isUsingCustomBudgetInReview
        ? 'border-l-4 border-l-muran-primary'
        : compact ? 'border' : 'border shadow-sm hover:shadow'
  }`;

  // Grid Compacto (Tabela)
  if (compact) {
    return (
      <Card className={`${cardClasses} flex items-center`}>
        <div className="flex-1 p-3">
          <div className="font-medium text-muran-dark flex items-center gap-1">
            {client.company_name}
            {customBudget && isUsingCustomBudgetInReview && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BadgeDollarSign size={16} className="text-muran-primary" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="text-xs space-y-1">
                      <p className="font-semibold">Orçamento Personalizado</p>
                      <p>{formatCurrency(customBudget.budget_amount)}</p>
                      <p className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatCustomBudgetDates()}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {lastReviewDate ? formatDateInBrasiliaTz(lastReviewDate, "dd/MM 'às' HH:mm") : "Sem revisão"}
          </div>
        </div>
        
        <div className="flex-1 p-3 border-l">
          <div className="text-xs text-gray-500">Orçamento</div>
          <div className="flex items-center gap-1">
            {formatCurrency(actualBudgetAmount)}
            {customBudget && isUsingCustomBudgetInReview && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BadgeDollarSign size={12} className="text-muran-primary cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Orçamento personalizado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        <div className="flex-1 p-3 border-l">
          <div className="text-xs text-gray-500">Orç. diário atual / ideal</div>
          <div className="flex items-center gap-1">
            <span>{hasReview ? formatCurrency(currentDailyBudget) : "-"}</span>
            <span>/</span>
            <span>{formatCurrency(idealDailyBudget)}</span>
          </div>
        </div>
        
        {hasReview && !inactive && (
          <div className={`p-3 flex items-center border-l ${
            showRecommendation 
              ? needsIncrease 
                ? 'text-green-600' 
                : 'text-red-600'
              : 'text-gray-600'
          }`}>
            {showRecommendation 
              ? needsIncrease 
                ? <TrendingUp size={18} /> 
                : <TrendingDown size={18} />
              : <MinusCircle size={18} />
            }
            <span className="ml-1 font-medium">
              {showRecommendation
                ? `${needsIncrease ? "+" : "-"}${formatCurrency(Math.abs(budgetDifference))}`
                : "Sem ajuste"
              }
            </span>
          </div>
        )}
        
        <div className="p-3 border-l">
          <Button 
            size="sm" 
            onClick={() => onReviewClient(client.id)}
            disabled={isProcessing || inactive}
            variant={inactive ? "outline" : "default"}
            className={inactive ? "bg-gray-100" : ""}
          >
            {isProcessing ? (
              <Loader className="animate-spin" size={14} />
            ) : inactive ? (
              <AlertTriangle size={14} />
            ) : (
              "Analisar"
            )}
          </Button>
        </div>
      </Card>
    );
  }
  
  // Grid de Cartões
  return (
    <Card className={cardClasses}>
      <CardContent className="p-4 pt-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-muran-dark flex items-center gap-1">
              {client.company_name}
              {customBudget && isUsingCustomBudgetInReview && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeDollarSign size={16} className="text-muran-primary" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="text-xs space-y-1">
                        <p className="font-semibold">Orçamento Personalizado</p>
                        <p>{formatCurrency(customBudget.budget_amount)}</p>
                        <p className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatCustomBudgetDates()}
                        </p>
                        {customBudget.description && (
                          <p className="italic">{customBudget.description}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </h3>
            <p className="text-xs text-gray-500">
              {lastReviewDate ? formatDateInBrasiliaTz(lastReviewDate, "dd/MM 'às' HH:mm") : "Sem revisão"}
            </p>
          </div>
          
          {inactive && (
            <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
              Sem Meta Ads
            </div>
          )}
          
          {calculationError && !inactive && (
            <div className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded flex items-center">
              <AlertTriangle size={12} className="mr-1" />
              Erro
            </div>
          )}
          
          {customBudget && isUsingCustomBudgetInReview && (
            <div className="bg-muran-primary/10 text-muran-primary text-xs px-2 py-1 rounded flex items-center">
              <BadgeDollarSign size={12} className="mr-1" />
              Personalizado
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Orçamento</div>
            <div className="font-medium flex items-center gap-1">
              {formatCurrency(actualBudgetAmount)}
              {customBudget && isUsingCustomBudgetInReview && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeDollarSign size={12} className="text-muran-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Orçamento personalizado</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Gasto</div>
            <div className="font-medium">{formatCurrency(totalSpent)}</div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Orç. diário atual</div>
            <div className="font-medium">
              {hasReview && currentDailyBudget !== null ? formatCurrency(currentDailyBudget) : "-"}
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Orç. diário ideal</div>
            <div className="font-medium">{formatCurrency(idealDailyBudget)}</div>
          </div>
        </div>
        
        {hasReview && !inactive && (
          <div className={`p-2 rounded flex items-center ${
            showRecommendation 
              ? needsIncrease 
                ? 'bg-green-50 text-green-600' 
                : 'bg-red-50 text-red-600'
              : 'bg-gray-50 text-gray-600'
          }`}>
            {showRecommendation 
              ? needsIncrease 
                ? <TrendingUp size={16} className="mr-1" /> 
                : <TrendingDown size={16} className="mr-1" />
              : <MinusCircle size={16} className="mr-1" />
            }
            <span className="text-sm font-medium">
              {showRecommendation
                ? `${needsIncrease ? "Aumentar" : "Diminuir"} ${formatCurrency(Math.abs(budgetDifference))}`
                : "Nenhum ajuste necessário"
              }
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-0 border-t bg-gray-50/50">
        <Button 
          variant={inactive ? "outline" : "default"}
          size="sm" 
          onClick={() => onReviewClient(client.id)}
          disabled={isProcessing || inactive}
          className={`w-full ${inactive ? "bg-gray-100" : ""}`}
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
      </CardFooter>
    </Card>
  );
};
