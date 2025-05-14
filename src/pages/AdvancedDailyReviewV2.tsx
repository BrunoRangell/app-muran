
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppProviders } from "@/components/advanced-reviews-v2/context/AppProviders";
import { DashboardHeader } from "@/components/advanced-reviews-v2/dashboard/DashboardHeader";
import { useClientDataV2 } from "@/components/advanced-reviews-v2/hooks/useClientDataV2";
import { useReviews } from "@/components/advanced-reviews-v2/context/ReviewContext";
import { useSearchParams } from "react-router-dom";
import { SideNav } from "@/components/advanced-reviews-v2/navigation/SideNav";

// Importar as abas
import { DashboardOverview } from "@/components/advanced-reviews-v2/dashboard/DashboardOverview";
import { MetaAdsTabV2 } from "@/components/advanced-reviews-v2/tabs/MetaAdsTabV2";
import { GoogleAdsTabV2 } from "@/components/advanced-reviews-v2/tabs/GoogleAdsTabV2";
import { BudgetManagerTabV2 } from "@/components/advanced-reviews-v2/tabs/BudgetManagerTabV2";
import { CustomBudgetTabV2 } from "@/components/advanced-reviews-v2/tabs/CustomBudgetTabV2";
import { SettingsTabV2 } from "@/components/advanced-reviews-v2/tabs/SettingsTabV2";

// Tipo para o evento personalizado
interface UrlChangeEvent extends Event {
  detail: {
    tab: string;
  };
}

// Componente interno que usa o contexto
function DailyReviewContent() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>(tabParam || "dashboard");
  
  const { state, dispatch } = useReviews();
  const { 
    refreshData, 
    isLoading, 
    lastRefresh 
  } = useClientDataV2();
  
  // Atualizar a URL quando a tab mudar, mas EVITANDO recarregar a página
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    
    // Usar o objeto window.history para atualizar a URL sem recarregar a página
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.pushState({}, "", url);
    
    // Atualizar a plataforma no filtro do contexto
    if (value === "meta" || value === "google") {
      dispatch({ 
        type: "SET_FILTER", 
        payload: { platform: value }
      });
    }
  };
  
  // Sincronizar tab com parâmetro de URL ao inicializar
  useEffect(() => {
    if (tabParam) {
      setSelectedTab(tabParam);
      
      // Atualizar a plataforma no filtro do contexto
      if (tabParam === "meta" || tabParam === "google") {
        dispatch({ 
          type: "SET_FILTER", 
          payload: { platform: tabParam }
        });
      }
    }
  }, [tabParam, dispatch]);
  
  // Ouvir o evento personalizado de mudança de URL do menu lateral
  useEffect(() => {
    const handleUrlChange = (event: Event) => {
      const { tab } = (event as UrlChangeEvent).detail;
      setSelectedTab(tab);
      
      // Atualizar a plataforma no filtro do contexto
      if (tab === "meta" || tab === "google") {
        dispatch({ 
          type: "SET_FILTER", 
          payload: { platform: tab }
        });
      }
    };
    
    window.addEventListener("urlchange", handleUrlChange);
    
    return () => {
      window.removeEventListener("urlchange", handleUrlChange);
    };
  }, [dispatch]);
  
  return (
    <div className="flex h-screen">
      <SideNav />
      
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
          Revisão Diária Avançada 2.0
        </h1>

        <div className="grid grid-cols-1 gap-6">
          <Tabs value={selectedTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="meta">Meta Ads</TabsTrigger>
              <TabsTrigger value="google">Google Ads</TabsTrigger>
              <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
              <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-6">
              <DashboardHeader 
                lastReviewTime={lastRefresh} 
                onRefresh={refreshData} 
                isLoading={isLoading || state.processing.batchProcessing}
                metrics={state.metrics.combined}
                platform="combined"
              />
              <DashboardOverview />
            </TabsContent>
            
            <TabsContent value="meta" className="space-y-6">
              <DashboardHeader 
                lastReviewTime={lastRefresh} 
                onRefresh={refreshData} 
                isLoading={isLoading || state.processing.batchProcessing}
                metrics={state.metrics.meta}
                platform="meta"
              />
              <MetaAdsTabV2 />
            </TabsContent>
            
            <TabsContent value="google" className="space-y-6">
              <DashboardHeader 
                lastReviewTime={lastRefresh} 
                onRefresh={refreshData} 
                isLoading={isLoading || state.processing.batchProcessing}
                metrics={state.metrics.google}
                platform="google"
              />
              <GoogleAdsTabV2 />
            </TabsContent>

            <TabsContent value="budgets" className="space-y-6">
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
    </div>
  );
}

// Componente principal que fornece o contexto
export default function AdvancedDailyReviewV2() {
  return (
    <AppProviders>
      <DailyReviewContent />
    </AppProviders>
  );
}
