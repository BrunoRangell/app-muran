
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { CardHeader } from "./CardHeader";
import { BudgetInfoGrid } from "./BudgetInfoGrid";
import { BudgetRecommendation } from "./BudgetRecommendation";
import { CardActions } from "./CardActions";

interface ClientReviewCardProps {
  client: any;
  onReviewClient: (clientId: string) => void;
  onViewDetails?: (clientId: string) => void;
  isProcessing: boolean;
  platform?: 'meta' | 'google';
}

export const ClientReviewCard = ({
  client,
  onReviewClient,
  onViewDetails,
  isProcessing,
  platform = 'meta'
}: ClientReviewCardProps) => {
  const handleReviewClick = () => {
    console.log(`Iniciando revisão para cliente: ${client.id}`);
    onReviewClient(client.id);
  };

  const handleViewDetailsClick = () => {
    if (onViewDetails) {
      onViewDetails(client.id);
    }
  };

  // Determine which fields to use based on platform
  const accountIdField = platform === 'meta' ? 'meta_account_id' : 'google_account_id';
  const budgetField = platform === 'meta' ? 'meta_ads_budget' : 'google_ads_budget';
  const dailyBudgetField = platform === 'meta' ? 'meta_daily_budget_current' : 'google_daily_budget_current';
  const totalSpentField = platform === 'meta' ? 'meta_total_spent' : 'google_total_spent';

  // Check if platform data is available
  const hasPlatformConfig = client[accountIdField] && client[budgetField];
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader 
        client={client}
        accountIdField={accountIdField}
        hasPlatformConfig={hasPlatformConfig}
        platform={platform}
      />
      
      <CardContent className="space-y-4 pt-0">
        {hasPlatformConfig ? (
          <>
            <BudgetInfoGrid 
              client={client}
              budgetField={budgetField}
              dailyBudgetField={dailyBudgetField}
              totalSpentField={totalSpentField}
            />
            
            <BudgetRecommendation client={client} platform={platform} />
            
            <CardActions
              client={client}
              isProcessing={isProcessing}
              onReviewClick={handleReviewClick}
              onViewDetailsClick={handleViewDetailsClick}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <p className="text-sm text-gray-500 text-center">
              Cliente sem configuração de {platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
            </p>
            <Button 
              size="sm" 
              className="bg-muran-secondary text-muran-dark hover:bg-muran-secondary/90"
              onClick={() => window.location.href = '/revisao-meta?tab=budgets'}
            >
              Configurar orçamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
