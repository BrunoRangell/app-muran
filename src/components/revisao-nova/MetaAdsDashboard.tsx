
import { useState, useEffect } from "react";
import { ClientSelector } from "./ClientSelector";
import { AnalysisContent } from "./AnalysisContent";
import { useMetaAdsAnalysis } from "./useMetaAdsAnalysis";
import { Button } from "@/components/ui/button";
import { Search, RefreshCcw } from "lucide-react";
import { NextReviewCountdown } from "@/components/daily-reviews/dashboard/components/NextReviewCountdown";

export function MetaAdsDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const {
    client,
    analysis,
    isLoading,
    error,
    fetchAnalysis,
    rawApiResponse,
    debugInfo,
    testMetaToken,
    testEdgeFunction
  } = useMetaAdsAnalysis();
  
  // Agora removemos a chamada automática ao fetchAnalysis
  // e deixamos apenas o handleAnalyzeClient para ser chamado pelo usuário
  
  const handleAnalyzeClient = (clientId: string) => {
    if (clientId) {
      setSelectedClientId(clientId);
      fetchAnalysis(clientId);
    }
  };
  
  const handleOpenGraphExplorer = () => {
    window.open("https://developers.facebook.com/tools/explorer/", "_blank");
  };
  
  const handleMakeSampleRequest = () => {
    if (selectedClientId) {
      fetchAnalysis(selectedClientId);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex-grow md:max-w-md">
          <ClientSelector 
            onClientSelect={handleAnalyzeClient}
            showSearch={true}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            icon={<Search className="h-4 w-4 text-gray-400" />}
            buttonText="Analisar"
            buttonIcon={<RefreshCcw className="h-4 w-4 mr-2" />}
          />
        </div>
        
        <div className="md:ml-auto">
          <NextReviewCountdown />
        </div>
      </div>
      
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
  );
}
