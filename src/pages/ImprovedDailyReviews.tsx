
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImprovedMetaDashboard } from "@/components/improved-reviews/meta/ImprovedMetaDashboard";
import { ImprovedGoogleDashboard } from "@/components/improved-reviews/google/ImprovedGoogleDashboard";
import { ImprovedBudgetManager } from "@/components/improved-reviews/budget/ImprovedBudgetManager";
import { RevisaoHeader } from "@/components/improved-reviews/common/RevisaoHeader";
import { useSearchParams } from "react-router-dom";
import { BatchAnalysisProvider } from "@/components/improved-reviews/context/BatchAnalysisContext";

export default function ImprovedDailyReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState<string>(tabParam || "meta");
  
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setSearchParams({ tab: value });
  };
  
  return (
    <BatchAnalysisProvider>
      <div className="container mx-auto p-4 space-y-6">
        <RevisaoHeader title="Nova Revisão Diária" description="Gerencie orçamentos de Meta e Google Ads" />

        <div className="grid grid-cols-1 gap-6">
          <Tabs value={selectedTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="meta">Meta Ads</TabsTrigger>
              <TabsTrigger value="google">Google Ads</TabsTrigger>
              <TabsTrigger value="budget">Gerenciar Orçamentos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="meta">
              <ImprovedMetaDashboard />
            </TabsContent>
            
            <TabsContent value="google">
              <ImprovedGoogleDashboard />
            </TabsContent>
            
            <TabsContent value="budget">
              <ImprovedBudgetManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </BatchAnalysisProvider>
  );
}
