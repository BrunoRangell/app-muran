
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, Loader } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface MetaAdsBudgetCardProps {
  clientId: string;
  metaAccountId: string | null;
}

export const MetaAdsBudgetCard = ({ clientId, metaAccountId }: MetaAdsBudgetCardProps) => {
  const [dailyBudget, setDailyBudget] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

        // Atualizar o estado com o valor calculado
        setDailyBudget(result.totalDailyBudget || 0);
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
            <p className="text-sm text-gray-500">
              Total dos orçamentos diários de campanhas e conjuntos de anúncios ativos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
