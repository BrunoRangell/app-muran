
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, BadgeDollarSign, Building2, Calendar, ChevronRight, Clock } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateBr } from "@/utils/dateFormatter";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CircularBudgetCardProps {
  client: any;
  platform?: "meta" | "google";
}

export function CircularBudgetCard({ client, platform = "meta" }: CircularBudgetCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const { reviewClient, processingIds } = useBatchOperations({
    platform: platform as "meta" | "google"
  });
  
  const isProcessing = processingIds.includes(client.id);
  
  // Preparar dados para exibição
  const accountName = client[`${platform}_account_name`] || "Conta Principal";
  const spentAmount = client.review?.[`${platform}_total_spent`] || 0;
  const budgetAmount = client.budget_amount || 0;
  const originalBudgetAmount = client.original_budget_amount || budgetAmount;
  const spentPercentage = budgetAmount > 0 ? Math.min((spentAmount / budgetAmount) * 100, 100) : 0;
  const needsAdjustment = client.needsAdjustment;
  const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
  const isUsingCustomBudget = client.isUsingCustomBudget || false;
  const remainingDays = client.budgetCalculation?.remainingDays || 0;
  
  // Dados do orçamento personalizado
  const customBudget = client.customBudget;
  
  // Determinar cor do card baseado no status
  const getCardColor = () => {
    if (isUsingCustomBudget) return "border-[#ff6e00]";
    if (needsAdjustment) return "border-amber-500";
    if (spentPercentage > 90) return "border-red-500";
    if (spentPercentage > 70) return "border-orange-500";
    return "border-emerald-500";
  };

  const getProgressColor = () => {
    if (spentPercentage > 90) return "#ef4444";
    if (spentPercentage > 70) return "#f59e0b";
    return "#10b981";
  };

  // Criar o SVG do círculo de progresso
  const CircularProgress = ({ percentage, color }: { percentage: number; color: string }) => {
    const radius = 60;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Círculo de fundo */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Círculo de progresso */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        {/* Conteúdo central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(percentage)}%
          </div>
          <div className="text-xs text-gray-500">
            utilizado
          </div>
        </div>
      </div>
    );
  };

  const handleReviewClick = async () => {
    try {
      await reviewClient(client.id, client[`${platform}_account_id`]);
      toast({
        title: "Revisão completa",
        description: `O orçamento de ${client.company_name} foi revisado com sucesso.`
      });
    } catch (error: any) {
      toast({
        title: "Erro na revisão",
        description: error.message || "Ocorreu um erro ao revisar o cliente",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${getCardColor()} border-2`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-1 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#ff6e00]" />
              {client.company_name}
            </h3>
            <p className="text-sm text-gray-500">{accountName}</p>
          </div>
          <div className="flex items-center gap-2">
            {isUsingCustomBudget && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <BadgeDollarSign className="h-5 w-5 text-[#ff6e00]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="p-2">
                      <p className="font-medium">Orçamento Personalizado Ativo</p>
                      <p className="text-sm">
                        Período: {formatDateBr(customBudget?.start_date)} a {formatDateBr(customBudget?.end_date)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {needsAdjustment && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="p-2">Ajuste de orçamento recomendado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Gráfico circular central */}
        <CircularProgress 
          percentage={spentPercentage} 
          color={getProgressColor()}
        />
        
        {/* Informações principais */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Orçamento</div>
            <div className="font-semibold text-lg">
              {formatCurrency(budgetAmount)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Gasto</div>
            <div className="font-semibold text-lg">
              {formatCurrency(spentAmount)}
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Dias restantes:</span>
            <span className="font-medium">{remainingDays}</span>
          </div>
          <div className="text-right">
            <div className="text-gray-500">Diário atual</div>
            <div className="font-medium">
              {formatCurrency(client.review?.[`${platform}_daily_budget_current`] || 0)}
            </div>
          </div>
        </div>

        {/* Recomendação de ajuste */}
        {needsAdjustment && budgetDifference !== 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {budgetDifference > 0 ? "Aumentar" : "Reduzir"} orçamento
              </span>
            </div>
            <div className="text-sm text-amber-600 mt-1">
              {formatCurrency(Math.abs(budgetDifference))}
            </div>
          </div>
        )}
        
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Orçamento diário ideal:</span>
                <div className="font-medium">{formatCurrency(client.budgetCalculation?.idealDailyBudget || 0)}</div>
              </div>
              
              {platform === "google" && (
                <div>
                  <span className="text-gray-500">Média (5 dias):</span>
                  <div className="font-medium">{formatCurrency(client.lastFiveDaysAvg || 0)}</div>
                </div>
              )}
            </div>
            
            {isUsingCustomBudget && customBudget && (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <BadgeDollarSign className="h-4 w-4 text-[#ff6e00]" />
                  <span className="font-medium text-[#ff6e00]">Orçamento Personalizado</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Período:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      {formatDateBr(customBudget.start_date)} a {formatDateBr(customBudget.end_date)}
                    </span>
                  </div>
                  {originalBudgetAmount !== budgetAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Orçamento padrão:</span>
                      <span className="font-medium">{formatCurrency(originalBudgetAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs"
        >
          {expanded ? "Menos detalhes" : "Mais detalhes"}
        </Button>
        
        <Button 
          variant="default"
          size="sm"
          className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
          onClick={handleReviewClick}
          disabled={isProcessing}
        >
          {isProcessing ? "Processando..." : "Analisar"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
