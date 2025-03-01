
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { SimpleAnalysisResult, SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";
import { Info, AlertCircle, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CampaignsTable } from "./CampaignsTable";

interface AnalysisResultProps {
  analysis: SimpleAnalysisResult;
}

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  // Verificação de segurança para garantir que temos dados para exibir
  if (!analysis?.meta) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro nos dados</AlertTitle>
        <AlertDescription>
          Não foi possível processar os dados da análise.
        </AlertDescription>
      </Alert>
    );
  }

  const hasCampaignsData = analysis.meta.campaigns && analysis.meta.campaigns.length > 0;
  
  // Certifique-se de que totalSpent é um número
  const totalSpent = typeof analysis.meta.totalSpent === 'number' 
    ? analysis.meta.totalSpent 
    : parseFloat(String(analysis.meta.totalSpent || "0"));
  
  // Certifique-se de que dailyBudget é um número
  const dailyBudget = typeof analysis.meta.dailyBudget === 'number' 
    ? analysis.meta.dailyBudget 
    : parseFloat(String(analysis.meta.dailyBudget || "0"));
  
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
        <Card className="border-l-4 border-l-[#ff6e00]">
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              Gastos Acumulados (Mês Atual)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 ml-2 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Valor real obtido diretamente da API do Meta Ads</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Período: {analysis.meta.dateRange.start} a {analysis.meta.dateRange.end}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-[#321e32]">
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              Orçamento Diário Atual
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 ml-2 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Valor configurado na conta do Meta Ads</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(dailyBudget)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Configurado na conta do Meta Ads
            </div>
          </CardContent>
        </Card>
      </div>

      {hasCampaignsData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              Campanhas Ativas
              <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                {analysis.meta.campaigns.length} campanhas
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 ml-2 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Dados reais obtidos da API do Meta Ads</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
}
