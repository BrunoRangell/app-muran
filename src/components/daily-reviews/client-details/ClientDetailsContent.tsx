
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientSummaryCard } from "./ClientSummaryCard";
import { BudgetCard } from "./BudgetCard";
import { RecommendationCard } from "./RecommendationCard";
import { ReviewHistoryTable } from "./ReviewHistoryTable";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { MetaCampaignsTable } from "./MetaCampaignsTable";
import { MetaAdsBudgetCard } from "./MetaAdsBudgetCard";

export interface ClientDetailsContentProps {
  client: any;
  latestReview: any;
  reviewHistory: any[];
  recommendation: string | null;
  idealDailyBudget: number | null;
  suggestedBudgetChange: number | null;
  isLoadingHistory: boolean;
  onRefresh: () => void;
}

export const ClientDetailsContent = ({
  client,
  latestReview,
  reviewHistory,
  recommendation,
  idealDailyBudget,
  suggestedBudgetChange,
  isLoadingHistory,
  onRefresh
}: ClientDetailsContentProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    // Resetar o estado após 2 segundos
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const hasCampaignsData = latestReview?.meta?.campaigns && latestReview.meta.campaigns.length > 0;
  const hasDateRange = latestReview?.meta?.dateRange;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-muran-primary hover:text-muran-primary/90"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar dados
        </Button>
      </div>

      <ClientSummaryCard client={client} latestReview={latestReview} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BudgetCard
          monthlyBudget={client?.meta_ads_budget || 0}
          dailyBudget={latestReview?.meta_daily_budget_current || 0}
          idealDailyBudget={idealDailyBudget || 0}
          dateRange={hasDateRange ? latestReview.meta.dateRange : null}
        />
        <RecommendationCard
          recommendation={recommendation}
          suggestedBudgetChange={suggestedBudgetChange}
          currentBudget={latestReview?.meta_daily_budget_current || 0}
        />
        <MetaAdsBudgetCard 
          clientId={client?.id} 
          metaAccountId={client?.meta_account_id}
        />
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="history">Histórico de Revisões</TabsTrigger>
          <TabsTrigger value="campaigns" disabled={!hasCampaignsData}>Campanhas</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="pt-4">
          <ReviewHistoryTable reviewHistory={reviewHistory} isLoading={isLoadingHistory} />
        </TabsContent>
        <TabsContent value="campaigns" className="pt-4">
          {hasCampaignsData ? (
            <MetaCampaignsTable 
              campaigns={latestReview.meta.campaigns} 
              dateRange={latestReview.meta.dateRange}
            />
          ) : (
            <div className="p-6 text-center text-gray-500">
              Nenhuma informação sobre campanhas disponível
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
