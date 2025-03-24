
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Configuração CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

console.log("Função Edge 'scheduled-reviews' carregada - v1.0.1");

// Função para criar um cliente Supabase com a chave de serviço
const createServiceClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Faltam credenciais do Supabase");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Converte data UTC para horário de Brasília
const convertToBrasiliaTime = (date: Date): Date => {
  // Brasília é UTC-3
  const brasiliaOffset = -3 * 60; // minutos
  const userTimezoneOffset = date.getTimezoneOffset(); // minutos
  const totalOffsetMinutes = brasiliaOffset - userTimezoneOffset;
  return new Date(date.getTime() + totalOffsetMinutes * 60000);
};

// Obtém data atual no fuso horário de Brasília
const getCurrentDateInBrasiliaTz = (): Date => {
  return convertToBrasiliaTime(new Date());
};

// Verificar se é hora de executar a revisão agendada
const shouldRunScheduledReview = async (supabase: any): Promise<boolean> => {
  try {
    // Verificar se tem alguma tarefa agendada ativa para revisão
    const { data: tasks, error } = await supabase
      .from("scheduled_tasks")
      .select("*")
      .eq("task_name", "daily_budget_review")
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Erro ao verificar tarefas agendadas:", error);
      return false;
    }

    if (!tasks) {
      console.log("Nenhuma tarefa agendada ativa encontrada");
      return false;
    }

    console.log("Tarefa agendada encontrada:", tasks);
    
    // Obter a última execução
    const lastRun = tasks.last_run ? new Date(tasks.last_run) : null;
    const now = getCurrentDateInBrasiliaTz();
    
    console.log("Verificando agendamento. Hora atual Brasília:", now.toISOString());
    console.log("Última execução:", lastRun ? lastRun.toISOString() : "Nunca executado");
    
    // Se nunca executou, deve executar
    if (!lastRun) {
      console.log("Primeira execução da tarefa agendada");
      return true;
    }

    // Verificar se já executou hoje comparando apenas a data (sem o horário)
    const lastRunDate = lastRun.toISOString().split("T")[0];
    const todayDate = now.toISOString().split("T")[0];
    
    console.log(`Comparando datas - Última execução: ${lastRunDate}, Hoje: ${todayDate}`);
    
    if (lastRunDate !== todayDate) {
      // Verificar horário de execução (configurado para 6h da manhã horário de Brasília)
      const currentHour = now.getHours();
      
      console.log(`Hora atual: ${currentHour}h. Verificando se já passou das 6h da manhã.`);
      
      // Executar se for depois das 6h da manhã
      if (currentHour >= 6) {
        console.log("Hora de executar a revisão agendada (6h da manhã ou depois)");
        return true;
      } else {
        console.log("Ainda não chegou a hora agendada (6h da manhã)");
        return false;
      }
    } else {
      console.log("Revisão já foi executada hoje");
      return false;
    }
  } catch (error) {
    console.error("Erro ao verificar agendamento:", error);
    return false;
  }
};

// Atualizar timestamp da última execução
const updateLastRunTimestamp = async (supabase: any): Promise<void> => {
  try {
    const now = new Date();
    console.log("Atualizando timestamp de última execução para:", now.toISOString());
    
    const { error } = await supabase
      .from("scheduled_tasks")
      .update({ last_run: now.toISOString() })
      .eq("task_name", "daily_budget_review");

    if (error) {
      throw error;
    }
    
    console.log("Timestamp de última execução atualizado com sucesso");
  } catch (error) {
    console.error("Erro ao atualizar timestamp de execução:", error);
  }
};

