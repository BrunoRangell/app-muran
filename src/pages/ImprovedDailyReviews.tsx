
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetaAdsTab } from "@/components/improved-reviews/tabs/MetaAdsTab";
import { GoogleAdsTab } from "@/components/improved-reviews/tabs/GoogleAdsTab";
import { BudgetManagerTab } from "@/components/improved-reviews/tabs/BudgetManagerTab";
import { CustomBudgetTab } from "@/components/improved-reviews/tabs/CustomBudgetTab";
import { DashboardHeader } from "@/components/improved-reviews/dashboard/DashboardHeader";

export default function ImprovedDailyReviews() {
  // Função para obter a aba da URL hash ou do localStorage
  const getInitialTab = () => {
    // Primeiro tenta obter da hash da URL
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(hashTab)) {
      return hashTab;
    }
    
    // Se não encontrar na hash, tenta obter do localStorage
    const savedTab = localStorage.getItem("selected_tab");
    if (savedTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(savedTab)) {
      return savedTab;
    }
    
    // Padrão é "meta-ads"
    return "meta-ads";
  };
  
  const [selectedTab, setSelectedTab] = useState<string>(getInitialTab());
  const [lastReviewTime, setLastReviewTime] = useState<Date | undefined>(undefined);
  
  // Ao inicializar o componente, verificar se há uma última revisão salva
  useEffect(() => {
    const lastReviewTimeStr = localStorage.getItem("last_review_time");
    if (lastReviewTimeStr) {
      setLastReviewTime(new Date(lastReviewTimeStr));
    }
    
    // Inicializa a hash da URL se ela não existir
    if (!window.location.hash) {
      window.location.hash = selectedTab;
    }
  }, []);
  
  // Efeito para sincronizar mudanças na hash da URL
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = window.location.hash.replace('#', '');
      if (newTab && ['meta-ads', 'google-ads', 'budgets', 'custom-budgets'].includes(newTab)) {
        setSelectedTab(newTab);
      }
    };
    
    // Adiciona listener para mudanças na hash
    window.addEventListener('hashchange', handleHashChange);
    
    // Cleanup listener quando o componente for desmontado
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  // Função para alterar a aba selecionada
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    localStorage.setItem("selected_tab", value);
    
    // Atualiza a hash da URL sem recarregar a página
    window.location.hash = value;
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
        </Tabs>
      </div>
    </div>
  );
}
