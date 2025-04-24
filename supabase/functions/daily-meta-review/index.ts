
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  clientId: string;
  metaAccountId?: string;
  reviewDate?: string;
  metaAccountName?: string;
  metaBudgetAmount?: number;
}

serve(async (req: Request) => {
  // Tratar CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com chave de serviço
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrair dados do corpo da requisição
    const requestBody: RequestBody = await req.json();
    const { 
      clientId, 
      metaAccountId, 
      reviewDate = new Date().toISOString().split("T")[0],
      metaAccountName,
      metaBudgetAmount
    } = requestBody;

    console.log(`Iniciando revisão para cliente ${clientId} com conta Meta ${metaAccountId || "padrão"}`);

    if (!clientId) {
      throw new Error("ID do cliente é obrigatório");
    }

    // Buscar informações do cliente
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError) {
      throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
    }

    // Valores padrão
    let accountId = metaAccountId || client.meta_account_id;
    let budgetAmount = client.meta_ads_budget;
    let accountName = "Conta Principal";
    
    // Verificar se devemos usar uma conta Meta específica
    if (metaAccountId) {
      // Se temos o nome e orçamento enviados na requisição
      if (metaAccountName && metaBudgetAmount !== undefined) {
        accountName = metaAccountName;
        budgetAmount = metaBudgetAmount;
      } else {
        // Buscar detalhes da conta Meta específica
        const { data: metaAccount, error: accountError } = await supabase
          .from("client_meta_accounts")
          .select("*")
          .eq("client_id", clientId)
          .eq("account_id", metaAccountId)
          .maybeSingle();

        if (accountError) {
          console.error(`Erro ao buscar conta Meta: ${accountError.message}`);
          // Continuar com os valores padrão
        } else if (metaAccount) {
          accountName = metaAccount.account_name || "Conta Secundária";
          budgetAmount = metaAccount.budget_amount || client.meta_ads_budget;
        }
      }
    }

    // Verificar se existe orçamento personalizado ativo
    const today = new Date().toISOString().split("T")[0];
    const { data: customBudget, error: customBudgetError } = await supabase
      .from("meta_custom_budgets")
      .select("*")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (customBudgetError) {
      console.error(`Erro ao buscar orçamento personalizado: ${customBudgetError.message}`);
      // Continuar com o orçamento padrão
    }

    const usingCustomBudget = !!customBudget;
    
    // Se estiver usando orçamento personalizado e não uma conta específica
    if (usingCustomBudget && !metaAccountId) {
      budgetAmount = customBudget?.budget_amount || budgetAmount;
    }

    console.log(`Usando orçamento personalizado: ${usingCustomBudget}`);
    console.log(`Orçamento usado: ${budgetAmount} para conta ${accountName} (${accountId})`);

    // Simular gasto total (em produção, isso seria calculado com base nos dados reais)
    const totalSpent = budgetAmount * 0.65; // Simulação: 65% do orçamento mensal foi gasto

    // Calcular orçamento diário ideal
    const currentDate = new Date();
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    const remainingDays = lastDayOfMonth.getDate() - currentDate.getDate() + 1;

    const idealDailyBudget = remainingDays > 0
      ? (budgetAmount - totalSpent) / remainingDays
      : 0;

    // Arredondar para duas casas decimais
    const roundedIdealDailyBudget = Math.round(idealDailyBudget * 100) / 100;
    
    // Verificar se já existe uma revisão atual para este cliente e conta específica
    const { data: existingReview, error: existingReviewError } = await supabase
      .from("daily_budget_reviews")
      .select("*")
      .eq("client_id", clientId)
      .eq("review_date", reviewDate)
      .eq("meta_account_id", accountId || "")
      .maybeSingle();

    if (existingReviewError && existingReviewError.code !== "PGRST116") {
      console.error(`Erro ao verificar revisão existente: ${existingReviewError.message}`);
    }

    let reviewId;
    
    if (existingReview) {
      // Atualizar revisão existente
      const { error: updateError } = await supabase
        .from("daily_budget_reviews")
        .update({
          meta_daily_budget_current: roundedIdealDailyBudget,
          meta_total_spent: totalSpent,
          using_custom_budget: usingCustomBudget,
          custom_budget_id: customBudget?.id || null,
          custom_budget_amount: usingCustomBudget ? customBudget?.budget_amount : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id);

      if (updateError) {
        throw new Error(`Erro ao atualizar revisão: ${updateError.message}`);
      }
      
      reviewId = existingReview.id;
      console.log(`Revisão existente atualizada: ${reviewId}`);
    } else {
      // Criar nova revisão
      const { data: newReview, error: insertError } = await supabase
        .from("daily_budget_reviews")
        .insert({
          client_id: clientId,
          review_date: reviewDate,
          meta_daily_budget_current: roundedIdealDailyBudget,
          meta_total_spent: totalSpent,
          meta_account_id: accountId || null,
          meta_account_name: accountName || null,
          using_custom_budget: usingCustomBudget,
          custom_budget_id: customBudget?.id || null,
          custom_budget_amount: usingCustomBudget ? customBudget?.budget_amount : null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erro ao inserir nova revisão: ${insertError.message}`);
      }
      
      reviewId = newReview.id;
      console.log(`Nova revisão criada: ${reviewId}`);
    }

    // Registrar na tabela client_current_reviews para referência rápida ao estado atual
    const { data: currentReview, error: currentReviewError } = await supabase
      .from("client_current_reviews")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (currentReviewError && currentReviewError.code !== "PGRST116") {
      console.error(`Erro ao verificar revisão atual: ${currentReviewError.message}`);
    }

    const currentReviewData = {
      client_id: clientId,
      review_date: reviewDate,
      meta_daily_budget_current: roundedIdealDailyBudget,
      meta_total_spent: totalSpent,
      meta_account_id: accountId,
      meta_account_name: accountName,
      using_custom_budget: usingCustomBudget,
      custom_budget_id: customBudget?.id || null,
      custom_budget_amount: usingCustomBudget ? customBudget?.budget_amount : null,
    };

    if (currentReview) {
      // Atualizar revisão atual
      const { error: updateCurrentError } = await supabase
        .from("client_current_reviews")
        .update(currentReviewData)
        .eq("id", currentReview.id);

      if (updateCurrentError) {
        console.error(`Erro ao atualizar revisão atual: ${updateCurrentError.message}`);
      }
    } else {
      // Inserir nova revisão atual
      const { error: insertCurrentError } = await supabase
        .from("client_current_reviews")
        .insert(currentReviewData);

      if (insertCurrentError) {
        console.error(`Erro ao inserir revisão atual: ${insertCurrentError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reviewId,
        clientId,
        accountId,
        accountName,
        idealDailyBudget: roundedIdealDailyBudget,
        totalSpent,
        budgetAmount,
        usingCustomBudget,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro na função Edge:", error.message);
    
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
