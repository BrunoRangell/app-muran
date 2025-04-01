
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsDashboardCard } from "@/components/daily-reviews/dashboard/ReviewsDashboardCard";
import { GoogleAdsDashboardCard } from "@/components/daily-reviews/dashboard/GoogleAdsDashboardCard";
import { BudgetManager } from "@/components/revisao-nova/BudgetManager";
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";
import { GoogleAdsDashboard } from "@/components/revisao-nova/GoogleAdsDashboard";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CronScheduleMonitor } from "@/components/daily-reviews/dashboard/components/CronScheduleMonitor";

export default function RevisaoNova() {
  // Usando useState para manter o estado da aba selecionada
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  const queryClient = useQueryClient();
  
  // Atualizar a tab selecionada com base no parâmetro da URL
  useEffect(() => {
    if (tabParam && ["dashboard", "google-ads", "budgets", "custom-budgets"].includes(tabParam)) {
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
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <ReviewsDashboardCard onViewClientDetails={() => {}} />
            </div>
            <div className="space-y-6">
              <CronScheduleMonitor />
            </div>
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
      </Tabs>
    </div>
  );
}
