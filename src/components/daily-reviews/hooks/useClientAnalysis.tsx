
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Interface para os parâmetros da análise
export interface AnalysisParams {
  clientId: string;
  accountId?: string | null;
}

export type AnalysisResultType = {
  clientId: string;
  success: boolean;
  data?: any;
  error?: string;
  accountId?: string | null;
};

export const useClientAnalysis = (
  onSuccess?: (result: AnalysisResultType) => void
) => {
  const { toast } = useToast();

  // Mutação para análise de um único cliente
  const analyzeMutation = useMutation({
    mutationFn: async (params: AnalysisParams): Promise<AnalysisResultType> => {
      const { clientId, accountId } = params;
      console.log("Analisando cliente:", clientId, accountId ? `(conta: ${accountId})` : '');

      // Buscar dados do cliente
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientError) {
        throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
      }

      // Se um accountId for fornecido, verificar se há uma conta específica
      let metaAccountId = client.meta_account_id;
      let metaAccountName = `Conta ${client.meta_account_id}`;

      if (accountId) {
        // Buscar detalhes da conta específica
        const { data: accountData, error: accountError } = await supabase
          .from("meta_accounts")
          .select("*")
          .eq("id", accountId)
          .single();
        
        if (!accountError && accountData) {
          metaAccountId = accountData.account_id;
          metaAccountName = accountData.account_name || `Conta ${accountData.account_id}`;
        } else {
          console.warn(`Conta não encontrada (${accountId}), usando conta principal`);
        }
      }

      if (!metaAccountId) {
        throw new Error("Cliente não possui Meta Account ID configurado");
      }

      // Buscar token do Meta Ads
      const { data: tokenData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .maybeSingle();

      if (tokenError || !tokenData?.value) {
        throw new Error("Token do Meta Ads não encontrado ou não configurado");
      }

      // Preparar datas para análise
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const dateRange = {
        start: startDate.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };

      console.log("Invocando função Edge do Meta Ads para cliente:", client.company_name, "com conta:", metaAccountId);

      // Chamar a função Edge para análise
      const { data, error } = await supabase.functions.invoke(
        "meta-budget-calculator",
        {
          body: {
            accountId: metaAccountId,
            accessToken: tokenData.value,
            dateRange,
            fetchSeparateInsights: true,
          },
        }
      );

      if (error) {
        console.error("Erro na função Edge:", error);
        throw new Error(`Erro na análise do cliente: ${error.message}`);
      }

      if (!data) {
        throw new Error("Resposta vazia da API");
      }

      console.log("Dados recebidos da API Meta:", data);

      // Buscar orçamento personalizado
      const today = now.toISOString().split("T")[0];
      const { data: customBudgetData } = await supabase
        .from("meta_custom_budgets")
        .select("id, budget_amount, start_date, end_date")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
        .maybeSingle();

      // Preparar informações de orçamento personalizado
      const customBudgetInfo = customBudgetData
        ? {
            using_custom_budget: true,
            custom_budget_id: customBudgetData.id,
            custom_budget_amount: customBudgetData.budget_amount,
          }
        : {
            using_custom_budget: false,
            custom_budget_id: null,
            custom_budget_amount: null,
          };

      // Extrair valores da resposta da API
      const metaDailyBudgetCurrent = data.totalDailyBudget || 0;
      const metaTotalSpent = data.totalSpent || 0;

      // Verificar se já existe revisão para hoje
      const currentDate = today;
      const { data: existingReview } = await supabase
        .from("daily_budget_reviews")
        .select("id")
        .eq("client_id", clientId)
        .eq("review_date", currentDate)
        .eq("meta_account_id", metaAccountId)
        .maybeSingle();

      // Salvar dados da revisão
      if (existingReview) {
        // Atualizar revisão existente
        await supabase
          .from("daily_budget_reviews")
          .update({
            meta_daily_budget_current: metaDailyBudgetCurrent,
            meta_total_spent: metaTotalSpent,
            ...customBudgetInfo,
            updated_at: now.toISOString(),
          })
          .eq("id", existingReview.id);
      } else {
        // Criar nova revisão
        await supabase.from("daily_budget_reviews").insert({
          client_id: clientId,
          review_date: currentDate,
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          meta_account_id: metaAccountId,
          meta_account_name: metaAccountName,
          ...customBudgetInfo,
        });
      }

      return {
        clientId,
        accountId,
        success: true,
        data: {
          metaDailyBudgetCurrent,
          metaTotalSpent,
          customBudget: customBudgetInfo,
        }
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Análise concluída",
        description: "Dados do cliente atualizados com sucesso",
      });

      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess(result);
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Adicionar o getter isAnalyzing para compatibilidade
  const isAnalyzing = analyzeMutation.isPending;

  return {
    analyzeMutation,
    isAnalyzing,
  };
};
