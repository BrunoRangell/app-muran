
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleAdsTokensTest } from "@/components/revisao-nova/GoogleAdsTokensTest";
import { GoogleAdsTokenManager } from "@/components/revisao-nova/GoogleAdsTokenManager";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>("general");
  
  // Atualizar a tab selecionada com base no parâmetro da URL
  useEffect(() => {
    if (tabParam && ["general", "google-ads", "meta", "integrations"].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
  }, [tabParam]);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
        Configurações
      </h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="google-ads">Google Ads</TabsTrigger>
          <TabsTrigger value="meta">Meta Ads</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-muran-dark">Configurações gerais</h2>
            <p>Configurações gerais do sistema.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="google-ads" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-muran-dark">Google Ads</h2>
            <GoogleAdsTokenManager />
          </div>
        </TabsContent>
        
        <TabsContent value="meta" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-muran-dark">Meta Ads</h2>
            <p>Configurações para integração com Meta Ads.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-muran-dark">Integrações</h2>
            <p>Configurações para integrações com serviços externos.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
