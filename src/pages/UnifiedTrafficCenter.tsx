import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthSection } from "@/components/traffic-center/HealthSection";
import { ReviewsSection } from "@/components/traffic-center/ReviewsSection";
import { BalanceSection } from "@/components/traffic-center/BalanceSection";

export default function UnifiedTrafficCenter() {
  // Função para obter a aba da URL hash ou do localStorage
  const getInitialTab = () => {
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab && ['saude', 'revisoes', 'saldos'].includes(hashTab)) {
      console.log("🔗 Aba inicial da URL:", hashTab);
      return hashTab;
    }
    
    const savedTab = localStorage.getItem("traffic_center_tab");
    if (savedTab && ['saude', 'revisoes', 'saldos'].includes(savedTab)) {
      console.log("💾 Aba inicial do localStorage:", savedTab);
      return savedTab;
    }
    
    console.log("🔄 Usando aba padrão: saude");
    return "saude";
  };
  
  const [selectedTab, setSelectedTab] = useState<string>(getInitialTab());
  
  // Efeito para sincronizar mudanças na hash da URL
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = window.location.hash.replace('#', '');
      if (newTab && ['saude', 'revisoes', 'saldos'].includes(newTab)) {
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
    localStorage.setItem("traffic_center_tab", value);
    window.location.hash = value;
  };

  // Log para debug do estado atual
  useEffect(() => {
    console.log("📊 Estado atual da Central de Tráfego:", {
      selectedTab,
      currentHash: window.location.hash
    });
  }, [selectedTab]);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Central de Tráfego Pago
      </h1>

      <div className="grid grid-cols-1 gap-6">
        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="saude">🏥 Saúde das Campanhas</TabsTrigger>
            <TabsTrigger value="revisoes">📊 Revisões Diárias</TabsTrigger>
            <TabsTrigger value="saldos">💰 Saldo das Campanhas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="saude" className="space-y-6">
            <HealthSection />
          </TabsContent>
          
          <TabsContent value="revisoes" className="space-y-6">
            <ReviewsSection />
          </TabsContent>

          <TabsContent value="saldos" className="space-y-6">
            <BalanceSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}