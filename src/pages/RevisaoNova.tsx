
import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientSelector } from "@/components/revisao-nova/ClientSelector";
import { ClientInfo } from "@/components/revisao-nova/ClientInfo";
import { AnalysisContent } from "@/components/revisao-nova/AnalysisContent";
import { useMetaAdsAnalysis } from "@/components/revisao-nova/hooks/useMetaAdsAnalysis";
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
    rawApiResponse,
    testMetaToken,
    testEdgeFunction
  } = useMetaAdsAnalysis();

  const handleClientSelect = useCallback((clientId: string) => {
    fetchAnalysis(clientId);
  }, [fetchAnalysis]);

  // Funções para gerenciar funcionalidades adicionais
  const handleOpenGraphExplorer = useCallback(() => {
    window.open("https://developers.facebook.com/tools/explorer/", "_blank");
  }, []);

  const handleMakeSampleRequest = useCallback(() => {
    if (client?.meta_account_id) {
      window.open(`https://developers.facebook.com/tools/explorer/?method=GET&path=act_${client.meta_account_id}/campaigns`, "_blank");
    }
  }, [client]);

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
          
          {client && <ClientInfo client={client} />}
          
          {error && (
            <AnalysisContent 
              isLoading={isLoading}
              error={error}
              analysis={null}
              client={client}
              rawApiResponse={rawApiResponse}
              debugInfo={debugInfo}
              testMetaToken={testMetaToken}
              testEdgeFunction={testEdgeFunction}
              handleOpenGraphExplorer={handleOpenGraphExplorer}
              handleMakeSampleRequest={handleMakeSampleRequest}
            />
          )}
          
          {!error && analysis && (
            <AnalysisContent 
              isLoading={isLoading}
              error={null}
              analysis={analysis}
              client={client}
              rawApiResponse={rawApiResponse}
              debugInfo={debugInfo}
              testMetaToken={testMetaToken}
              testEdgeFunction={testEdgeFunction}
              handleOpenGraphExplorer={handleOpenGraphExplorer}
              handleMakeSampleRequest={handleMakeSampleRequest}
            />
          )}
          
          {!error && !analysis && !isLoading && (
            <div className="text-center p-12 border rounded-lg bg-gray-50">
              <p className="text-lg text-gray-600">
                Selecione um cliente acima e clique em "Analisar" para ver os dados reais do Meta Ads.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="budgets">
          <BudgetManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
