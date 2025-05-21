
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useToast } from "@/hooks/use-toast";
import { CompactBudgetRecommendation } from "@/components/daily-reviews/dashboard/card-components/CompactBudgetRecommendation";
import { CardHeader as ClientCardHeader } from "./card-components/CardHeader";
import { BudgetProgress } from "./card-components/BudgetProgress";
import { ExpandedDetails } from "./card-components/ExpandedDetails";
import { CardFooterActions } from "./card-components/CardFooter";

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
  
  // Dados para recomendação baseada na média dos últimos 5 dias
  const lastFiveDaysAvg = client.lastFiveDaysAvg || 0;
  const budgetDifferenceAvg = client.budgetCalculation?.budgetDifferenceBasedOnAverage || 0;
  const needsAdjustmentBasedOnAverage = client.budgetCalculation?.needsAdjustmentBasedOnAverage || false;
  
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
        <ClientCardHeader 
          clientName={client.company_name}
          accountName={accountName}
          isUsingCustomBudget={isUsingCustomBudget}
          needsAdjustment={needsAdjustment}
          customBudget={customBudget}
        />
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          <BudgetProgress 
            spentAmount={spentAmount}
            budgetAmount={budgetAmount}
            spentPercentage={spentPercentage}
            isUsingCustomBudget={isUsingCustomBudget}
            originalBudgetAmount={originalBudgetAmount}
          />
          
          {/* Recomendações de orçamento em formato compacto */}
          <CompactBudgetRecommendation 
            budgetDifference={budgetDifference}
            budgetDifferenceBasedOnAverage={budgetDifferenceAvg}
            showRecommendation={client.budgetCalculation?.needsBudgetAdjustment}
            showRecommendationAverage={needsAdjustmentBasedOnAverage}
            needsIncrease={budgetDifference > 0}
            needsIncreaseAverage={budgetDifferenceAvg > 0}
            lastFiveDaysAverage={lastFiveDaysAvg}
            hasReview={!!client.review}
          />
          
          {expanded && (
            <ExpandedDetails 
              platform={platform}
              client={client}
              isUsingCustomBudget={isUsingCustomBudget}
              customBudget={customBudget}
              originalBudgetAmount={originalBudgetAmount}
              budgetAmount={budgetAmount}
              lastFiveDaysAvg={lastFiveDaysAvg}
            />
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-0">
        <CardFooterActions 
          expanded={expanded}
          setExpanded={setExpanded}
          isProcessing={isProcessing}
          onReview={handleReviewClick}
        />
      </CardFooter>
    </Card>
  );
}
