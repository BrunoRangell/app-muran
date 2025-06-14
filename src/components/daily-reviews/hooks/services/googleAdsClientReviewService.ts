import { supabase } from "@/lib/supabase";
import { clientProcessingService } from "./clientProcessingService";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";

export const googleAdsClientReviewService = {
  /**
   * Busca os dados detalhados de um cliente, incluindo informações do Google Ads.
   * @param clientId ID do cliente.
   * @returns Dados do cliente com informações do Google Ads.
   */
  getClientDetails: async (clientId: string) => {
    try {
      const { data: client, error } = await supabase
        .from("clients")
        .select(
          `
          id, 
          company_name, 
          meta_ads_budget,
          google_accounts(
            id, 
            account_name, 
            account_id
          ),
          daily_budget_reviews(
            id, 
            review_date, 
            meta_daily_budget_current,
            meta_total_spent,
            updated_at
          ),
          meta_account_id
        `
        )
        .eq("id", clientId)
        .single();

      if (error) {
        console.error("Erro ao buscar detalhes do cliente:", error);
        throw error;
      }

      return client;
    } catch (error) {
      console.error("Erro ao buscar detalhes do cliente:", error);
      throw error;
    }
  },

  /**
   * Realiza a análise e revisão do orçamento diário para um cliente específico do Google Ads.
   * @param clientId ID do cliente para o qual a revisão será realizada.
   * @returns Um objeto contendo o orçamento diário recomendado e o total gasto.
   */
  reviewClientBudget: async (clientId: string) => {
    try {
      // 1. Marcar o cliente como "em processamento"
      await clientProcessingService.markClientAsProcessing(clientId, true);

      // 2. Buscar os dados do cliente (incluindo contas Google Ads)
      const client = await googleAdsClientReviewService.getClientDetails(clientId);

      if (!client) {
        throw new Error(`Cliente com ID ${clientId} não encontrado.`);
      }

      if (!client.google_accounts || client.google_accounts.length === 0) {
        console.warn(`Cliente ${clientId} não possui contas Google Ads associadas.`);
        return {
          recommendedDailyBudget: 0,
          totalSpent: 0,
        };
      }

      // 3. Simular a coleta de dados do Google Ads (substitua pela lógica real)
      const simulatedTotalSpent = Math.random() * 1000; // Gasto total simulado
      const recommendedDailyBudget = Math.random() * 100; // Orçamento diário recomendado simulado

      // 4. Atualizar o registro de revisão diária no Supabase
      const reviewDate = new Date(); // Data da revisão
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .upsert(
          [
            {
              client_id: clientId,
              review_date: reviewDate.toISOString(),
              meta_daily_budget_current: recommendedDailyBudget,
              meta_total_spent: simulatedTotalSpent,
              platform: "google", // Especifica a plataforma como 'google'
            },
          ],
          { onConflict: ["client_id", "review_date"], ignoreDuplicates: false }
        )
        .select()

      if (error) {
        console.error("Erro ao inserir/atualizar revisão diária:", error);
        throw error;
      }

      // 5. Limpar o estado de "em processamento"
      await clientProcessingService.markClientAsProcessing(clientId, false);

      return {
        recommendedDailyBudget,
        totalSpent: simulatedTotalSpent,
      };
    } catch (error) {
      console.error("Erro ao revisar orçamento do cliente:", error);
      // Garantir que o cliente não fique preso no estado "em processamento"
      await clientProcessingService.markClientAsProcessing(clientId, false);
      throw error;
    }
  },

  /**
   * Busca o histórico de revisões de orçamento diário para um cliente específico.
   * @param clientId ID do cliente para o qual buscar o histórico.
   * @returns Um array de revisões de orçamento diário.
   */
  fetchReviewHistory: async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false });

      if (error) {
        console.error("Erro ao buscar histórico de revisões:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Erro ao buscar histórico de revisões:", error);
      throw error;
    }
  },

  /**
   * Busca a última revisão de orçamento diário para um cliente específico.
   * @param clientId ID do cliente para o qual buscar a última revisão.
   * @returns A última revisão de orçamento diário, se existir.
   */
  fetchLatestReview: async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Se não houver revisão, o erro será retornado. Não precisa logar como erro.
        return null;
      }

      return data;
    } catch (error) {
      console.error("Erro ao buscar última revisão:", error);
      throw error;
    }
  },
};
