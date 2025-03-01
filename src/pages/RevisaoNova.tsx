
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle, Check, ExternalLink, Loader, Info, AlertTriangle, Copy } from "lucide-react";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { useMetaAdsAnalysis } from "@/components/revisao-nova/useMetaAdsAnalysis";
import { ClientSelector } from "@/components/revisao-nova/ClientSelector";
import { formatCurrency } from "@/utils/formatters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CampaignsTable } from "@/components/revisao-nova/CampaignsTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { TokensSetupForm } from "@/components/daily-reviews/TokensSetupForm";

export default function RevisaoNova() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { toast } = useToast();
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

  const handleCopyToken = () => {
    if (rawApiResponse?.token) {
      navigator.clipboard.writeText(rawApiResponse.token);
      toast({
        title: "Token copiado",
        description: "O token foi copiado para a área de transferência.",
      });
    }
  };

  const handleCopyApiUrl = () => {
    if (client?.meta_account_id) {
      const url = `https://graph.facebook.com/v20.0/act_${client.meta_account_id}/campaigns?fields=status,name,spend,insights{spend}&access_token=TOKEN`;
      navigator.clipboard.writeText(url);
      toast({
        title: "URL copiada",
        description: "A URL da API foi copiada para a área de transferência. Substitua TOKEN pelo token real.",
      });
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

  const renderApiErrorDetails = () => {
    if (!rawApiResponse?.error) return null;
    
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Detalhes técnicos do erro</AlertTitle>
        <AlertDescription>
          <div className="font-mono text-xs mt-2">
            <p>Nome do erro: {rawApiResponse.error.name || 'Desconhecido'}</p>
            <p>Mensagem: {rawApiResponse.error.message || 'Nenhuma mensagem disponível'}</p>
            {rawApiResponse.error.details && (
              <details>
                <summary className="cursor-pointer mt-1">Stack trace</summary>
                <pre className="mt-1 bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {rawApiResponse.error.details}
                </pre>
              </details>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  const renderApiTestTools = () => {
    if (!client?.meta_account_id) return null;
    
    return (
      <Alert className="mt-4 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle>Ferramentas de diagnóstico</AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-2">
            <div>
              <p className="text-sm mb-1">URL para testar no Graph API Explorer:</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 p-1 text-xs rounded flex-1 overflow-x-auto">
                  https://graph.facebook.com/v20.0/act_{client.meta_account_id}/campaigns?fields=status,name,spend
                </code>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyApiUrl}
                  className="shrink-0"
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://developers.facebook.com/tools/explorer/`, '_blank')}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir Graph API Explorer
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://business.facebook.com/settings/ad-accounts`, '_blank')}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Verificar Contas de Anúncios
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
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
        <div className="space-y-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro na análise</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          {renderApiErrorDetails()}
          {renderApiTestTools()}
          {renderRawResponseDebug()}
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mt-4">
            <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
              <AlertTriangle size={18} />
              <span>Sugestões para solução:</span>
            </div>
            <ul className="list-disc pl-6 space-y-1 text-amber-700">
              <li>Verifique se o token de acesso do Meta Ads está correto e não expirou</li>
              <li>Confirme se o ID da conta Meta Ads está correto para este cliente</li>
              <li>Verifique se a conta Meta Ads tem permissões para acessar as campanhas</li>
              <li>Tente novamente em alguns minutos caso seja um problema temporário</li>
            </ul>
          </div>
        </div>
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

    // Se temos uma resposta mas não foi bem-sucedida
    if (analysis && !analysis.success) {
      return (
        <div className="space-y-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro na API do Meta Ads</AlertTitle>
            <AlertDescription>{analysis.message}</AlertDescription>
          </Alert>
          
          {renderApiErrorDetails()}
          {renderApiTestTools()}
          {renderRawResponseDebug()}
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mt-4">
            <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
              <AlertTriangle size={18} />
              <span>Sugestões para solução:</span>
            </div>
            <ul className="list-disc pl-6 space-y-1 text-amber-700">
              <li>Verifique se o token de acesso do Meta Ads está correto e não expirou</li>
              <li>Confirme se o ID da conta Meta Ads está correto para este cliente</li>
              <li>Verifique se a conta Meta Ads tem permissões para acessar as campanhas</li>
              <li>Tente novamente em alguns minutos caso seja um problema temporário</li>
            </ul>
          </div>
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

        {client && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-semibold text-lg">{client.company_name}</div>
            <div className="text-sm text-gray-600 flex items-center">
              ID Meta Ads: 
              <code className="mx-1 bg-gray-100 px-1 rounded">{client.meta_account_id || "Não configurado"}</code>
              {client.meta_account_id && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => window.open(`https://business.facebook.com/adsmanager/manage/campaigns?act=${client.meta_account_id}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver no Meta Ads
                </Button>
              )}
            </div>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
}
