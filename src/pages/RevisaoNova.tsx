
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, ExternalLink, Loader } from "lucide-react";
import { useMetaAdsAnalysis } from "@/components/revisao-nova/useMetaAdsAnalysis";
import { ClientSelector } from "@/components/revisao-nova/ClientSelector";
import { TokensSetupForm } from "@/components/daily-reviews/TokensSetupForm";
import { ClientInfo } from "@/components/revisao-nova/ClientInfo";
import { AnalysisContent } from "@/components/revisao-nova/AnalysisContent";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RevisaoNova() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { 
    analysis, 
    client, 
    isLoading, 
    error, 
    fetchAnalysis,
    rawApiResponse,
    debugInfo,
    testMetaToken,
    testEdgeFunction
  } = useMetaAdsAnalysis();

  function handleClientSelect(clientId: string) {
    setSelectedClientId(clientId);
  }

  function handleAnalyze() {
    if (selectedClientId) {
      fetchAnalysis(selectedClientId);
    }
  }

  function handleOpenGraphExplorer() {
    window.open(
      `https://developers.facebook.com/tools/explorer/`, 
      '_blank'
    );
  }

  function handleMakeSampleRequest() {
    if (client?.meta_account_id) {
      const path = encodeURIComponent(`act_${client.meta_account_id}/campaigns`);
      const fields = encodeURIComponent('status,name,spend,insights{spend}');
      window.open(
        `https://developers.facebook.com/tools/explorer/?method=GET&path=${path}&fields=${fields}`,
        '_blank'
      );
    }
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#321e32]">Revisão de Campanhas Meta Ads</h1>
          <div className="flex items-center gap-3">
            <TokensSetupForm />
            <a 
              href="https://business.facebook.com/adsmanager/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-[#ff6e00] flex items-center"
            >
              Abrir Meta Ads <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <ClientSelector onClientSelect={handleClientSelect} />
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={isLoading || !selectedClientId}
              className="bg-[#ff6e00] hover:bg-[#e56400]"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Buscar Dados Reais
                </>
              )}
            </Button>
          </div>

          {client && <ClientInfo client={client} />}

          <AnalysisContent 
            isLoading={isLoading}
            error={error}
            analysis={analysis}
            client={client}
            rawApiResponse={rawApiResponse}
            debugInfo={debugInfo}
            testMetaToken={testMetaToken}
            testEdgeFunction={testEdgeFunction}
            handleOpenGraphExplorer={handleOpenGraphExplorer}
            handleMakeSampleRequest={handleMakeSampleRequest}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
