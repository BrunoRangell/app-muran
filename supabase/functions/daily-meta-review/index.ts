
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { corsHeaders } from "../_shared/cors.ts";

// Definição de tipos
interface RequestBody {
  clientId: string;
  metaAccountId?: string;
  reviewDate?: string;
  metaAccountName?: string;
  metaBudgetAmount?: number;
}

interface CustomBudget {
  id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
}

interface MetaAccount {
  account_id: string;
  account_name: string;
  budget_amount: number;
}

interface Client {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  meta_ads_budget: number;
}

interface ReviewResult {
  success: boolean;
  reviewId: number | null;
  clientId: string;
  accountId?: string | null;
  accountName?: string;
  idealDailyBudget?: number;
  totalSpent?: number;
  budgetAmount?: number;
  usingCustomBudget?: boolean;
  error?: string;
}

// Criação do cliente Supabase
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Buscar dados do cliente
async function fetchClientData(supabase: any, clientId: string): Promise<Client> {
  console.log(`Buscando dados para cliente ${clientId}`);
  
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError) {
    throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
  }

  return client;
}

// Buscar detalhes da conta Meta específica
async function fetchMetaAccountDetails(
  supabase: any, 
  clientId: string, 
  accountId: string
): Promise<MetaAccount | null> {
  console.log(`Buscando detalhes de conta Meta específica: ${accountId} para cliente ${clientId}`);
  
  const { data: metaAccount, error: accountError } = await supabase
    .from("client_meta_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("account_id", accountId)
    .maybeSingle();

  if (accountError) {
    console.error(`Erro ao buscar conta Meta: ${accountError.message}`);
    return null;
  }

  return metaAccount;
}

// Buscar orçamento personalizado ativo
async function fetchActiveCustomBudget(
  supabase: any, 
  clientId: string,
  today: string
): Promise<CustomBudget | null> {
  console.log(`Buscando orçamento personalizado ativo para cliente ${clientId}`);
  
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
    return null;
  }

  return customBudget;
}

// Calcula orçamento diário ideal
function calculateIdealDailyBudget(budgetAmount: number, totalSpent: number): number {
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
  return Math.round(idealDailyBudget * 100) / 100;
}

// Verificar revisão existente
async function checkExistingReview(
  supabase: any, 
  clientId: string, 
  accountId: string | null, 
  reviewDate: string
) {
  console.log(`Verificando revisão existente para cliente ${clientId} e conta ${accountId || ""} na data ${reviewDate}`);
  
  const { data: existingReview, error: existingReviewError } = await supabase
    .from("daily_budget_reviews")
    .select("*")
    .eq("client_id", clientId)
    .eq("review_date", reviewDate)
    .or(`meta_account_id.eq.${accountId || ""},client_account_id.eq.${accountId || ""}`)
    .maybeSingle();

  if (existingReviewError && existingReviewError.code !== "PGRST116") {
    console.error(`Erro ao verificar revisão existente: ${existingReviewError.message}`);
  }

  return existingReview;
}

// Atualizar revisão existente
async function updateExistingReview(
  supabase: any, 
  reviewId: number, 
  reviewData: any
): Promise<void> {
  console.log(`Atualizando revisão existente: ${reviewId}`);
  
  const { error: updateError } = await supabase
    .from("daily_budget_reviews")
    .update(reviewData)
    .eq("id", reviewId);

  if (updateError) {
    throw new Error(`Erro ao atualizar revisão: ${updateError.message}`);
  }
}

// Criar nova revisão
async function createNewReview(
  supabase: any, 
  reviewData: any
): Promise<number> {
  console.log("Criando nova revisão");
  
  const { data: newReview, error: insertError } = await supabase
    .from("daily_budget_reviews")
    .insert(reviewData)
    .select()
    .single();

  if (insertError) {
    throw new Error(`Erro ao inserir nova revisão: ${insertError.message}`);
  }
  
  return newReview.id;
}

