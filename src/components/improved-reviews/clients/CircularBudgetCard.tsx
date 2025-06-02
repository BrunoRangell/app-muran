
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BadgeDollarSign, Calendar, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateBr } from "@/utils/dateFormatter";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CircularBudgetCardProps {
  client: any;
  platform?: "meta" | "google";
}

export function CircularBudgetCard({ client, platform = "meta" }: CircularBudgetCardProps) {
  const { toast } = useToast();
  const { reviewClient, processingIds } = useBatchOperations({
    platform: platform as "meta" | "google"
  });
  
  const isProcessing = processingIds.includes(client.id);
  
  // Preparar dados para exibição
  const companyName = client.company_name;
  const spentAmount = client.review?.[`${platform}_total_spent`] || 0;
  const budgetAmount = client.budget_amount || 0;
  const originalBudgetAmount = client.original_budget_amount || budgetAmount;
  const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const needsAdjustment = client.needsAdjustment;
  const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
  const remainingDays = client.budgetCalculation?.remainingDays || 0;
  const idealDailyBudget = client.budgetCalculation?.idealDailyBudget || 0;
  const currentDailyBudget = client.review?.[`${platform}_daily_budget_current`] || 0;
  const isUsingCustomBudget = client.isUsingCustomBudget || false;
  const customBudget = client.customBudget;
  
  // Determinar cor e status baseado na porcentagem e necessidade de ajuste
  const getStatusInfo = () => {
    if (needsAdjustment) {
      if (spentPercentage > 85) {
        return {
          color: "stroke-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-600",
          status: "Diminuir orçamento",
          statusColor: "text-red-600"
        };
      } else {
        return {
          color: "stroke-amber-500",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-600",
          status: budgetDifference > 0 ? "Aumentar orçamento" : "Ajustar orçamento",
          statusColor: "text-amber-600"
        };
      }
    } else {
      if (spentPercentage < 50) {
        return {
          color: "stroke-emerald-500",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          textColor: "text-emerald-600",
          status: "Sem ação necessária",
          statusColor: "text-emerald-600"
        };
      } else {
        return {
          color: "stroke-blue-500",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-600",
          status: "Monitorar",
          statusColor: "text-blue-600"
        };
      }
    }
  };
  
  const statusInfo = getStatusInfo();
  
  // Determinar tipo de orçamento
  const getBudgetType = () => {
    if (isUsingCustomBudget) return "Orçamento personalizado";
    if (remainingDays <= 7) return "Orçamento final";
    if (spentPercentage > 80) return "Orçamento crítico";
    return "Orçamento total";
  };
  
  const handleReviewClick = async () => {
    try {
      await reviewClient(client.id, client[`${platform}_account_id`]);
      toast({
        title: "Análise completa",
        description: `O orçamento de ${client.company_name} foi analisado com sucesso.`
      });
    } catch (error: any) {
      toast({
        title: "Erro na análise",
        description: error.message || "Ocorreu um erro ao analisar o cliente",
        variant: "destructive"
      });
    }
  };
  
  // Calcular coordenadas do círculo
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (spentPercentage / 100) * circumference;
  
  return (
    <Card className={`w-full max-w-sm ${statusInfo.bgColor} ${statusInfo.borderColor} border-2 transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        {/* Header com nome e tipo */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
            {companyName}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-600">{getBudgetType()}</p>
            <div className="flex items-center gap-1">
              {isUsingCustomBudget && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeDollarSign className="h-3 w-3 text-[#ff6e00]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="p-2">
                        <p className="font-medium">Orçamento Personalizado</p>
                        {customBudget && (
                          <p className="text-sm">
                            {formatDateBr(customBudget.start_date)} a {formatDateBr(customBudget.end_date)}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {needsAdjustment && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ajuste de orçamento recomendado</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          {/* Valor total e informações à esquerda */}
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-900 mb-2">
              {formatCurrency(budgetAmount)}
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Gasto atual:</span>
                <span className="font-medium">{formatCurrency(spentAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Diário atual:</span>
                <span className="font-medium">{formatCurrency(currentDailyBudget)}</span>
              </div>
              {idealDailyBudget !== currentDailyBudget && (
                <div className="flex justify-between">
                  <span>Diário ideal:</span>
                  <span className="font-medium">{formatCurrency(idealDailyBudget)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico circular no centro */}
          <div className="relative w-24 h-24 mx-4">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Círculo de fundo */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-gray-200"
              />
              {/* Círculo de progresso */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className={statusInfo.color}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: "stroke-dashoffset 0.5s ease-in-out",
                }}
              />
            </svg>
            {/* Texto central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${statusInfo.textColor}`}>
                {Math.round(spentPercentage)}%
              </span>
            </div>
          </div>

          {/* Informações à direita */}
          <div className="flex-1 text-right">
            <div className="space-y-1 text-xs text-gray-600">
              <div>
                <span className="block font-medium text-gray-800">
                  {remainingDays} dias restantes
                </span>
              </div>
              
              {/* Mostrar média para Google Ads */}
              {platform === "google" && client.lastFiveDaysAvg && (
                <div>
                  <span className="block">Média 5 dias:</span>
                  <span className="font-medium">{formatCurrency(client.lastFiveDaysAvg)}</span>
                </div>
              )}
              
              {/* Recomendação de ajuste */}
              {needsAdjustment && budgetDifference !== 0 && (
                <div className={`font-medium ${statusInfo.statusColor}`}>
                  {budgetDifference > 0 ? "+" : ""}{formatCurrency(Math.abs(budgetDifference))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status e botão */}
        <div className="space-y-2">
          <div className="text-center">
            <Badge 
              variant="outline" 
              className={`${statusInfo.borderColor} ${statusInfo.statusColor} text-xs`}
            >
              {statusInfo.status}
            </Badge>
          </div>
          
          <Button 
            className="w-full bg-[#321e32] hover:bg-[#321e32]/90 text-white"
            onClick={handleReviewClick}
            disabled={isProcessing}
          >
            {isProcessing ? "Processando..." : "Analisar"}
            {!isProcessing && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
