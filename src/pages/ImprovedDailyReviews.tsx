
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetaAdsTab } from "@/components/improved-reviews/tabs/MetaAdsTab";
import { GoogleAdsTab } from "@/components/improved-reviews/tabs/GoogleAdsTab";
import { SettingsTab } from "@/components/improved-reviews/tabs/SettingsTab";
import { BudgetManagerTab } from "@/components/improved-reviews/tabs/BudgetManagerTab";
import { CustomBudgetTab } from "@/components/improved-reviews/tabs/CustomBudgetTab";
import { DashboardHeader } from "@/components/improved-reviews/dashboard/DashboardHeader";

export default function ImprovedDailyReviews() {
  // Obter o parâmetro tab da URL ao carregar a página
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "meta-ads";
  };
  
  const [selectedTab, setSelectedTab] = useState<string>(getTabFromUrl());
  const [lastReviewTime, setLastReviewTime] = useState<Date | undefined>(undefined);
  
  // Ao inicializar o componente, verificar se há uma última revisão salva
  useEffect(() => {
    const lastReviewTimeStr = localStorage.getItem("last_review_time");
    if (lastReviewTimeStr) {
      setLastReviewTime(new Date(lastReviewTimeStr));
    }
    
    // Verificar a URL inicial e ajustar se necessário
    const initialTab = getTabFromUrl();
    if (initialTab !== selectedTab) {
      setSelectedTab(initialTab);
    }
  }, []);

  // Função para atualizar a URL sem recarregar a página
  const updateUrlWithoutReload = (tab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({ path: url.toString() }, "", url.toString());
  };
  
  // Função para lidar com a mudança de aba
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    updateUrlWithoutReload(value);
  };

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
            <TabsTrigger value="meta-ads">Meta Ads</TabsTrigger>
            <TabsTrigger value="google-ads">Google Ads</TabsTrigger>
            <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
            <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meta-ads" className="space-y-6">
            <DashboardHeader 
              lastReviewTime={lastReviewTime} 
              onRefresh={handleRefresh} 
            />
            <MetaAdsTab onRefreshCompleted={handleRefresh} />
          </TabsContent>
          
          <TabsContent value="google-ads" className="space-y-6">
            <DashboardHeader 
              lastReviewTime={lastReviewTime} 
              onRefresh={handleRefresh} 
            />
            <GoogleAdsTab onRefreshCompleted={handleRefresh} />
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
