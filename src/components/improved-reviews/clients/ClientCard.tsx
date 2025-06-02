
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, BadgeDollarSign, Building2, Calendar, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDateBr } from "@/utils/dateFormatter";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CompactBudgetRecommendation } from "@/components/daily-reviews/dashboard/card-components/CompactBudgetRecommendation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClientCardProps {
  client: any;
  platform?: "meta" | "google";
}

export function ClientCard({ client, platform = "meta" }: ClientCardProps) {
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
  const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const needsAdjustment = client.needsAdjustment;
  const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
  const isUsingCustomBudget = client.isUsingCustomBudget || false;
  
  // Dados do orçamento personalizado
  const customBudget = client.customBudget;
  
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
    <Card className={`overflow-hidden transition-all ${needsAdjustment ? 'border-l-4 border-l-amber-500' : ''} ${isUsingCustomBudget ? 'border-t-4 border-t-[#ff6e00]' : ''}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-medium line-clamp-1 flex items-center gap-1">
              <Building2 className="h-4 w-4 text-[#ff6e00]" />
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
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gasto</span>
              <span className="font-medium">{formatCurrency(spentAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                <span className="flex items-center gap-1">
                  Orçamento
                  {isUsingCustomBudget && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <BadgeDollarSign className="h-3 w-3 text-[#ff6e00]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="p-2">
                            <p className="font-medium">Orçamento Personalizado Ativo</p>
                            <p className="text-sm">Orçamento original: {formatCurrency(originalBudgetAmount)}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </span>
              </span>
              <span className="font-medium">{formatCurrency(budgetAmount)}</span>
            </div>
            <Progress 
              value={spentPercentage} 
              className="h-2"
              indicatorClassName={`${
                spentPercentage > 90 
                  ? "bg-red-500" 
                  : spentPercentage > 70 
                  ? "bg-amber-500" 
                  : "bg-emerald-500"
              }`}
            />
            <div className="text-xs text-right text-gray-500">
              {Math.round(spentPercentage)}% utilizado
            </div>
          </div>
          
          {/* Recomendações de orçamento em formato compacto */}
          <CompactBudgetRecommendation 
            budgetDifference={budgetDifference}
            shouldShow={client.budgetCalculation?.needsBudgetAdjustment}
          />
          
          {expanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Orçamento diário atual</span>
                <span className="font-medium">{formatCurrency(client.review?.[`${platform}_daily_budget_current`] || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Orçamento diário ideal</span>
                <span className="font-medium">{formatCurrency(client.budgetCalculation?.idealDailyBudget || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Dias restantes</span>
                <span className="font-medium">{client.budgetCalculation?.remainingDays || 0}</span>
              </div>
              
              {/* Mostrar média apenas para Google Ads */}
              {platform === "google" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Média gasto (5 dias)</span>
                  <span className="font-medium">{formatCurrency(client.lastFiveDaysAvg || 0)}</span>
                </div>
              )}
              
              {isUsingCustomBudget && customBudget && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                  <div className="flex items-center gap-1 text-sm mb-1">
                    <BadgeDollarSign className="h-4 w-4 text-[#ff6e00]" />
                    <span className="font-medium text-[#ff6e00]">Orçamento Personalizado</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Período</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      {formatDateBr(customBudget.start_date)} a {formatDateBr(customBudget.end_date)}
                    </span>
                  </div>
                  {originalBudgetAmount !== budgetAmount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Orçamento padrão</span>
                      <span className="font-medium">{formatCurrency(originalBudgetAmount)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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
          {isProcessing ? "Processando..." : "Revisar"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
