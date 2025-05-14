
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/advanced-reviews-v2/dashboard/DashboardHeader";
import { MetaAdsTabV2 } from "@/components/advanced-reviews-v2/tabs/MetaAdsTabV2";
import { GoogleAdsTabV2 } from "@/components/advanced-reviews-v2/tabs/GoogleAdsTabV2";
import { SettingsTabV2 } from "@/components/advanced-reviews-v2/tabs/SettingsTabV2";
import { BudgetManagerTabV2 } from "@/components/advanced-reviews-v2/tabs/BudgetManagerTabV2";
import { CustomBudgetTabV2 } from "@/components/advanced-reviews-v2/tabs/CustomBudgetTabV2";
import { useSearchParams } from "react-router-dom";

export default function AdvancedDailyReviewV2() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>(tabParam || "meta-ads");
  const [lastReviewTime, setLastReviewTime] = useState<Date | undefined>(undefined);
  
  // Atualizar a URL quando a tab mudar
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setSearchParams({ tab: value });
  };

  // Ao inicializar o componente, verificar se há uma última revisão salva
  useEffect(() => {
    const lastReviewTimeStr = localStorage.getItem("last_review_time_v2");
    if (lastReviewTimeStr) {
      setLastReviewTime(new Date(lastReviewTimeStr));
    }
  }, []);

  // Função para registrar a hora da última atualização
  const handleRefresh = () => {
    const now = new Date();
    localStorage.setItem("last_review_time_v2", now.toISOString());
    setLastReviewTime(now);
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão Diária Avançada 2.0
      </h1>

      <div className="grid grid-cols-1 gap-6">
        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="meta-ads">Meta Ads</TabsTrigger>
            <TabsTrigger value="google-ads">Google Ads</TabsTrigger>
            <TabsTrigger value="budget-manager">Orçamentos</TabsTrigger>
            <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="meta-ads" className="space-y-6">
            <DashboardHeader 
              lastReviewTime={lastReviewTime} 
              onRefresh={handleRefresh} 
            />
            <MetaAdsTabV2 onRefreshCompleted={handleRefresh} />
          </TabsContent>
          
          <TabsContent value="google-ads" className="space-y-6">
            <DashboardHeader 
              lastReviewTime={lastReviewTime} 
              onRefresh={handleRefresh} 
            />
            <GoogleAdsTabV2 onRefreshCompleted={handleRefresh} />
          </TabsContent>

          <TabsContent value="budget-manager" className="space-y-6">
            <BudgetManagerTabV2 />
          </TabsContent>
          
          <TabsContent value="custom-budgets" className="space-y-6">
            <CustomBudgetTabV2 />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTabV2 />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
