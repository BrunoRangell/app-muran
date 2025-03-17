
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsDashboardCard } from "@/components/daily-reviews/dashboard/ReviewsDashboardCard";
import { BudgetManager } from "@/components/revisao-nova/BudgetManager";
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";
import { useSearchParams } from "react-router-dom";

export default function RevisaoNova() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  
  // Atualizar a tab selecionada com base no parâmetro da URL
  useEffect(() => {
    if (tabParam && ["dashboard", "budgets", "custom-budgets"].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
  }, [tabParam]);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
        Revisão de Orçamentos Meta Ads
      </h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="budgets">Gerenciar Orçamentos</TabsTrigger>
          <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <ReviewsDashboardCard onViewClientDetails={() => {}} />
        </TabsContent>
        
        <TabsContent value="budgets">
          <BudgetManager />
        </TabsContent>
        
        <TabsContent value="custom-budgets">
          <CustomBudgetManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
