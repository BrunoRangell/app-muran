
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetaAdsTab } from "@/components/improved-reviews/tabs/MetaAdsTab";
import { GoogleAdsTab } from "@/components/improved-reviews/tabs/GoogleAdsTab";
import { BudgetManagerTab } from "@/components/improved-reviews/tabs/BudgetManagerTab";
import { CustomBudgetTab } from "@/components/improved-reviews/tabs/CustomBudgetTab";
import { DashboardHeader } from "@/components/improved-reviews/dashboard/DashboardHeader";
import { usePlatformBatchReviews } from "@/components/improved-reviews/hooks/useBatchOperations";

export default function ImprovedDailyReviews() {
  // Função para obter a aba da URL hash ou do localStorage
  const getInitialTab = () => {
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(hashTab)) {
      return hashTab;
    }
    
    const savedTab = localStorage.getItem("selected_tab");
    if (savedTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(savedTab)) {
      return savedTab;
    }
    
    return "meta-ads";
  };
  
  const [selectedTab, setSelectedTab] = useState<string>(getInitialTab());

  const { 
    lastMetaReviewTime, 
    lastGoogleReviewTime,
    refetchBoth 
  } = usePlatformBatchReviews();
  
  // Efeito para sincronizar mudanças na hash da URL
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = window.location.hash.replace('#', '');
      if (newTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(newTab)) {
        setSelectedTab(newTab);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    if (!window.location.hash) {
      window.location.hash = selectedTab;
    }
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [selectedTab]);
  
  // Função para alterar a aba selecionada
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    localStorage.setItem("selected_tab", value);
    window.location.hash = value;
    refetchBoth();
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
          </TabsList>
          
          <TabsContent value="meta-ads" className="space-y-6">
            <DashboardHeader 
              lastReviewTime={lastMetaReviewTime ? new Date(lastMetaReviewTime) : undefined}
              platform="meta"
            />
            <MetaAdsTab />
          </TabsContent>
          
          <TabsContent value="google-ads" className="space-y-6">
            <DashboardHeader 
              lastReviewTime={lastGoogleReviewTime ? new Date(lastGoogleReviewTime) : undefined}
              platform="google"
            />
            <GoogleAdsTab />
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <BudgetManagerTab />
          </TabsContent>
          
          <TabsContent value="custom-budgets" className="space-y-6">
            <CustomBudgetTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
