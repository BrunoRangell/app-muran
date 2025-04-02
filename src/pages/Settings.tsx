
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleAdsTokensTest } from "@/components/revisao-nova/GoogleAdsTokensTest";
import { GoogleAdsTokenManager } from "@/components/revisao-nova/GoogleAdsTokenManager";
import { GoogleAdsTokensSetupForm } from "@/components/daily-reviews/GoogleAdsTokensSetupForm";
import { GoogleAdsTokenLogs } from "@/components/daily-reviews/GoogleAdsTokenLogs";
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>("google-ads");
  
  // Atualizar a tab selecionada com base no parâmetro da URL
  useEffect(() => {
    if (tabParam && ["general", "google-ads", "meta", "integrations"].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
  }, [tabParam]);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Link 
          to="/dashboard" 
          className="flex items-center text-[#ff6e00] hover:text-[#cc5800] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Dashboard
        </Link>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Configurações
      </h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="mb-4 w-full flex justify-start overflow-x-auto">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="google-ads" className="font-medium">Google Ads</TabsTrigger>
          <TabsTrigger value="meta">Meta Ads</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#321e32]">Configurações gerais</h2>
            <p>Configurações gerais do sistema.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="google-ads" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#321e32]">Google Ads</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <GoogleAdsTokensTest />
              <GoogleAdsTokensSetupForm />
            </div>
            <GoogleAdsTokenManager />
            <GoogleAdsTokenLogs />
          </div>
        </TabsContent>
        
        <TabsContent value="meta" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#321e32]">Meta Ads</h2>
            <p>Configurações para integração com Meta Ads.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#321e32]">Integrações</h2>
            <p>Configurações para integrações com serviços externos.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
