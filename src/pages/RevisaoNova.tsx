
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsDashboardCard } from "@/components/daily-reviews/dashboard/ReviewsDashboardCard";
import { GoogleAdsDashboardCard } from "@/components/daily-reviews/dashboard/GoogleAdsDashboardCard";
import { BudgetManager } from "@/components/revisao-nova/BudgetManager";
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";
import { GoogleAdsTokensTest } from "@/components/revisao-nova/GoogleAdsTokensTest";
import { GoogleAdsDashboard } from "@/components/revisao-nova/GoogleAdsDashboard";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export default function RevisaoNova() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  const queryClient = useQueryClient();
  
  // Atualizar a tab selecionada com base no parâmetro da URL
  useEffect(() => {
    if (tabParam && ["dashboard", "google-ads", "budgets", "custom-budgets", "settings"].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
  }, [tabParam]);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
        Revisão Diária
      </h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Meta Ads</TabsTrigger>
          <TabsTrigger value="google-ads">Google Ads</TabsTrigger>
          <TabsTrigger value="budgets">Gerenciar Orçamentos</TabsTrigger>
          <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <ReviewsDashboardCard onViewClientDetails={() => {}} />
        </TabsContent>
        
        <TabsContent value="google-ads" className="space-y-6">
          <GoogleAdsDashboard />
        </TabsContent>
        
        <TabsContent value="budgets">
          <BudgetManager />
        </TabsContent>
        
        <TabsContent value="custom-budgets">
          <CustomBudgetManager />
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-muran-dark">Configurações de API</h2>
            <GoogleAdsTokensTest />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
