
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewsDashboardCard } from "@/components/daily-reviews/dashboard/ReviewsDashboardCard";
import { GoogleAdsDashboardCard } from "@/components/daily-reviews/dashboard/GoogleAdsDashboardCard";
import { BudgetManager } from "@/components/revisao-nova/BudgetManager";
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";
import { GoogleAdsDashboard } from "@/components/revisao-nova/GoogleAdsDashboard";
import { useSearchParams } from "react-router-dom";
import { ApiConfigurationPanel } from "@/components/settings/ApiConfigurationPanel";
import { CronJobMonitor } from "@/components/daily-reviews/dashboard/components/CronJobMonitor";

export default function RevisaoNova() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  
  useEffect(() => {
    if (tabParam && ["dashboard", "google-ads", "budgets", "custom-budgets", "configuracoes", "cron"].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
  }, [tabParam]);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
        Revisão Diária
      </h1>

      <div className="grid grid-cols-1 gap-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Meta Ads</TabsTrigger>
            <TabsTrigger value="google-ads">Google Ads</TabsTrigger>
            <TabsTrigger value="budgets">Gerenciar Orçamentos</TabsTrigger>
            <TabsTrigger value="custom-budgets">Orçamentos Personalizados</TabsTrigger>
            <TabsTrigger value="cron">Monitor de Jobs</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <ReviewsDashboardCard onViewClientDetails={() => {}} />
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
          
          <TabsContent value="cron">
            <CronJobMonitor />
          </TabsContent>

          <TabsContent value="configuracoes">
            <ApiConfigurationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