// Atualizar ou criar revisão atual do cliente
async function updateClientCurrentReview(
  supabase: any, 
  clientId: string, 
  reviewData: any
): Promise<void> {
  // Verificar se já existe revisão atual para este cliente
  const { data: currentReview, error: currentReviewError } = await supabase
    .from("client_current_reviews")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  if (currentReviewError && currentReviewError.code !== "PGRST116") {
    console.error(`Erro ao verificar revisão atual: ${currentReviewError.message}`);
  }

  if (currentReview) {
    // Atualizar revisão atual
    const { error: updateCurrentError } = await supabase
      .from("client_current_reviews")
      .update(reviewData)
      .eq("id", currentReview.id);

    if (updateCurrentError) {
      console.error(`Erro ao atualizar revisão atual: ${updateCurrentError.message}`);
    }
  } else {
    // Inserir nova revisão atual
    const { error: insertCurrentError } = await supabase
      .from("client_current_reviews")
      .insert(reviewData);

    if (insertCurrentError) {
      console.error(`Erro ao inserir revisão atual: ${insertCurrentError.message}`);
    }
  }
}

// Função principal que processa a solicitação de revisão
async function processReviewRequest(req: Request): Promise<ReviewResult> {
  try {
    const supabase = createSupabaseClient();
    
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
    const client = await fetchClientData(supabase, clientId);

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
        const metaAccount = await fetchMetaAccountDetails(supabase, clientId, metaAccountId);
        if (metaAccount) {
          accountName = metaAccount.account_name || "Conta Secundária";
          budgetAmount = metaAccount.budget_amount || client.meta_ads_budget;
        }
      }
    }

    // Verificar se existe orçamento personalizado ativo
    const today = new Date().toISOString().split("T")[0];
    const customBudget = await fetchActiveCustomBudget(supabase, clientId, today);

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
    const roundedIdealDailyBudget = calculateIdealDailyBudget(budgetAmount, totalSpent);
    
    // Verificar se já existe uma revisão atual para este cliente e conta específica
    const existingReview = await checkExistingReview(supabase, clientId, accountId, reviewDate);
    
    let reviewId;
    
    // Preparar dados para a revisão
    const reviewData = {
      meta_daily_budget_current: roundedIdealDailyBudget,
      meta_total_spent: totalSpent,
      meta_account_id: accountId || null,
      client_account_id: accountId || null,
      meta_account_name: accountName,
      account_display_name: accountName,
      using_custom_budget: usingCustomBudget,
      custom_budget_id: customBudget?.id || null,
      custom_budget_amount: usingCustomBudget ? customBudget?.budget_amount : null,
    };
    
    if (existingReview) {
      console.log("Encontrada revisão existente:", existingReview);
      
      // Adicionar campos de atualização
      const updateData = {
        ...reviewData,
        updated_at: new Date().toISOString()
      };
      
      // Atualizar revisão existente
      await updateExistingReview(supabase, existingReview.id, updateData);
      
      reviewId = existingReview.id;
      console.log(`Revisão existente atualizada: ${reviewId}`);
    } else {
      console.log("Criando nova revisão");
      
      // Criar nova revisão
      const newReviewData = {
        ...reviewData,
        client_id: clientId,
        review_date: reviewDate
      };
      
      reviewId = await createNewReview(supabase, newReviewData);
      console.log(`Nova revisão criada: ${reviewId}`);
    }

    // Registrar na tabela client_current_reviews para referência rápida ao estado atual
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
    
    await updateClientCurrentReview(supabase, clientId, currentReviewData);

    return {
      success: true,
      reviewId,
      clientId,
      accountId,
      accountName,
      idealDailyBudget: roundedIdealDailyBudget,
      totalSpent,
      budgetAmount,
      usingCustomBudget,
    };
  } catch (error) {
    console.error("Erro na função Edge:", error.message);
    return {
      success: false,
      reviewId: null,
      clientId: (error as any).clientId || "",
      error: error.message
    };
  }
}

// Handler principal da função
serve(async (req: Request) => {
  // Tratar CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const result = await processReviewRequest(req);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return new Response(
      JSON.stringify(result),
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
