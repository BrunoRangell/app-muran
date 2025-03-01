
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle, Check, ExternalLink, Loader, Info } from "lucide-react";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { useMetaAdsAnalysis } from "@/components/revisao-nova/useMetaAdsAnalysis";
import { ClientSelector } from "@/components/revisao-nova/ClientSelector";
import { formatCurrency } from "@/utils/formatters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CampaignsTable } from "@/components/revisao-nova/CampaignsTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function RevisaoNova() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { 
    analysis, 
    client, 
    isLoading, 
    error, 
    fetchAnalysis,
    rawApiResponse
  } = useMetaAdsAnalysis();

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleAnalyze = () => {
    if (selectedClientId) {
      fetchAnalysis(selectedClientId);
    }
  };

  const renderDataSource = () => {
    if (!analysis) return null;
    
    return (
      <div className="text-sm text-gray-500 flex items-center gap-1 mt-2">
        <Info size={14} />
        <span>
          Dados obtidos diretamente da API do Meta Ads em tempo real.
        </span>
      </div>
    );
  };

  const renderRawResponseDebug = () => {
    if (!rawApiResponse) return null;
    
    return (
      <details className="mt-4 p-2 border border-dashed border-gray-300 rounded-md">
        <summary className="text-xs font-mono cursor-pointer text-gray-500">
          Resposta bruta da API (para depuração)
        </summary>
        <pre className="mt-2 bg-gray-50 p-2 rounded text-xs font-mono overflow-auto max-h-60">
          {JSON.stringify(rawApiResponse, null, 2)}
        </pre>
      </details>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader className="h-12 w-12 animate-spin text-[#ff6e00] mb-4" />
          <p className="text-lg">Conectando à API do Meta Ads e buscando dados reais...</p>
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
            Selecione um cliente acima e clique em "Analisar" para ver os dados reais do Meta Ads.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle>Dados reais do Meta Ads</AlertTitle>
          <AlertDescription>
            Os dados exibidos abaixo foram obtidos diretamente da API do Meta Ads e refletem os valores
            reais para o período de {analysis.meta.dateRange.start} a {analysis.meta.dateRange.end}.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TooltipProvider>
            <Card className="border-l-4 border-l-[#ff6e00]">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center">
                  Gastos Acumulados (Mês Atual)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 ml-2 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Valor real obtido diretamente da API do Meta Ads</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
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
          </TooltipProvider>
          
          <TooltipProvider>
            <Card className="border-l-4 border-l-[#321e32]">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center">
                  Orçamento Diário Atual
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 ml-2 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Valor configurado na conta do Meta Ads</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
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
          </TooltipProvider>
        </div>

        {analysis.meta.campaigns && analysis.meta.campaigns.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                Campanhas Ativas
                <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                  {analysis.meta.campaigns.length} campanhas
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 ml-2 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Dados reais obtidos da API do Meta Ads</p>
                  </TooltipContent>
                </Tooltip>
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

        {renderDataSource()}
        {renderRawResponseDebug()}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#321e32]">Revisão de Campanhas Meta Ads</h1>
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
                Buscar Dados Reais
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
