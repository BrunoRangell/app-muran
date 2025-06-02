
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BadgeDollarSign, Calendar, ChevronRight, TrendingUp, Clock } from "lucide-react";
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
          borderColor: "border-l-red-500",
          gradientColor: "from-red-50 to-red-25",
          textColor: "text-red-600",
          bgColor: "bg-red-50",
          status: "Diminuir orçamento",
          statusColor: "text-red-600",
          statusBg: "bg-red-100 border-red-200"
        };
      } else {
        return {
          color: "stroke-amber-500",
          borderColor: "border-l-amber-500",
          gradientColor: "from-amber-50 to-yellow-25",
          textColor: "text-amber-600",
          bgColor: "bg-amber-50",
          status: budgetDifference > 0 ? "Aumentar orçamento" : "Ajustar orçamento",
          statusColor: "text-amber-700",
          statusBg: "bg-amber-100 border-amber-200"
        };
      }
    } else {
      if (spentPercentage < 50) {
        return {
          color: "stroke-emerald-500",
          borderColor: "border-l-emerald-500",
          gradientColor: "from-emerald-50 to-green-25",
          textColor: "text-emerald-600",
          bgColor: "bg-emerald-50",
          status: "Sem ação necessária",
          statusColor: "text-emerald-700",
          statusBg: "bg-emerald-100 border-emerald-200"
        };
      } else {
        return {
          color: "stroke-blue-500",
          borderColor: "border-l-blue-500",
          gradientColor: "from-blue-50 to-cyan-25",
          textColor: "text-blue-600",
          bgColor: "bg-blue-50",
          status: "Monitorar",
          statusColor: "text-blue-700",
          statusBg: "bg-blue-100 border-blue-200"
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
    return "Orçamento mensal";
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
    <Card className={`group w-full max-w-sm bg-white hover:shadow-xl transition-all duration-300 border-l-4 ${statusInfo.borderColor} hover:scale-[1.02] overflow-hidden`}>
      <CardContent className="p-6">
        {/* Header refinado */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 pr-3">
            <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 group-hover:text-[#321e32] transition-colors">
              {companyName}
            </h3>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor} border border-opacity-30`}>
                {getBudgetType()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            {isUsingCustomBudget && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-2 rounded-full bg-[#ff6e00] bg-opacity-10 hover:bg-opacity-20 transition-colors">
                      <BadgeDollarSign className="h-4 w-4 text-[#ff6e00]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="p-2">
                      <p className="font-medium text-sm">Orçamento Personalizado</p>
                      {customBudget && (
                        <p className="text-xs text-gray-600 mt-1">
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
                    <div className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-sm">Ajuste de orçamento recomendado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Layout principal com informações organizadas */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center mb-6">
          {/* Coluna 1: Informações de orçamento */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Orçamento Total</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(budgetAmount)}</p>
              <p className="text-sm text-gray-600">Gasto: <span className="font-semibold">{formatCurrency(spentAmount)}</span></p>
            </div>
          </div>

          {/* Coluna 2: Gráfico circular aprimorado */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Círculo de fundo com gradiente sutil */}
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
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    }}
                  />
                </svg>
                {/* Texto central aprimorado */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-lg font-bold ${statusInfo.textColor}`}>
                    {Math.round(spentPercentage)}%
                  </span>
                  <span className="text-xs text-gray-500 font-medium">usado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 3: Métricas à direita */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tempo Restante</p>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-1">{remainingDays} dias</p>
              <p className="text-sm text-gray-600">
                Diário: <span className="font-semibold">{formatCurrency(currentDailyBudget)}</span>
              </p>
            </div>
            
            {/* Mostrar informação adicional se relevante */}
            {platform === "google" && client.lastFiveDaysAvg ? (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs font-medium text-blue-700 mb-1">Média 5 dias</p>
                <p className="text-sm font-bold text-blue-800">{formatCurrency(client.lastFiveDaysAvg)}</p>
              </div>
            ) : idealDailyBudget !== currentDailyBudget ? (
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <p className="text-xs font-medium text-indigo-700 mb-1">Diário ideal</p>
                <p className="text-sm font-bold text-indigo-800">{formatCurrency(idealDailyBudget)}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Recomendação de ajuste aprimorada */}
        {needsAdjustment && budgetDifference !== 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#ff6e00] bg-opacity-10">
                  <TrendingUp className="h-4 w-4 text-[#ff6e00]" />
                </div>
                <span className="text-sm font-medium text-gray-700">Ajuste recomendado:</span>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${statusInfo.statusColor}`}>
                  {budgetDifference > 0 ? "+" : ""}{formatCurrency(Math.abs(budgetDifference))}
                </span>
                <p className="text-xs text-gray-500">para otimizar</p>
              </div>
            </div>
          </div>
        )}

        {/* Status e botão aprimorados */}
        <div className="space-y-4">
          <div className="text-center">
            <Badge 
              variant="outline" 
              className={`${statusInfo.statusBg} ${statusInfo.statusColor} text-sm px-4 py-2 font-medium border shadow-sm`}
            >
              {statusInfo.status}
            </Badge>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-[#321e32] to-[#321e32]/90 hover:from-[#321e32]/90 hover:to-[#321e32]/80 text-white font-medium py-3 shadow-lg hover:shadow-xl transition-all duration-300 group"
            onClick={handleReviewClick}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Analisar Cliente
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
