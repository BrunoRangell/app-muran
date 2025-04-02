
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsDashboardCard } from "@/components/daily-reviews/dashboard/ReviewsDashboardCard";
import { GoogleAdsDashboardCard } from "@/components/daily-reviews/dashboard/GoogleAdsDashboardCard";
import { BudgetManager } from "@/components/revisao-nova/BudgetManager";
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";
import { GoogleAdsDashboard } from "@/components/revisao-nova/GoogleAdsDashboard";
import { useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";

export default function RevisaoNova() {
  // Usando useState para manter o estado da aba selecionada
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  const queryClient = useQueryClient();
  
  // Atualizar a tab selecionada com base no parâmetro da URL
  useEffect(() => {
    if (tabParam && ["dashboard", "google-ads", "budgets", "custom-budgets", "settings"].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
  }, [tabParam]);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão Diária
      </h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Meta Ads</TabsTrigger>
          <TabsTrigger value="google-ads">Google Ads</TabsTrigger>
          <TabsTrigger value="budgets">Gerenciar Orçamentos</TabsTrigger>
          <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <SettingsIcon className="h-4 w-4" />
            <span>Configurações</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="md:col-span-3">
            <ReviewsDashboardCard onViewClientDetails={() => {}} />
          </div>
        </TabsContent>
        
        <TabsContent value="google-ads" className="space-y-6">
          <GoogleAdsDashboard />
        </TabsContent>
        
        <TabsContent value="budgets">
          <BudgetManager />
        </TabsContent>
        
        <TabsContent value="custom-budgets">
          <CustomBudgetManager />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6">
            <Link to="/configuracoes?tab=google-ads" className="w-full">
              <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
                <h2 className="text-lg font-semibold text-[#321e32] mb-2">Configurações Completas</h2>
                <p className="text-gray-600">
                  Acesse a página de configurações completas para gerenciar tokens do Google Ads,
                  Meta Ads e outras configurações do sistema.
                </p>
              </div>
            </Link>
            <iframe 
              src="/configuracoes?tab=google-ads" 
              className="w-full h-[800px] border-none rounded-lg shadow-sm"
              title="Configurações"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
