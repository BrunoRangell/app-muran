
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsHeader } from "./ClientsHeader";
import { ClientsKPICards } from "./ClientsKPICards";
import { ClientsListTab } from "./ClientsListTab";
import { ClientsMetricsTab } from "./ClientsMetricsTab";
import { ClientsRankingTab } from "./ClientsRankingTab";
import { useClients } from "@/hooks/queries/useClients";

export const ClientsDashboard = () => {
  const [activeTab, setActiveTab] = useState("list");
  const { clients, isLoading } = useClients({ status: 'active' });

  return (
    <div className="min-h-screen bg-muran-secondary/20">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <ClientsHeader />
        
        <ClientsKPICards clients={clients || []} isLoading={isLoading} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border">
            <TabsTrigger 
              value="list" 
              className="data-[state=active]:bg-muran-primary data-[state=active]:text-white"
            >
              📋 Listagem
            </TabsTrigger>
            <TabsTrigger 
              value="metrics" 
              className="data-[state=active]:bg-muran-primary data-[state=active]:text-white"
            >
              📊 Métricas
            </TabsTrigger>
            <TabsTrigger 
              value="ranking" 
              className="data-[state=active]:bg-muran-primary data-[state=active]:text-white"
            >
              🏆 Ranking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <ClientsListTab />
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <ClientsMetricsTab />
          </TabsContent>

          <TabsContent value="ranking" className="mt-6">
            <ClientsRankingTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
