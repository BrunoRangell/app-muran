
import { supabase } from "@/lib/supabase";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview } from "../types/reviewTypes";

/**
 * Busca todos os clientes com suas revisões mais recentes (Google Ads)
 */
export const fetchClientsWithGoogleReviews = async (): Promise<ClientWithReview[]> => {
  console.log("Buscando clientes com revisões Google Ads...");
  
  try {
    // Buscar todos os clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("company_name");
      
    if (clientsError) {
      console.error("Erro ao buscar clientes:", clientsError);
      throw new Error("Erro ao buscar clientes: " + clientsError.message);
    }
    
    if (!clients || clients.length === 0) {
      return [];
    }
    
    // Buscar revisões mais recentes para cada cliente
    const today = getCurrentDateInBrasiliaTz();
    const formattedDate = today.toISOString().split('T')[0];
    
    const { data: reviews, error: reviewsError } = await supabase
      .from("client_current_reviews")
      .select("*")
      .eq("review_date", formattedDate);
    
    if (reviewsError) {
      console.error("Erro ao buscar revisões:", reviewsError);
      throw new Error("Erro ao buscar revisões: " + reviewsError.message);
    }
    
    // Mapear clientes para incluir a revisão mais recente
    const clientsWithReviews = clients.map(client => {
      // Buscar a revisão deste cliente para hoje
      const clientReview = reviews?.find(r => r.client_id === client.id);
      
      return {
        ...client,
        lastReview: clientReview || null,
        needsBudgetAdjustment: false
      };
    });
    
    return clientsWithReviews;
  } catch (error) {
    console.error("Erro ao buscar clientes com revisões:", error);
    throw error;
  }
};

/**
 * Realiza a revisão de orçamento diário de um cliente no Google Ads
 */
export const reviewGoogleClient = async (client: ClientWithReview): Promise<void> => {
  console.log(`Iniciando revisão Google Ads para cliente: ${client.company_name}`);
  
  try {
    // Verificar se o cliente tem ID de conta Google Ads
    if (!client.google_account_id) {
      throw new Error("Cliente não possui ID de conta Google Ads configurado");
    }
    
    // Obter a data atual (Brasília)
    const today = getCurrentDateInBrasiliaTz();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Obter orçamento mensal e dias restantes para cálculos
    const monthlyBudget = client.google_ads_budget || 0;
    
    // Simular valores para Google Ads (em um cenário real, esses dados viriam da API do Google)
    const currentDailyBudget = monthlyBudget / 30; // Simplificação para exemplo
    const totalSpent = monthlyBudget * 0.6; // Simulação: 60% do orçamento gasto
    
    // Calcular dias restantes no mês
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
    
    // Calcular orçamento diário ideal
    const remainingBudget = monthlyBudget - totalSpent;
    const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    
    console.log(`Cliente ${client.company_name} - Valores Google Ads calculados:`, {
      orçamentoMensal: monthlyBudget,
      orçamentoDiárioAtual: currentDailyBudget,
      gastoTotal: totalSpent,
      orçamentoRestante: remainingBudget,
      diasRestantes: remainingDays,
      orçamentoDiárioIdeal: idealDailyBudget
    });
    
    // Verificar se já existe uma revisão para este cliente na data atual
    const { data: existingReview, error: reviewError } = await supabase
      .from("client_current_reviews")
      .select("id")
      .eq("client_id", client.id)
      .eq("review_date", formattedDate)
      .single();
    
    if (reviewError && reviewError.code !== "PGRST116") { // PGRST116 = Not found, não é um erro nesse caso
      console.error("Erro ao verificar revisão existente:", reviewError);
      throw new Error("Erro ao verificar revisão existente: " + reviewError.message);
    }
    
    if (existingReview) {
      // Atualizar revisão existente
      const { error: updateError } = await supabase
        .from("client_current_reviews")
        .update({
          meta_daily_budget_current: currentDailyBudget,
          meta_total_spent: totalSpent,
          meta_account_id: client.google_account_id,
          meta_account_name: `Google Ads: ${client.google_account_id}`,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingReview.id);
        
      if (updateError) {
        console.error("Erro ao atualizar revisão:", updateError);
        throw new Error("Erro ao atualizar revisão: " + updateError.message);
      }
      
      console.log(`Revisão Google Ads atualizada para cliente ${client.company_name}`);
    } else {
      // Criar nova revisão
      const { error: insertError } = await supabase
        .from("client_current_reviews")
        .insert({
          client_id: client.id,
          review_date: formattedDate,
          meta_daily_budget_current: currentDailyBudget,
          meta_total_spent: totalSpent,
          meta_account_id: client.google_account_id,
          meta_account_name: `Google Ads: ${client.google_account_id}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error("Erro ao criar revisão:", insertError);
        throw new Error("Erro ao criar revisão: " + insertError.message);
      }
      
      console.log(`Nova revisão Google Ads criada para cliente ${client.company_name}`);
    }
    
    return;
  } catch (error) {
    console.error(`Erro ao revisar cliente Google Ads ${client.company_name}:`, error);
    throw error;
  }
};
