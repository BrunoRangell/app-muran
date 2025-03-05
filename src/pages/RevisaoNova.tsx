
import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsDashboard } from "@/components/daily-reviews/dashboard/ReviewsDashboard";
import { ClientReviewDetails } from "@/components/daily-reviews/ClientReviewDetails";
import { DailyReviewsSummary } from "@/components/daily-reviews/DailyReviewsSummary";
import { BudgetManager } from "@/components/revisao-nova/BudgetManager";

export default function RevisaoNova() {
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const handleViewClientDetails = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedTab("client-detail");
  }, []);
  
  const handleBackToDashboard = useCallback(() => {
    setSelectedClientId(null);
    setSelectedTab("dashboard");
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
        Revisão de Orçamentos Meta Ads
      </h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="budgets">Gerenciar Orçamentos</TabsTrigger>
          <TabsTrigger value="client-detail" disabled={!selectedClientId} className="hidden">
            Detalhes do Cliente
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <ReviewsDashboard onViewClientDetails={handleViewClientDetails} />
        </TabsContent>
        
        <TabsContent value="summary" className="space-y-6">
          <DailyReviewsSummary />
        </TabsContent>
        
        <TabsContent value="client-detail" className="space-y-6">
          {selectedClientId && (
            <ClientReviewDetails
              clientId={selectedClientId}
              onBack={handleBackToDashboard}
            />
          )}
        </TabsContent>
        
        <TabsContent value="budgets">
          <BudgetManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
