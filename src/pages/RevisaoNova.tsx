
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientSelector } from "@/components/revisao-nova/ClientSelector";
import { ClientInfo } from "@/components/revisao-nova/ClientInfo";
import { AnalysisContent } from "@/components/revisao-nova/AnalysisContent";
import { ErrorContent } from "@/components/revisao-nova/ErrorContent";
import { ApiTestTools } from "@/components/revisao-nova/ApiTestTools";
import { useMetaAdsAnalysis } from "@/components/revisao-nova/useMetaAdsAnalysis";
import { BudgetManager } from "@/components/revisao-nova/BudgetManager";

export default function RevisaoNova() {
  const [selectedTab, setSelectedTab] = useState<string>("analysis");
  
  const {
    client,
    analysis,
    isLoading,
    error,
    fetchAnalysis,
    debugInfo,
    testMetaToken,
    testEdgeFunction
  } = useMetaAdsAnalysis();

  const handleClientSelect = (clientId: string) => {
    fetchAnalysis(clientId);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-muran-dark">
        Revisão de Orçamentos Meta Ads
      </h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="analysis">Analisar Cliente</TabsTrigger>
          <TabsTrigger value="budgets">Gerenciar Orçamentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis" className="space-y-6">
          <ClientSelector onClientSelect={handleClientSelect} />
          
          <ClientInfo client={client} />
          
          {isLoading && <div className="animate-pulse mt-4 h-8 w-full max-w-md rounded bg-gray-200" />}
          
          {error && <ErrorContent error={error} />}
          
          {analysis && <AnalysisContent analysis={analysis} />}
          
          {debugInfo && (
            <ApiTestTools 
              debugInfo={debugInfo} 
              onTestToken={testMetaToken} 
              onTestEdgeFunction={testEdgeFunction} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="budgets">
          <BudgetManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
