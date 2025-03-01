
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle, Check, ExternalLink, Loader } from "lucide-react";
import { SimpleMetaData, SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { useMetaAdsAnalysis } from "@/components/revisao-nova/useMetaAdsAnalysis";
import { ClientSelector } from "@/components/revisao-nova/ClientSelector";
import { formatCurrency } from "@/utils/formatters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CampaignsTable } from "@/components/revisao-nova/CampaignsTable";

export default function RevisaoNova() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { 
    analysis, 
    client, 
    isLoading, 
    error, 
    fetchAnalysis 
  } = useMetaAdsAnalysis();

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleAnalyze = () => {
    if (selectedClientId) {
      fetchAnalysis(selectedClientId);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader className="h-12 w-12 animate-spin text-[#ff6e00] mb-4" />
          <p className="text-lg">Conectando à API do Meta Ads e buscando dados...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro na análise</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!analysis) {
      return (
        <div className="text-center p-12 border rounded-lg bg-gray-50">
          <p className="text-lg text-gray-600">
            Selecione um cliente acima e clique em "Analisar" para ver os dados do Meta Ads.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-l-4 border-l-[#ff6e00]">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Gastos Acumulados (Mês Atual)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(analysis.meta.totalSpent)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Período: {analysis.meta.dateRange.start} a {analysis.meta.dateRange.end}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-[#321e32]">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Orçamento Diário Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(analysis.meta.dailyBudget)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Configurado na conta do Meta Ads
              </div>
            </CardContent>
          </Card>
        </div>

        {analysis.meta.campaigns && analysis.meta.campaigns.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                Campanhas Ativas
                <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                  {analysis.meta.campaigns.length} campanhas
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignsTable campaigns={analysis.meta.campaigns} />
            </CardContent>
          </Card>
        )}

        <Alert variant={analysis.success ? "default" : "destructive"} className="mt-4">
          {analysis.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{analysis.success ? "Análise concluída" : "Erro na análise"}</AlertTitle>
          <AlertDescription>{analysis.message}</AlertDescription>
        </Alert>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#321e32]">Revisão Nova</h1>
        <a 
          href="https://business.facebook.com/adsmanager/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-gray-600 hover:text-[#ff6e00] flex items-center"
        >
          Abrir Meta Ads <ExternalLink className="ml-1 h-3 w-3" />
        </a>
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
                Analisar
              </>
            )}
          </Button>
        </div>

        {client && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-semibold text-lg">{client.company_name}</div>
            <div className="text-sm text-gray-600">
              ID Meta Ads: {client.meta_account_id || "Não configurado"}
            </div>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
}
