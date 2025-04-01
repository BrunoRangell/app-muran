
// Importações necessárias
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cabeçalhos CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para criar cliente do Supabase
const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas");
  }

  return createClient(supabaseUrl, supabaseKey);
};

// Função auxiliar para logar mensagens
const logMessage = async (supabase: any, message: string, details: any = {}) => {
  try {
    await supabase
      .from("system_logs")
      .insert({
        event_type: "edge_function",
        message: message,
        details: { ...details, timestamp: new Date().toISOString() },
      });
    
    // Também exibe no console para facilitar o debug
    console.log(message);
  } catch (error) {
    console.error("Erro ao registrar log:", error);
  }
};

// Função principal para revisar um cliente
const reviewClient = async (supabase: any, clientId: string, clientName: string, metaAccountId: string) => {
  try {
    // Log de início do processamento
    await logMessage(supabase, `Processando cliente: ${clientName}`);
    
    // Verificar se o cliente já foi processado hoje
    const today = new Date().toISOString().split("T")[0];
    const { data: existingReview, error: existingError } = await supabase
      .from("daily_budget_reviews")
      .select("id, created_at")
      .eq("client_id", clientId)
      .eq("review_date", today)
      .order("created_at", { ascending: false })
      .limit(1);
    
    // Se já existe uma revisão recente (menos de 1 hora), pular
    if (existingReview && existingReview.length > 0) {
      const reviewTime = new Date(existingReview[0].created_at).getTime();
      const currentTime = new Date().getTime();
      const minutesSinceReview = (currentTime - reviewTime) / (1000 * 60);
      
      if (minutesSinceReview < 60) {
        await logMessage(
          supabase,
          `Cliente ${clientName} já foi revisado há ${Math.round(minutesSinceReview)} minutos, pulando.`
        );
        return {
          success: true,
          message: `Cliente já revisado recentemente (${Math.round(minutesSinceReview)} minutos atrás)`,
          skipped: true,
        };
      }
    }
    
    // Obter token da Meta
    const { data: tokenData, error: tokenError } = await supabase
      .from("api_tokens")
      .select("value")
      .eq("name", "meta_access_token")
      .single();
    
    if (tokenError || !tokenData?.value) {
      throw new Error("Token do Meta Ads não encontrado ou inválido");
    }
    
    // Preparar datas para a API
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = now.toISOString().split("T")[0];
    
    // Chamar a API da Meta para obter dados de gastos
    const url = `https://graph.facebook.com/v17.0/act_${metaAccountId}/insights`;
    const params = new URLSearchParams({
      fields: "spend",
      time_range: JSON.stringify({
        since: formattedStartDate,
        until: formattedEndDate,
      }),
      access_token: tokenData.value,
    });
    
    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do Meta: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    // Extrair gastos totais
    const totalSpent = data.data && data.data[0] ? parseFloat(data.data[0].spend) || 0 : 0;
    
    // Obter orçamento diário atual
    const campaignsUrl = `https://graph.facebook.com/v17.0/act_${metaAccountId}/campaigns`;
    const campaignsParams = new URLSearchParams({
      fields: "name,daily_budget,status",
      access_token: tokenData.value,
    });
    
    const campaignsResponse = await fetch(`${campaignsUrl}?${campaignsParams}`);
    
    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      throw new Error(`Erro ao obter campanhas: ${JSON.stringify(errorData)}`);
    }
    
    const campaignsData = await campaignsResponse.json();
    
    // Calcular orçamento diário total das campanhas ativas
    let dailyBudget = 0;
    
    if (campaignsData.data) {
      for (const campaign of campaignsData.data) {
        if (campaign.status === "ACTIVE" && campaign.daily_budget) {
          // Converter de centavos para reais
          dailyBudget += parseFloat(campaign.daily_budget) / 100;
        }
      }
    }
    
    // Verificar se existe orçamento personalizado para o cliente
    const { data: customBudgetData } = await supabase
      .from("meta_custom_budgets")
      .select("id, budget_amount, start_date, end_date")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false })
      .maybeSingle();
    
    // Preparar dados de orçamento personalizado
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
    
    // Verificar se já existe uma revisão para hoje
    if (existingReview && existingReview.length > 0) {
      // Atualizar revisão existente
      await supabase
        .from("daily_budget_reviews")
        .update({
          meta_daily_budget_current: dailyBudget,
          meta_total_spent: totalSpent,
          ...customBudgetInfo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview[0].id);
    } else {
      // Criar nova revisão
      await supabase
        .from("daily_budget_reviews")
        .insert({
          client_id: clientId,
          review_date: today,
          meta_daily_budget_current: dailyBudget,
          meta_total_spent: totalSpent,
          meta_account_id: metaAccountId,
          meta_account_name: `Conta ${metaAccountId}`,
          ...customBudgetInfo,
        });
    }
    
    await logMessage(supabase, `Cliente ${clientName}: Análise concluída com sucesso`, {
      dailyBudget,
      totalSpent,
      hasCustomBudget: customBudgetInfo.using_custom_budget,
    });
    
    return {
      success: true,
      clientId,
      clientName,
      metaAccountId,
      dailyBudget,
      totalSpent,
      customBudgetInfo,
    };
    
  } catch (error) {
    await logMessage(
      supabase,
      `Erro ao processar cliente ${clientName}: ${error instanceof Error ? error.message : String(error)}`,
      { error: error instanceof Error ? error.stack : String(error) }
    );
    
    return {
      success: false,
      clientId,
      clientName,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Função principal para processar todos os clientes
async function processAllClients(
  supabase: any, 
  logId?: string, 
  pendingClientsOnly: boolean = false,
  pendingClientIds: string[] = []
) {
  try {
    await logMessage(supabase, "Iniciando processamento de clientes");
    
    // Determinar quais clientes precisam ser processados
    let clientsQuery = supabase
      .from("clients")
      .select("id, company_name, meta_account_id")
      .eq("status", "active")
      .not("meta_account_id", "is", null)
      .not("meta_account_id", "eq", "");
    
    // Se estamos processando apenas clientes pendentes específicos
    if (pendingClientsOnly && pendingClientIds.length > 0) {
      clientsQuery = clientsQuery.in("id", pendingClientIds);
    }
    
    const { data: clients, error: clientsError } = await clientsQuery;
    
    if (clientsError) {
      throw new Error(`Erro ao buscar clientes: ${clientsError.message}`);
    }
    
    if (!clients || clients.length === 0) {
      await logMessage(supabase, "Nenhum cliente encontrado para processar");
      return { success: true, message: "Nenhum cliente para processar", processedCount: 0 };
    }
    
    await logMessage(supabase, `Total de ${clients.length} clientes para processar`, {
      clientCount: clients.length,
      pendingClientsOnly,
      pendingClientCount: pendingClientIds.length,
    });
    
    // Processar cada cliente em sequência
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const client of clients) {
      if (!client.meta_account_id) {
        await logMessage(supabase, `Cliente ${client.company_name} não possui ID de conta Meta, pulando.`);
        skippedCount++;
        continue;
      }
      
      const result = await reviewClient(
        supabase, 
        client.id, 
        client.company_name, 
        client.meta_account_id
      );
      
      results.push(result);
      
      if (result.success) {
        if (result.skipped) {
          skippedCount++;
        } else {
          successCount++;
        }
      } else {
        errorCount++;
      }
    }
    
    // Atualizar o log de execução com o resultado final
    if (logId) {
      await supabase
        .from("cron_execution_logs")
        .update({
          status: errorCount === 0 ? "success" : errorCount < clients.length ? "partial_success" : "error",
          details: {
            totalClients: clients.length,
            successCount,
            errorCount,
            skippedCount,
            completedAt: new Date().toISOString(),
          },
        })
        .eq("id", logId);
    }
    
    await logMessage(supabase, `Processamento concluído: ${successCount} sucessos, ${errorCount} erros, ${skippedCount} pulados`);
    
    return {
      success: true,
      totalClients: clients.length,
      successCount,
      errorCount,
      skippedCount,
      results,
    };
    
  } catch (error) {
    await logMessage(
      supabase,
      `Erro no processamento em lote: ${error instanceof Error ? error.message : String(error)}`,
      { error: error instanceof Error ? error.stack : String(error) }
    );
    
    // Atualizar o log de execução para indicar erro
    if (logId) {
      await supabase
        .from("cron_execution_logs")
        .update({
          status: "error",
          details: {
            error: error instanceof Error ? error.message : String(error),
            completedAt: new Date().toISOString(),
          },
        })
        .eq("id", logId);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Handler principal
serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    const supabase = createSupabaseClient();
    
    // Para verificar se o servidor está respondendo
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({ status: "online", timestamp: new Date().toISOString() }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // Processar requisição POST
    if (req.method === "POST") {
      const body = await req.json();
      
      // Verificar se é um ping de teste
      if (body.method === "ping") {
        return new Response(
          JSON.stringify({ status: "ok", message: "pong", timestamp: new Date().toISOString() }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      // Registrar execução no log
      let logId = body.logId;
      
      if (!logId && (body.scheduled || body.manual)) {
        const { data: logEntry, error } = await supabase
          .from("cron_execution_logs")
          .insert({
            job_name: "daily-meta-review-job",
            status: "started",
            details: {
              source: body.scheduled ? "scheduled" : "manual",
              test: !!body.test,
              timestamp: new Date().toISOString(),
            },
          })
          .select()
          .single();
        
        if (!error && logEntry) {
          logId = logEntry.id;
        }
      }
      
      // Se é apenas um teste, não executar a revisão
      if (body.test) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Teste realizado com sucesso",
            timestamp: new Date().toISOString(),
            logId,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      // Se não foi solicitada a execução da revisão, retornar
      if (!body.executeReview) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Solicitação recebida, mas executeReview=false",
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      // Processar revisão em background
      const processFunction = async () => {
        const result = await processAllClients(
          supabase, 
          logId,
          body.pendingClientsOnly === true,
          body.pendingClientIds || []
        );
        return result;
      };
      
      // Usar waitUntil para permitir que o processamento continue em background
      let backgroundPromise;
      try {
        backgroundPromise = processFunction();
        // @ts-ignore - EdgeRuntime existe em ambiente de produção do Supabase Edge Functions
        EdgeRuntime.waitUntil(backgroundPromise);
      } catch (error) {
        console.error("Erro ao usar EdgeRuntime.waitUntil:", error);
        // Se não puder usar waitUntil, continuar normalmente (isso afetará o tempo de resposta)
        backgroundPromise = processFunction();
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Processamento de revisão iniciado em background",
          timestamp: new Date().toISOString(),
          logId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 202, // Accepted
        }
      );
    }
    
    // Método não suportado
    return new Response(
      JSON.stringify({ error: "Método não suportado" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      }
    );
    
  } catch (error) {
    console.error("Erro na função:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
