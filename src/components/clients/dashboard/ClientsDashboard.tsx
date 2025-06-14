
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ClientsKPICards } from "./ClientsKPICards";
import { ClientsListTab } from "./ClientsListTab";
import { ClientsMetricsTab } from "./ClientsMetricsTab";
import { ClientsRankingTab } from "./ClientsRankingTab";
import { ClientsHeader } from "./ClientsHeader";

export const ClientsDashboard = () => {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <ClientsHeader />
        
        <ClientsKPICards />

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                Lista
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                Métricas
              </TabsTrigger>
              <TabsTrigger value="ranking" className="flex items-center gap-2">
                Ranking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <ClientsListTab />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <ClientsMetricsTab />
            </TabsContent>

            <TabsContent value="ranking" className="space-y-4">
              <ClientsRankingTab />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
