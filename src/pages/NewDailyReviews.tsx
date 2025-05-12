
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetaAdsTab } from "@/components/new-reviews/tabs/MetaAdsTab";
import { GoogleAdsTab } from "@/components/new-reviews/tabs/GoogleAdsTab";
import { BudgetsTab } from "@/components/new-reviews/tabs/BudgetsTab";
import { CustomBudgetsTab } from "@/components/new-reviews/tabs/CustomBudgetsTab";
import { SettingsTab } from "@/components/new-reviews/tabs/SettingsTab";

export default function NewDailyReviews() {
  const [activeTab, setActiveTab] = useState("meta");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#321e32]">Nova Revisão Diária</h1>
        <p className="text-gray-500 mt-1">
          Gerencie revisões diárias de campanhas e orçamentos personalizados
        </p>
      </div>

      <Tabs
        defaultValue="meta"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="border-b">
          <TabsList className="bg-transparent border-b-0 w-full justify-start gap-4">
            <TabsTrigger value="meta" className="data-[state=active]:border-b-2 data-[state=active]:border-[#ff6e00] rounded-none">
              Meta Ads
            </TabsTrigger>
            <TabsTrigger value="google" className="data-[state=active]:border-b-2 data-[state=active]:border-[#ff6e00] rounded-none">
              Google Ads
            </TabsTrigger>
            <TabsTrigger value="budgets" className="data-[state=active]:border-b-2 data-[state=active]:border-[#ff6e00] rounded-none">
              Orçamentos
            </TabsTrigger>
            <TabsTrigger value="custom-budgets" className="data-[state=active]:border-b-2 data-[state=active]:border-[#ff6e00] rounded-none">
              Orçamentos Personalizados
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-[#ff6e00] rounded-none">
              Configurações
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="mt-6">
          <TabsContent value="meta" className="m-0">
            <MetaAdsTab />
          </TabsContent>
          
          <TabsContent value="google" className="m-0">
            <GoogleAdsTab />
          </TabsContent>
          
          <TabsContent value="budgets" className="m-0">
            <BudgetsTab />
          </TabsContent>
          
          <TabsContent value="custom-budgets" className="m-0">
            <CustomBudgetsTab />
          </TabsContent>
          
          <TabsContent value="settings" className="m-0">
            <SettingsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
