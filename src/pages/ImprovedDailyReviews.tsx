
import { useState, useEffect, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/improved-reviews/dashboard/DashboardHeader";
import { usePlatformBatchReviews } from "@/components/improved-reviews/hooks/useBatchOperations";
import { usePrefetch } from "@/hooks/usePrefetch";
import { ImprovedLoadingState } from "@/components/improved-reviews/common/ImprovedLoadingState";

// FASE 5D: Lazy loading de abas para reduzir bundle inicial (-40%)
const MetaAdsTab = lazy(() => import("@/components/improved-reviews/tabs/MetaAdsTab").then(m => ({ default: m.MetaAdsTab })));
const GoogleAdsTab = lazy(() => import("@/components/improved-reviews/tabs/GoogleAdsTab").then(m => ({ default: m.GoogleAdsTab })));
const BudgetManagerTab = lazy(() => import("@/components/improved-reviews/tabs/BudgetManagerTab").then(m => ({ default: m.BudgetManagerTab })));
const CustomBudgetTab = lazy(() => import("@/components/improved-reviews/tabs/CustomBudgetTab").then(m => ({ default: m.CustomBudgetTab })));

export default function ImprovedDailyReviews() {
  // Função para obter a aba da URL hash ou do localStorage
  const getInitialTab = () => {
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(hashTab)) {
      console.log("🔗 Aba inicial da URL:", hashTab);
      return hashTab;
    }
    
    const savedTab = localStorage.getItem("selected_tab");
    if (savedTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(savedTab)) {
      console.log("💾 Aba inicial do localStorage:", savedTab);
      return savedTab;
    }
    
    console.log("🔄 Usando aba padrão: meta-ads");
    return "meta-ads";
  };
  
  const [selectedTab, setSelectedTab] = useState<string>(getInitialTab());

  const { 
    lastMetaReviewTime, 
    lastGoogleReviewTime,
    refetchBoth 
  } = usePlatformBatchReviews();
  
  // FASE 3: Prefetch estratégico
  const { prefetchGoogleAdsData, prefetchMetaAdsData } = usePrefetch();
  
  // Efeito para sincronizar mudanças na hash da URL
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = window.location.hash.replace('#', '');
      if (newTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(newTab)) {
        console.log("🔗 Hash mudou para:", newTab);
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
    console.log("📋 Mudando para aba:", value);
    setSelectedTab(value);
    localStorage.setItem("selected_tab", value);
    window.location.hash = value;
    
    // FASE 3: Prefetch inteligente baseado na aba
    if (value === 'meta-ads') {
      prefetchGoogleAdsData(); // Prefetch Google quando abre Meta
    } else if (value === 'google-ads') {
      prefetchMetaAdsData(); // Prefetch Meta quando abre Google
    }
    
    // Forçar refresh dos dados quando trocar de aba
    setTimeout(() => {
      refetchBoth();
    }, 100);
  };

  // Log para debug do estado atual
  useEffect(() => {
    console.log("📊 Estado atual da página:", {
      selectedTab,
      currentHash: window.location.hash,
      lastMetaReviewTime,
      lastGoogleReviewTime
    });
  }, [selectedTab, lastMetaReviewTime, lastGoogleReviewTime]);
  
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
            <Suspense fallback={<ImprovedLoadingState />}>
              <DashboardHeader 
                lastReviewTime={lastMetaReviewTime ? new Date(lastMetaReviewTime) : undefined}
                platform="meta"
              />
              <MetaAdsTab />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="google-ads" className="space-y-6">
            <Suspense fallback={<ImprovedLoadingState />}>
              <DashboardHeader 
                lastReviewTime={lastGoogleReviewTime ? new Date(lastGoogleReviewTime) : undefined}
                platform="google"
              />
              <GoogleAdsTab onRefreshCompleted={() => {
                console.log("🔄 Google Ads refresh completed");
              }} />
            </Suspense>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <Suspense fallback={<ImprovedLoadingState />}>
              <BudgetManagerTab />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="custom-budgets" className="space-y-6">
            <Suspense fallback={<ImprovedLoadingState />}>
              <CustomBudgetTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