// Executar revisão para um cliente específico
const analyzeClient = async (supabase: any, client: any, accessToken: string): Promise<any> => {
  try {
    if (!client.meta_account_id) {
      return { 
        clientId: client.id, 
        success: false, 
        error: "Cliente sem ID de conta Meta" 
      };
    }

    console.log(`Analisando cliente: ${client.company_name} (${client.meta_account_id})`);

    // Definir o período de análise (do início do mês até hoje)
    const now = getCurrentDateInBrasiliaTz();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateRange = {
      start: startDate.toISOString().split("T")[0],
      end: now.toISOString().split("T")[0]
    };

    // Buscar orçamento personalizado ativo, se existir
    const { data: customBudget } = await supabase
      .from("meta_custom_budgets")
      .select("*")
      .eq("client_id", client.id)
      .eq("is_active", true)
      .lte("start_date", dateRange.end)
      .gte("end_date", dateRange.start)
      .maybeSingle();

    // Chamar função Edge para obter dados do Meta Ads
    const { data, error } = await supabase.functions.invoke("daily-budget-reviews", {
      body: {
        method: "getMetaAdsData",
        metaAccountId: client.meta_account_id,
        accessToken,
        dateRange,
        fetchSeparateInsights: true
      }
    });

    if (error) {
      console.error("Erro na função de borda:", error);
      return { 
        clientId: client.id, 
        success: false, 
        error: `Erro ao analisar cliente: ${error.message}` 
      };
    }

    if (!data || !data.meta) {
      return { 
        clientId: client.id, 
        success: false, 
        error: "Resposta vazia da API" 
      };
    }

    // Extrair dados da resposta
    const metaDailyBudgetCurrent = data.meta.dailyBudget || 0;
    const metaTotalSpent = data.meta.totalSpent || 0;

    // Preparar dados de orçamento personalizado
    const customBudgetInfo = customBudget ? {
      using_custom_budget: true,
      custom_budget_id: customBudget.id,
      custom_budget_amount: customBudget.budget_amount
    } : {
      using_custom_budget: false,
      custom_budget_id: null,
      custom_budget_amount: null
    };

    // Verificar se já existe uma revisão atual para este cliente
    const { data: existingReview } = await supabase
      .from("client_current_reviews")
      .select("id")
      .eq("client_id", client.id)
      .maybeSingle();

    let reviewData;
    const currentDate = now.toISOString().split("T")[0];

    if (existingReview) {
      // Atualizar revisão existente
      console.log(`Atualizando revisão existente para cliente ${client.id}`);
      
      const { data: updatedReview, error: updateError } = await supabase
        .from("client_current_reviews")
        .update({
          review_date: currentDate,
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          meta_account_id: client.meta_account_id,
          meta_account_name: `Conta ${client.meta_account_id}`,
          ...customBudgetInfo,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingReview.id)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar revisão:", updateError);
        return { 
          clientId: client.id, 
          success: false, 
          error: `Erro ao atualizar revisão: ${updateError.message}` 
        };
      }
      
      reviewData = updatedReview;
    } else {
      // Criar nova revisão
      console.log(`Criando nova revisão para cliente ${client.id}`);
      
      const { data: newReview, error: insertError } = await supabase
        .from("client_current_reviews")
        .insert({
          client_id: client.id,
          review_date: currentDate,
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          meta_account_id: client.meta_account_id,
          meta_account_name: `Conta ${client.meta_account_id}`,
          ...customBudgetInfo
        })
        .select()
        .single();

      if (insertError) {
        console.error("Erro ao inserir revisão:", insertError);
        return { 
          clientId: client.id, 
          success: false, 
          error: `Erro ao inserir revisão: ${insertError.message}` 
        };
      }
      
      reviewData = newReview;
    }

    console.log(`Revisão concluída para cliente ${client.id} com sucesso`);
    
    return {
      clientId: client.id,
      success: true,
      reviewId: reviewData.id,
      meta_daily_budget_current: metaDailyBudgetCurrent,
      meta_total_spent: metaTotalSpent
    };
  } catch (error) {
    console.error(`Erro ao analisar cliente ${client.id}:`, error);
    return { 
      clientId: client.id, 
      success: false, 
      error: `Erro ao analisar cliente: ${error.message || "Erro desconhecido"}` 
    };
  }
};

// Buscar token de acesso Meta Ads
const getMetaAccessToken = async (supabase: any): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("api_tokens")
      .select("value")
      .eq("name", "meta_ads_token")
      .maybeSingle();

    if (error || !data) {
      console.error("Erro ao buscar token Meta Ads:", error);
      return null;
    }

    return data.value;
  } catch (error) {
    console.error("Erro ao buscar token:", error);
    return null;
  }
};

