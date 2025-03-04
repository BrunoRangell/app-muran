
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, Loader, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MetaAdsBudgetCardProps {
  clientId: string;
  metaAccountId: string | null;
}

interface Campaign {
  id: string;
  name: string;
  budget: number;
  status: string;
  type: 'campaign' | 'adset';
  parentName?: string;
}

export const MetaAdsBudgetCard = ({ clientId, metaAccountId }: MetaAdsBudgetCardProps) => {
  const [dailyBudget, setDailyBudget] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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
                            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                              item.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status === 'ACTIVE' ? 'Ativo' : item.status}
                            </span>
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
            
            <p className="text-sm text-gray-500">
              Total dos orçamentos diários de campanhas e conjuntos de anúncios ativos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

