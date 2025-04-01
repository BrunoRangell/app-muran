
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export type AnalysisResultType = {
  clientId: string;
  success: boolean;
  data?: any;
  error?: string;
};

export const useClientAnalysis = (
  onSuccess?: (result: AnalysisResultType) => void
) => {
  const { toast } = useToast();

  // Mutação para análise de um único cliente
  const analyzeMutation = useMutation({
    mutationFn: async (clientId: string): Promise<AnalysisResultType> => {
      console.log("Analisando cliente:", clientId);

      // Buscar dados do cliente
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientError) {
        throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
      }

      if (!client.meta_account_id) {
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

      console.log("Invocando função Edge do Meta Ads para cliente:", client.company_name);

      // Chamar a função Edge para análise
      const { data, error } = await supabase.functions.invoke(
        "meta-budget-calculator",
        {
          body: {
            accountId: client.meta_account_id,
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
          meta_account_id: client.meta_account_id,
          meta_account_name: `Conta ${client.meta_account_id}`,
          ...customBudgetInfo,
        });
      }

      return {
        clientId,
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

  return {
    analyzeMutation,
  };
};