// Buscar clientes com conta Meta configurada
const getClientsForReview = async (supabase: any): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .not("meta_account_id", "is", null)
      .neq("meta_account_id", "");

    if (error) {
      console.error("Erro ao buscar clientes:", error);
      return [];
    }

    console.log(`Encontrados ${data?.length || 0} clientes para revisão`);
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
};

// Processar clientes sequencialmente para evitar erros de sobrecarga
const processBatch = async (
  clients: any[], 
  accessToken: string, 
  supabase: any
): Promise<any[]> => {
  console.log(`Iniciando processamento de ${clients.length} clientes`);
  
  const results = [];
  
  // Processar um por um para evitar erros
  for (const client of clients) {
    console.log(`Processando cliente: ${client.company_name}`);
    const result = await analyzeClient(supabase, client, accessToken);
    results.push(result);
  }
  
  return results;
};

// Executar revisão em massa
const runBatchReview = async (supabase: any): Promise<any> => {
  try {
    console.log("Iniciando revisão em massa agendada");
    
    // Obter token de acesso Meta
    const accessToken = await getMetaAccessToken(supabase);
    
    if (!accessToken) {
      throw new Error("Token do Meta Ads não encontrado");
    }

    // Obter clientes para revisão
    const clients = await getClientsForReview(supabase);
    
    if (clients.length === 0) {
      console.log("Nenhum cliente encontrado para revisão");
      return { success: true, message: "Nenhum cliente encontrado para revisão", results: [] };
    }
    
    console.log(`Iniciando análise de ${clients.length} clientes`);
    
    // Processar clientes em sequência
    const results = await processBatch(clients, accessToken, supabase);
    
    // Atualizar timestamp da última execução
    await updateLastRunTimestamp(supabase);
    
    // Contabilizar resultados
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    console.log(`Revisão em massa concluída: ${successCount} sucessos, ${errorCount} falhas`);
    
    return {
      success: true,
      message: `Revisão em massa agendada concluída. ${successCount} clientes analisados com sucesso. ${errorCount} falhas.`,
      results
    };
  } catch (error) {
    console.error("Erro na revisão em massa:", error);
    return {
      success: false,
      message: `Erro na revisão em massa: ${error.message || "Erro desconhecido"}`,
      error: error.message || "Erro desconhecido"
    };
  }
};

// Pontos de entrada da função Edge
serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createServiceClient();
    
    // Verificar o body da requisição
    let reqBody = {};
    
    if (req.method === "POST") {
      try {
        const requestText = await req.text();
        if (requestText && requestText.trim() !== "") {
          reqBody = JSON.parse(requestText);
        }
      } catch (err) {
        console.log("Corpo da requisição vazio ou inválido, usando padrão");
      }
    }
    
    // Verificar o método solicitado
    const method = reqBody.method || "check";
    
    switch (method) {
      case "check":
        // Verificar se é hora de executar a revisão agendada
        const shouldRun = await shouldRunScheduledReview(supabase);
        
        return new Response(
          JSON.stringify({
            success: true,
            shouldRun,
            timestamp: new Date().toISOString(),
            message: shouldRun 
              ? "É hora de executar a revisão agendada" 
              : "Ainda não é hora de executar a revisão agendada"
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
        
      case "force-run":
        // Força a execução da revisão em massa
        const results = await runBatchReview(supabase);
        
        return new Response(
          JSON.stringify(results),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      
      case "ping":
        // Responder a um ping simples
        return new Response(
          JSON.stringify({
            success: true,
            message: "Pong! A função Edge está funcionando corretamente.",
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
        
      default:
        // Método não reconhecido
        return new Response(
          JSON.stringify({
            success: false,
            message: `Método '${method}' não reconhecido`,
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
    }
  } catch (err) {
    console.error("Erro não tratado na função Edge:", err);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Erro interno no servidor",
        error: {
          message: err.message,
          stack: err.stack,
        }
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
