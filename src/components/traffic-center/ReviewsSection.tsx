import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetaAdsTab } from "@/components/improved-reviews/tabs/MetaAdsTab";
import { GoogleAdsTab } from "@/components/improved-reviews/tabs/GoogleAdsTab";
import { BudgetManagerTab } from "@/components/improved-reviews/tabs/BudgetManagerTab";
import { CustomBudgetTab } from "@/components/improved-reviews/tabs/CustomBudgetTab";
import { DashboardHeader } from "@/components/improved-reviews/dashboard/DashboardHeader";
import { usePlatformBatchReviews } from "@/components/improved-reviews/hooks/useBatchOperations";

export function ReviewsSection() {
  // Função para obter a sub-aba da URL hash ou do localStorage
  const getInitialSubTab = () => {
    const hashTab = window.location.hash.replace('#', '');
    // Se estamos na página de revisões e há uma sub-aba na URL
    if (hashTab === 'revisoes') {
      const savedSubTab = localStorage.getItem("reviews_selected_tab");
      if (savedSubTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(savedSubTab)) {
        console.log("💾 Sub-aba inicial do localStorage:", savedSubTab);
        return savedSubTab;
      }
    }
    
    console.log("🔄 Usando sub-aba padrão: meta-ads");
    return "meta-ads";
  };
  
  const [selectedSubTab, setSelectedSubTab] = useState<string>(getInitialSubTab());

  const { 
    lastMetaReviewTime, 
    lastGoogleReviewTime,
    refetchBoth 
  } = usePlatformBatchReviews();
  
  // Função para alterar a sub-aba selecionada
  const handleSubTabChange = (value: string) => {
    console.log("📋 Mudando para sub-aba:", value);
    setSelectedSubTab(value);
    localStorage.setItem("reviews_selected_tab", value);
    
    // Forçar refresh dos dados quando trocar de aba
    setTimeout(() => {
      refetchBoth();
    }, 100);
  };

  // Log para debug do estado atual
  useEffect(() => {
    console.log("📊 Estado atual da seção de Revisões:", {
      selectedSubTab,
      lastMetaReviewTime,
      lastGoogleReviewTime
    });
  }, [selectedSubTab, lastMetaReviewTime, lastGoogleReviewTime]);
  
  return (
    <div className="bg-gray-50 -mx-4 -my-6 px-4 py-6 min-h-[calc(100vh-200px)]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold text-[#321e32] mb-6">
          Revisão Diária Avançada
        </h2>

        <Tabs value={selectedSubTab} onValueChange={handleSubTabChange}>
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
            <GoogleAdsTab onRefreshCompleted={() => {
              console.log("🔄 Google Ads refresh completed");
            }} />
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