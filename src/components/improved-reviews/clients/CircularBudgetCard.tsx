
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BadgeDollarSign, Calendar, ChevronRight, Loader } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateBr } from "@/utils/dateFormatter";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IgnoreWarningButton } from "@/components/daily-reviews/dashboard/components/IgnoreWarningButton";

interface CircularBudgetCardProps {
  client: any;
  platform?: "meta" | "google";
  onIndividualReviewComplete?: () => void;
}

export function CircularBudgetCard({ 
  client, 
  platform = "meta", 
  onIndividualReviewComplete 
}: CircularBudgetCardProps) {
  const { toast } = useToast();
  const { reviewClient, processingIds } = useBatchOperations({
    platform: platform as "meta" | "google",
    onIndividualComplete: () => {
      console.log(`🔄 Revisão individual ${platform} concluída - callback do card`);
      if (onIndividualReviewComplete) {
        onIndividualReviewComplete();
      }
    }
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
  const isUsingCustomBudget = client.isUsingCustomBudget || false;
  const customBudget = client.customBudget;
  
  // Verificar se o aviso foi ignorado hoje (especialmente para Google Ads)
  const warningIgnoredToday = platform === "google" ? 
    client.budgetCalculation?.warningIgnoredToday || false : false;
  
  // NOVA MÉTRICA: Média Ponderada (só para Google Ads)
  const weightedAverage = client.weightedAverage || 0;
  
  // LOG de debugging para verificar se o botão deve aparecer
  console.log(`🔍 CircularBudgetCard DEBUG - ${companyName}:`, {
    platform,
    needsAdjustment,
    warningIgnoredToday,
    budgetDifference,
    weightedAverage,
    shouldShowButton: platform === "google" && needsAdjustment && !warningIgnoredToday
  });
  
  // Determinar cor e status baseado na porcentagem e necessidade de ajuste
  const getStatusInfo = () => {
    if (warningIgnoredToday) {
      return {
        color: "stroke-gray-400",
        borderColor: "border-gray-200",
        textColor: "text-gray-500",
        status: "Ajuste ocultado",
        statusColor: "text-gray-500"
      };
    }
    
    if (needsAdjustment) {
      if (spentPercentage > 85) {
        return {
          color: "stroke-red-500",
          borderColor: "border-red-200",
          textColor: "text-red-600",
          status: "Reduzir orçamento",
          statusColor: "text-red-600"
        };
      } else {
        return {
          color: "stroke-amber-500",
          borderColor: "border-amber-200",
          textColor: "text-amber-600",
          status: budgetDifference > 0 ? "Aumentar orçamento" : "Reduzir orçamento",
          statusColor: "text-amber-600"
        };
      }
    } else {
      if (spentPercentage < 50) {
        return {
          color: "stroke-emerald-500",
          borderColor: "border-emerald-200",
          textColor: "text-emerald-600",
          status: "Sem ação necessária",
          statusColor: "text-emerald-600"
        };
      } else {
        return {
          color: "stroke-blue-500",
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
    console.log(`🔍 Iniciando revisão individual para cliente ${client.company_name} (${platform})`);
    
    try {
      const accountId = platform === "meta" 
        ? client.meta_account_id 
        : client.google_account_id;
        
      await reviewClient(client.id, accountId);
      
      console.log(`✅ Revisão do cliente ${client.company_name} concluída com sucesso`);
      
    } catch (error: any) {
      console.error(`❌ Erro na revisão do cliente ${client.company_name}:`, error);
      toast({
        title: "Erro na análise",
        description: error.message || "Ocorreu um erro ao analisar o cliente",
        variant: "destructive"
      });
    }
  };

  const handleWarningIgnored = () => {
    console.log(`✅ Aviso ignorado para cliente ${client.company_name}`);
    if (onIndividualReviewComplete) {
      onIndividualReviewComplete();
    }
  };
  
  // Calcular coordenadas do círculo
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (spentPercentage / 100) * circumference;
  
  return (
    <Card className={`w-full max-w-sm bg-white ${statusInfo.borderColor} border-2 transition-all hover:shadow-md`}>
      <CardContent className="p-5">
        {/* Header com nome e ícones */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base line-clamp-1 mb-1">
              {companyName}
            </h3>
            <p className="text-sm text-gray-600">{getBudgetType()}</p>
          </div>
          
          <div className="flex items-center gap-2 ml-3">
            {isUsingCustomBudget && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BadgeDollarSign className="h-4 w-4 text-[#ff6e00]" />
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
            {needsAdjustment && !warningIgnoredToday && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ajuste de orçamento recomendado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* Botão "Ignorar aviso" - só para Google Ads com ajuste necessário */}
            {platform === "google" && needsAdjustment && !warningIgnoredToday && (
              <IgnoreWarningButton
                clientId={client.id}
                clientName={companyName}
                onWarningIgnored={handleWarningIgnored}
              />
            )}
          </div>
        </div>

        {/* Layout principal com informações organizadas */}
        <div className="grid grid-cols-3 gap-4 items-center mb-5">
          {/* Coluna 1: Orçamento e gasto */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Orçamento</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(budgetAmount)}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Gasto atual</p>
              <p className="text-sm font-semibold text-gray-700">{formatCurrency(spentAmount)}</p>
            </div>
          </div>

          {/* Coluna 2: Gráfico circular */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                {/* Círculo de fundo */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-200"
                />
                {/* Círculo de progresso */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
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
                <span className={`text-base font-bold ${statusInfo.textColor}`}>
                  {Math.round(spentPercentage)}%
                </span>
              </div>
            </div>
          </div>

          {/* Coluna 3: Informações à direita */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Restante</p>
              <p className="text-sm font-semibold text-gray-700">
                {remainingDays} dias
              </p>
            </div>
            
            {/* NOVA MÉTRICA: Mostrar Média Pond para Google Ads */}
            {platform === "google" && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Média Pond</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(weightedAverage)}
                </p>
              </div>
            )}
            
            {/* Mostrar diário ideal sempre que houver diferença da média ponderada (para Google) */}
            {platform === "google" && idealDailyBudget !== weightedAverage ? (
              <div>
                <p className="text-xs text-gray-500 mb-1">Diário ideal</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(idealDailyBudget)}
                </p>
              </div>
            ) : null}
            
            {/* Para Meta Ads, manter a lógica atual */}
            {platform === "meta" && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Diário atual</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(client.review?.meta_daily_budget_current || 0)}
                </p>
              </div>
            )}
            
            {platform === "meta" && idealDailyBudget !== (client.review?.meta_daily_budget_current || 0) ? (
              <div>
                <p className="text-xs text-gray-500 mb-1">Diário ideal</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(idealDailyBudget)}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Recomendação de ajuste (se houver e não foi ignorada) */}
        {needsAdjustment && budgetDifference !== 0 && !warningIgnoredToday && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50 border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ajuste recomendado:</span>
              <span className={`text-sm font-semibold ${statusInfo.statusColor}`}>
                {budgetDifference > 0 ? "+" : "-"}{formatCurrency(Math.abs(budgetDifference))}
              </span>
            </div>
          </div>
        )}

        {/* Status e botão */}
        <div className="space-y-3">
          <div className="text-center">
            <Badge 
              variant="outline" 
              className={`${statusInfo.borderColor} ${statusInfo.statusColor} text-xs px-3 py-1`}
            >
              {statusInfo.status}
            </Badge>
          </div>
          
          <Button 
            className="w-full bg-[#321e32] hover:bg-[#321e32]/90 text-white"
            onClick={handleReviewClick}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Analisar
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
