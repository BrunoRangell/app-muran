
import { Loader } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { AnalysisResult } from "./AnalysisResult";
import { DataSource } from "./DataSource";
import { DebugInfo } from "./DebugInfo";
import { ErrorContent } from "./ErrorContent";
import { useEffect, useState } from "react";

interface AnalysisContentProps {
  isLoading: boolean;
  error: string | null;
  analysis: SimpleAnalysisResult | null;
  client: any;
  rawApiResponse: any;
  debugInfo: any;
  testMetaToken: () => Promise<boolean | void>;
  testEdgeFunction: () => Promise<boolean | void>;
  handleOpenGraphExplorer: () => void;
  handleMakeSampleRequest: () => void;
}

export function AnalysisContent({
  isLoading,
  error,
  analysis,
  client,
  rawApiResponse,
  debugInfo,
  testMetaToken,
  testEdgeFunction,
  handleOpenGraphExplorer,
  handleMakeSampleRequest
}: AnalysisContentProps) {
  // Estado local para evitar atualizações muito frequentes
  const [isActuallyLoading, setIsActuallyLoading] = useState(false);
  
  // Usar useEffect para debounce do estado de loading
  useEffect(() => {
    let timer: any;
    
    if (isLoading) {
      // Defina um pequeno delay para mostrar o estado de carregamento
      timer = setTimeout(() => {
        setIsActuallyLoading(true);
      }, 100);
    } else {
      // Adicione um pequeno delay para desativar o loading
      timer = setTimeout(() => {
        setIsActuallyLoading(false);
      }, 300);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isLoading]);

  // Renderização do estado de carregamento
  if (isActuallyLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader className="h-12 w-12 animate-spin text-[#ff6e00] mb-4" />
        <p className="text-lg">Conectando à API do Meta Ads e buscando dados reais...</p>
      </div>
    );
  }

  // Verificação específica para erro de corpo vazio para fornecer uma mensagem mais clara
  const isEmptyRequestBodyError = error?.includes('Corpo da requisição vazio') || 
    rawApiResponse?.error?.message?.includes('Corpo da requisição vazio');

  if (error) {
    return (
      <ErrorContent 
        error={error}
        rawApiResponse={rawApiResponse}
        debugInfo={debugInfo}
        isLoading={isLoading}
        client={client}
        testMetaToken={testMetaToken}
        testEdgeFunction={testEdgeFunction}
        handleOpenGraphExplorer={handleOpenGraphExplorer}
        handleMakeSampleRequest={handleMakeSampleRequest}
      />
    );
  }

  // Verificação mais rigorosa para null ou undefined
  if (!analysis) {
    return (
      <div className="text-center p-12 border rounded-lg bg-gray-50">
        <p className="text-lg text-gray-600">
          Selecione um cliente acima e clique em "Analisar" para ver os dados reais do Meta Ads.
        </p>
      </div>
    );
  }

  // Verificação explícita para objeto analysis com success=false
  if (analysis && analysis.success === false) {
    return (
      <ErrorContent 
        error={analysis.message || "Erro desconhecido na análise"}
        rawApiResponse={rawApiResponse}
        debugInfo={debugInfo}
        isLoading={isLoading}
        client={client}
        testMetaToken={testMetaToken}
        testEdgeFunction={testEdgeFunction}
        handleOpenGraphExplorer={handleOpenGraphExplorer}
        handleMakeSampleRequest={handleMakeSampleRequest}
      />
    );
  }

  // Verificação adicional para garantir que meta existe no analysis antes de renderizar AnalysisResult
  const canShowAnalysisResult = Boolean(analysis && analysis.meta);
  
  // Obter o orçamento mensal do cliente, se disponível
  const monthlyBudget = client?.meta_ads_budget || null;

  return (
    <div className="space-y-6">
      {/* Verificação extra para garantir que o analysis tem todos os dados necessários */}
      {canShowAnalysisResult && (
        <AnalysisResult 
          analysis={analysis} 
          monthlyBudget={monthlyBudget}
        />
      )}

      <Tabs defaultValue="details" className="mt-6">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="debug">Diagnóstico</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          {analysis && <DataSource analysis={analysis} />}
        </TabsContent>
        <TabsContent value="debug">
          <DebugInfo debugInfo={debugInfo} rawApiResponse={rawApiResponse} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
