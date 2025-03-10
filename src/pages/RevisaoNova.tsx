
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsDashboard } from "@/components/daily-reviews/dashboard/ReviewsDashboard";
import { BudgetManager } from "@/components/revisao-nova/BudgetManager";

export default function RevisaoNova() {
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  
  // Função vazia para o onViewClientDetails, já que não usamos mais essa funcionalidade
  const handleViewClientDetails = () => {};

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
        Revisão de Orçamentos Meta Ads
      </h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="budgets">Gerenciar Orçamentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <ReviewsDashboard onViewClientDetails={handleViewClientDetails} />
        </TabsContent>
        
        <TabsContent value="budgets">
          <BudgetManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
