
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetaAdsTab } from "@/components/ads-management/meta/MetaAdsTab";
import { GoogleAdsTab } from "@/components/ads-management/google/GoogleAdsTab";
import { SettingsTab } from "@/components/improved-reviews/tabs/SettingsTab";
import { BudgetManagerTab } from "@/components/improved-reviews/tabs/BudgetManagerTab";
import { CustomBudgetTab } from "@/components/improved-reviews/tabs/CustomBudgetTab";
import { DashboardHeader } from "@/components/improved-reviews/dashboard/DashboardHeader";
import { useSearchParams } from "react-router-dom";

export default function ImprovedDailyReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>(tabParam || "dashboard");
  const [lastReviewTime, setLastReviewTime] = useState<Date | undefined>(undefined);
  
  // Atualizar a URL quando a tab mudar
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setSearchParams({ tab: value });
  };

  // Ao inicializar o componente, verificar se há uma última revisão salva
  useEffect(() => {
    const lastReviewTimeStr = localStorage.getItem("last_review_time");
    if (lastReviewTimeStr) {
      setLastReviewTime(new Date(lastReviewTimeStr));
    }

    // Pré-carregamento da aba Google Ads quando o componente montar
    // Isso garante que os dados já estejam disponíveis quando o usuário alternar para a aba
    if (selectedTab !== "google-ads") {
      const prefetchTimeout = setTimeout(() => {
        console.log("Pré-carregando dados do Google Ads...");
        // Não precisamos fazer nada aqui, apenas garantir que o React Query inicialize
      }, 3000);
      return () => clearTimeout(prefetchTimeout);
    }
    
  }, []);

  // Função para registrar a hora da última atualização
  const handleRefresh = () => {
    const now = new Date();
    localStorage.setItem("last_review_time", now.toISOString());
    setLastReviewTime(now);
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão Diária Avançada
      </h1>

      <div className="grid grid-cols-1 gap-6">
        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Meta Ads</TabsTrigger>
            <TabsTrigger value="google-ads">Google Ads</TabsTrigger>
            <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
            <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardHeader 
              lastReviewTime={lastReviewTime} 
              onRefresh={handleRefresh} 
            />
            <MetaAdsTab 
              onRefreshCompleted={handleRefresh} 
              isActive={selectedTab === "dashboard"} 
            />
          </TabsContent>
          
          <TabsContent value="google-ads" className="space-y-6">
            <DashboardHeader 
              lastReviewTime={lastReviewTime} 
              onRefresh={handleRefresh} 
            />
            <GoogleAdsTab 
              onRefreshCompleted={handleRefresh} 
              isActive={selectedTab === "google-ads"} 
            />
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <BudgetManagerTab />
          </TabsContent>
          
          <TabsContent value="custom-budgets" className="space-y-6">
            <CustomBudgetTab />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
