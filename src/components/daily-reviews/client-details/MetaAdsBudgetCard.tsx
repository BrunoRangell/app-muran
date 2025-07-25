
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, Loader, ChevronDown, ChevronUp, Info, PieChart } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface MetaAdsBudgetCardProps {
  clientId: string;
  metaAccountId: string | null;
}

interface Campaign {
  id: string;
  name: string;
  budget: number;
  status: string;
  effectiveStatus?: string;
  type: 'campaign' | 'adset';
  parentName?: string;
  parentId?: string;
}

interface Diagnostics {
  totalCampaigns: number;
  includedItems: number;
  skippedCampaigns: {
    id: string;
    name: string;
    reason: string;
    details: any;
  }[];
  statusCounts?: Record<string, number>;
}

export const MetaAdsBudgetCard = ({ clientId, metaAccountId }: MetaAdsBudgetCardProps) => {
  const [dailyBudget, setDailyBudget] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isStatusInfoOpen, setIsStatusInfoOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!metaAccountId) {
      setError("ID da conta Meta Ads não configurado para este cliente");
      return;
    }

    const calculateTotalDailyBudget = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Buscar o token de acesso do Meta
        const { data: tokenData, error: tokenError } = await supabase
          .from("api_tokens")
          .select("value")
          .eq("name", "meta_access_token")
          .maybeSingle();

        if (tokenError) {
          throw new Error(`Erro ao buscar token Meta Ads: ${tokenError.message}`);
        }

        if (!tokenData?.value) {
          throw new Error("Token Meta Ads não encontrado ou não configurado");
        }

        const accessToken = tokenData.value;

        // Chamar a função Edge para realizar o cálculo do orçamento diário total
        const { data: result, error: edgeFunctionError } = await supabase.functions.invoke(
          "meta-budget-calculator", 
          {
            body: {
              accountId: metaAccountId,
              accessToken: accessToken
            }
          }
        );

        if (edgeFunctionError) {
          throw new Error(`Erro na função Edge: ${edgeFunctionError.message}`);
        }

        if (!result) {
          throw new Error("A função retornou dados vazios ou inválidos");
        }

        console.log("Resultado da função Edge:", result);
        
        if (result.error) {
          throw new Error(result.error);
        }

        // Atualizar o estado com o valor calculado e detalhes das campanhas
        setDailyBudget(result.totalDailyBudget || 0);
        
        // Verificar se há detalhes de campanhas na resposta
        if (result.campaignDetails && Array.isArray(result.campaignDetails)) {
          setCampaigns(result.campaignDetails);
        }

        // Armazenar informações de diagnóstico
        if (result.diagnostics) {
          setDiagnostics(result.diagnostics);
        }
      } catch (err: any) {
        console.error("Erro ao calcular orçamento diário Meta Ads:", err);
        setError(err.message || "Erro ao calcular orçamento diário Meta Ads");
        toast({
          title: "Erro ao obter orçamento Meta Ads",
          description: err.message || "Não foi possível calcular o orçamento diário atual",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculateTotalDailyBudget();
  }, [metaAccountId, toast]);

  // Agrupar e contar campanhas por razão de exclusão
  const getSkippedCampaignsByReason = () => {
    if (!diagnostics?.skippedCampaigns) return {};
    
    const reasonCounts: Record<string, number> = {};
    
    diagnostics.skippedCampaigns.forEach(campaign => {
      // Simplificar razões semelhantes para melhor agrupamento
      let simplifiedReason = campaign.reason;
      
      // Simplificar razões status-related
      if (simplifiedReason.includes("Status não ativo")) {
        simplifiedReason = "Status não ativo";
      } else if (simplifiedReason.includes("Effective status não ativo")) {
        simplifiedReason = "Status efetivo não ativo";
      } else if (simplifiedReason.includes("Data de término")) {
        simplifiedReason = "Data de término já passou";
      } else if (simplifiedReason.includes("Sem orçamento diário definido")) {
        simplifiedReason = "Sem orçamento diário definido";
      }
      
      reasonCounts[simplifiedReason] = (reasonCounts[simplifiedReason] || 0) + 1;
    });
    
    return reasonCounts;
  };

  const skippedReasons = getSkippedCampaignsByReason();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muran-primary" />
          Orçamento Diário Meta Ads
        </CardTitle>
        <CardDescription>
          Calculado a partir das campanhas e conjuntos de anúncios ativos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader className="h-5 w-5 animate-spin text-muran-primary" />
            <span>Calculando orçamento...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-md">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">{error}</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-2xl font-bold text-muran-primary">
              {formatCurrency(dailyBudget || 0)}
            </div>
            
            {diagnostics && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span>{diagnostics.totalCampaigns} campanhas totais</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                          <Info className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Total de campanhas na conta Meta Ads, incluindo todas as campanhas ativas e inativas.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <span>•</span>
                
                <div className="flex items-center gap-1">
                  <span>{diagnostics.includedItems} itens no cálculo</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                          <Info className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Número de campanhas e conjuntos de anúncios ativos que contribuem para o orçamento diário.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <span>•</span>
                
                <div className="flex items-center gap-1">
                  <span>{diagnostics.skippedCampaigns.length} campanhas ignoradas</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0"
                          onClick={() => setIsStatusInfoOpen(!isStatusInfoOpen)}
                        >
                          <PieChart className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Campanhas que não contribuem para o orçamento diário. Clique para ver estatísticas por status.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
            
            {/* Painel colapsável para detalhes de status */}
            {diagnostics?.statusCounts && (
              <Collapsible 
                open={isStatusInfoOpen} 
                onOpenChange={setIsStatusInfoOpen}
                className="border rounded-md mt-4 bg-gray-50"
              >
                <div className="flex items-center justify-between p-3 border-b">
                  <p className="text-sm font-medium">Estatísticas de status das campanhas</p>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-auto">
                      {isStatusInfoOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="p-4 text-sm">
                    <div className="mb-3">
                      <p className="font-medium mb-2">Motivos de exclusão:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(skippedReasons).map(([reason, count]) => (
                          <Badge key={reason} variant="outline" className="bg-gray-100">
                            {reason}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">Status das campanhas:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(diagnostics.statusCounts).map(([status, count]) => {
                          const [statusValue, effectiveStatus] = status.split(':');
                          const isActive = statusValue === 'ACTIVE' && effectiveStatus === 'ACTIVE';
                          
                          return (
                            <Badge 
                              key={status} 
                              variant="outline" 
                              className={`${isActive ? 'bg-green-100' : 'bg-gray-100'}`}
                            >
                              {statusValue}/{effectiveStatus}: {count}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            <Collapsible 
              open={isOpen} 
              onOpenChange={setIsOpen}
              className="border rounded-md mt-4"
            >
              <div className="flex items-center justify-between p-3 border-b">
                <p className="text-sm font-medium">Detalhamento de orçamentos</p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent>
                <div className="p-3 space-y-1 text-sm max-h-80 overflow-y-auto">
                  {campaigns.length > 0 ? (
                    campaigns.map((item, index) => (
                      <div 
                        key={`${item.id}-${index}`} 
                        className={`py-1.5 px-2 rounded ${index % 2 === 0 ? 'bg-gray-50' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              {item.type === 'adset' && (
                                <div className="w-4 ml-4 mr-1 border-l-2 border-b-2 h-3 border-gray-300" />
                              )}
                              <p className={`truncate ${item.type === 'adset' ? 'text-xs text-gray-600' : 'font-medium'}`}>
                                {item.name}
                              </p>
                            </div>
                            {item.type === 'adset' && item.parentName && (
                              <p className="text-xs text-gray-500 ml-9">
                                Campanha: {item.parentName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                    item.status === 'ACTIVE' && item.effectiveStatus === 'ACTIVE'
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {item.status === 'ACTIVE' && item.effectiveStatus === 'ACTIVE' ? 'Ativo' : item.status}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p>Status: {item.status}<br />Status Efetivo: {item.effectiveStatus}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="font-medium">{formatCurrency(item.budget)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-3">
                      Nenhum detalhe de campanha disponível
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {diagnostics && diagnostics.skippedCampaigns.length > 0 && (
              <Collapsible 
                open={isDiagnosticsOpen} 
                onOpenChange={setIsDiagnosticsOpen}
                className="border rounded-md mt-4 border-amber-200"
              >
                <div className="flex items-center justify-between p-3 border-b border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-900">Campanhas não incluídas ({diagnostics.skippedCampaigns.length})</p>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-auto text-amber-700">
                      {isDiagnosticsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="p-3 space-y-1 text-sm max-h-80 overflow-y-auto bg-amber-50/30">
                    {diagnostics.skippedCampaigns.map((item, index) => (
                      <div 
                        key={`skipped-${item.id}-${index}`} 
                        className={`py-1.5 px-2 rounded ${index % 2 === 0 ? 'bg-amber-50/60' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-amber-900">{item.name}</p>
                            <p className="text-xs text-amber-700 mt-0.5">{item.reason}</p>
                            {item.details && (
                              <div className="text-xs text-amber-600 mt-1">
                                {item.details.status && <span>Status: {item.details.status}</span>}
                                {item.details.effectiveStatus && <span> • Efetivo: {item.details.effectiveStatus}</span>}
                                {item.details.dailyBudget !== undefined && <span> • Orçamento: {formatCurrency(item.details.dailyBudget)}</span>}
                                {item.details.activeAdsets !== undefined && <span> • AdSets ativos: {item.details.activeAdsets}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            <p className="text-sm text-gray-500">
              Total dos orçamentos diários de campanhas e conjuntos de anúncios ativos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
