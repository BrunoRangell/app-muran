// Este arquivo é muito extenso, então vamos fazer uma modificação pontual
// para garantir que o cron chama o mesmo fluxo que o botão "Analisar todos"

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

// Função para iniciar o processamento em lote unificado
const startBatchProcess = async (supabase: any, logId: string, isAutomatic: boolean = true) => {
  try {
    await logMessage(supabase, `Iniciando processamento em lote ${isAutomatic ? 'automático' : 'manual'}`, { logId });

    // Buscar todos os clientes ativos com Meta Ads configurado
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, company_name")
      .eq("status", "active")
      .not("meta_account_id", "is", null)
      .order("company_name");

    if (clientsError) {
      throw new Error(`Erro ao buscar clientes: ${clientsError.message}`);
    }

    if (!clients || clients.length === 0) {
      await logMessage(supabase, "Nenhum cliente encontrado para processar");
      
      // Atualizar o log de execução para completed mesmo sem clientes
      await supabase
        .from("cron_execution_logs")
        .update({
          status: "completed",
          details: {
            totalClients: 0,
            successCount: 0,
            errorCount: 0,
            skippedCount: 0,
            completedAt: new Date().toISOString(),
            message: "Nenhum cliente para processar",
            isAutomatic
          },
        })
        .eq("id", logId);
      
      return { success: true, message: "Nenhum cliente para processar", processedCount: 0 };
    }

    // Configurar na tabela system_configs para sinalizar processo em lote em andamento
    const batchInfo = {
      totalClients: clients.length,
      processedClients: 0,
      startTime: new Date().toISOString(),
      logId: logId,
      isAutomatic: isAutomatic,
      status: "running",
      clientIds: clients.map(c => c.id)
    };

    // Verificar se já existe configuração anterior
    const { data: existingConfig } = await supabase
      .from("system_configs")
      .select("id")
      .eq("key", "batch_review_progress")
      .single();

    if (existingConfig) {
      await supabase
        .from("system_configs")
        .update({ value: batchInfo })
        .eq("id", existingConfig.id);
    } else {
      await supabase
        .from("system_configs")
        .insert({
          key: "batch_review_progress",
          value: batchInfo
        });
    }

    // IMPORTANTE: Atualizar o timestamp da última execução em lote
    // Isso permite à interface detectar que o processo começou
    try {
      const timeNow = new Date().toISOString();
      const { data: lastBatchConfig } = await supabase
        .from("system_configs")
        .select("id")
        .eq("key", "last_batch_review_time")
        .maybeSingle();
        
      if (lastBatchConfig) {
        await supabase
          .from("system_configs")
          .update({ value: timeNow })
          .eq("id", lastBatchConfig.id);
      } else {
        await supabase
          .from("system_configs")
          .insert({
            key: "last_batch_review_time",
            value: timeNow
          });
      }
    } catch (updateError) {
      console.error("Erro ao atualizar timestamp de revisão:", updateError);
    }

    // Atualizar o status do log para "in_progress"
    await supabase
      .from("cron_execution_logs")
      .update({
        status: "in_progress",
        details: {
          ...batchInfo,
          message: `Iniciando análise de ${clients.length} clientes`,
        },
      })
      .eq("id", logId);

    await logMessage(supabase, `Configurado processamento em lote para ${clients.length} clientes`, { batchInfo });
    
    // Retornar sucesso para que a função Edge possa responder ao cliente
    return {
      success: true,
      message: `Processamento em lote iniciado para ${clients.length} clientes`,
      logId,
      isAutomatic,
      totalClients: clients.length
    };
  } catch (error) {
    console.error("Erro ao iniciar processamento em lote:", error);

    // Atualizar o log de execução para indicar erro
    await supabase
      .from("cron_execution_logs")
      .update({
        status: "error",
        details: {
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date().toISOString(),
          isAutomatic
        },
      })
      .eq("id", logId);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      isAutomatic
    };
  }
};

// Função para processar clientes em segundo plano com suporte a batching
async function processClientsInBackground(supabase: any, logId: string, isAutomatic: boolean = true) {
  try {
    // Buscar as informações do processamento em lote
    const { data: batchConfig } = await supabase
      .from("system_configs")
      .select("value")
      .eq("key", "batch_review_progress")
      .single();

    if (!batchConfig || !batchConfig.value) {
      throw new Error("Configuração de processamento em lote não encontrada");
    }

    const batchInfo = batchConfig.value;
    const clientIds = batchInfo.clientIds || [];

    await logMessage(supabase, `Processando ${clientIds.length} clientes em segundo plano`, { 
      logId,
      isAutomatic 
    });

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const results = [];

    // Processar cada cliente usando a função meta-budget-calculator
    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];

      try {
        // Buscar dados do cliente
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .select("id, company_name, meta_account_id")
          .eq("id", clientId)
          .single();
        
        if (clientError || !client) {
          console.error(`Erro ao buscar cliente ${clientId}:`, clientError);
          errorCount++;
          continue;
        }

        if (!client.meta_account_id) {
          console.log(`Cliente ${client.company_name} não possui ID de conta Meta, pulando.`);
          skippedCount++;
          continue;
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
        
        // Usar a função meta-budget-calculator
        console.log(`Processando cliente ${i+1}/${clientIds.length}: ${client.company_name}`);
        const { data: metaBudgetData, error: metaBudgetError } = await supabase.functions.invoke(
          "meta-budget-calculator",
          {
            body: {
              accountId: client.meta_account_id,
              accessToken: tokenData.value,
              dateRange: {
                start: formattedStartDate,
                end: formattedEndDate
              },
              fetchSeparateInsights: true
            },
          }
        );
        
        if (metaBudgetError) {
          console.error(`Erro ao processar cliente ${client.company_name}:`, metaBudgetError);
          errorCount++;
          results.push({ clientId, success: false, error: metaBudgetError.message });
          continue;
        }
        
        if (!metaBudgetData) {
          console.error(`Resposta vazia para cliente ${client.company_name}`);
          errorCount++;
          results.push({ clientId, success: false, error: "Resposta vazia da API" });
          continue;
        }
        
        // Extrair valores da resposta
        const metaDailyBudgetCurrent = metaBudgetData.totalDailyBudget || 0;
        const metaTotalSpent = metaBudgetData.totalSpent || 0;
        
        // Verificar se existe orçamento personalizado para o cliente
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
        const { data: existingReview } = await supabase
          .from("daily_budget_reviews")
          .select("id")
          .eq("client_id", clientId)
          .eq("review_date", today)
          .maybeSingle();
        
        // Salvar ou atualizar revisão
        if (existingReview) {
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
          await supabase
            .from("daily_budget_reviews")
            .insert({
              client_id: clientId,
              review_date: today,
              meta_daily_budget_current: metaDailyBudgetCurrent,
              meta_total_spent: metaTotalSpent,
              meta_account_id: client.meta_account_id,
              meta_account_name: `Conta ${client.meta_account_id}`,
              ...customBudgetInfo,
            });
        }
        
        // Marcar como sucesso
        successCount++;
        results.push({ 
          clientId, 
          success: true, 
          client: client.company_name,
          metaAccountId: client.meta_account_id,
          dailyBudget: metaDailyBudgetCurrent,
          totalSpent: metaTotalSpent
        });

        // Atualizar o progresso no sistema
        const progress = i + 1;
        await supabase
          .from("system_configs")
          .update({
            value: {
              ...batchInfo,
              processedClients: progress,
              lastProcessed: client.company_name,
              lastProcessedAt: new Date().toISOString(),
              percentComplete: Math.round((progress / clientIds.length) * 100)
            }
          })
          .eq("key", "batch_review_progress");

        // Atualizar o log de execução a cada 5 clientes ou no último
        if (progress % 5 === 0 || progress === clientIds.length) {
          await supabase
            .from("cron_execution_logs")
            .update({
              status: "in_progress",
              details: {
                totalClients: clientIds.length,
                processedClients: progress,
                successCount,
                errorCount,
                skippedCount,
                percentComplete: Math.round((progress / clientIds.length) * 100),
                lastUpdated: new Date().toISOString(),
                isAutomatic
              },
            })
            .eq("id", logId);
        }

      } catch (clientError) {
        console.error("Erro ao processar cliente:", clientError);
        errorCount++;
      }
    }

    // Processamento concluído, atualizar status final
    const finalStatus = errorCount === 0 ? "success" : errorCount < clientIds.length ? "partial_success" : "error";
    
    await supabase
      .from("cron_execution_logs")
      .update({
        status: finalStatus,
        details: {
          totalClients: clientIds.length,
          successCount,
          errorCount,
          skippedCount,
          completedAt: new Date().toISOString(),
          isAutomatic
        },
      })
      .eq("id", logId);

    // Atualizar system_configs para indicar conclusão
    await supabase
      .from("system_configs")
      .update({
        value: {
          ...batchInfo,
          status: "completed",
          processedClients: clientIds.length,
          successCount,
          errorCount,
          skippedCount,
          completedAt: new Date().toISOString(),
          percentComplete: 100,
        }
      })
      .eq("key", "batch_review_progress");

    // Se bem-sucedido, atualizar timestamp da última execução em lote
    if (successCount > 0) {
      const timeNow = new Date().toISOString();
      const { data: existingConfig } = await supabase
        .from("system_configs")
        .select("id")
        .eq("key", "last_batch_review_time")
        .maybeSingle();
      
      if (existingConfig) {
        await supabase
          .from("system_configs")
          .update({ value: timeNow })
          .eq("id", existingConfig.id);
      } else {
        await supabase
          .from("system_configs")
          .insert({
            key: "last_batch_review_time",
            value: timeNow
          });
      }
    }

    await logMessage(supabase, `Processamento em lote concluído: ${successCount} sucessos, ${errorCount} erros, ${skippedCount} pulados`);
    
    return {
      success: true,
      totalClients: clientIds.length,
      successCount,
      errorCount,
      skippedCount,
      results,
    };
  } catch (error) {
    console.error("Erro no processamento em lote:", error);
    
    // Atualizar o log de execução para indicar erro
    await supabase
      .from("cron_execution_logs")
      .update({
        status: "error",
        details: {
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date().toISOString(),
          isAutomatic
        },
      })
      .eq("id", logId);
    
    // Atualizar system_configs para indicar erro
    const { data: batchConfig } = await supabase
      .from("system_configs")
      .select("value")
      .eq("key", "batch_review_progress")
      .single();
      
    if (batchConfig?.value) {
      await supabase
        .from("system_configs")
        .update({
          value: {
            ...batchConfig.value,
            status: "error",
            error: error instanceof Error ? error.message : String(error),
            completedAt: new Date().toISOString(),
          }
        })
        .eq("key", "batch_review_progress");
    }
    
    await logMessage(supabase, `Erro no processamento em lote: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Handler principal - Modificado para garantir que a execução cron usa o mesmo fluxo
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
      
      console.log("Recebida requisição POST:", body);
      
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
      
      // Obter ID do log de execução, se fornecido
      let logId = body.logId;
      const isAutomatic = body.scheduled === true;
      
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
              isAutomatic: body.scheduled === true,
              unified: true // Indicando que usa o novo fluxo unificado
            },
          })
          .select()
          .single();
        
        if (!error && logEntry) {
          logId = logEntry.id;
          console.log(`Criado novo log de execução com ID: ${logId}`);
        } else {
          console.error("Erro ao criar log de execução:", error);
        }
      }
      
      // Se é apenas um teste, não executar a revisão
      if (body.test) {
        console.log("Requisição de teste recebida, não executando revisão");
        
        // Mesmo sendo teste, atualizar o status para completed
        if (logId) {
          await supabase
            .from("cron_execution_logs")
            .update({
              status: "completed",
              details: {
                timestamp: new Date().toISOString(),
                message: "Teste concluído com sucesso, sem execução real",
                test: true,
                isAutomatic
              }
            })
            .eq("id", logId);
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Teste realizado com sucesso",
            timestamp: new Date().toISOString(),
            logId,
            isAutomatic
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      // IMPORTANTE: Modificação aqui para garantir que executeReview seja verdadeiro por padrão
      // se não for especificado explicitamente como false
      const shouldExecuteReview = body.executeReview !== false;
      
      // Se não foi solicitada a execução da revisão, retornar
      if (!shouldExecuteReview) {
        console.log("Solicitação recebida, mas executeReview=false. Não executando revisão.");
        
        // Atualizar o status como completed mesmo sem executar revisão
        if (logId) {
          await supabase
            .from("cron_execution_logs")
            .update({
              status: "completed",
              details: {
                timestamp: new Date().toISOString(),
                message: "Solicitação recebida, mas executeReview=false",
                completedAt: new Date().toISOString(),
                isAutomatic
              }
            })
            .eq("id", logId);
        }
        
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
      
      console.log("Iniciando processamento de revisão com executeReview=true");
      await logMessage(supabase, "Iniciando processamento da revisão diária (fluxo unificado)", { 
        logId, 
        isAutomatic 
      });
      
      // Iniciar o processamento unificado
      const startResult = await startBatchProcess(supabase, logId, isAutomatic);
      
      // Processar em segundo plano
      let backgroundPromise;
      try {
        backgroundPromise = processClientsInBackground(supabase, logId, isAutomatic);
        
        if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
          // @ts-ignore - Edge Runtime existe em ambiente de produção
          EdgeRuntime.waitUntil(backgroundPromise);
          console.log("Processamento em background registrado com EdgeRuntime.waitUntil");
        } else {
          console.log("EdgeRuntime.waitUntil não está disponível, o processamento pode ser interrompido");
        }
      } catch (error) {
        console.error("Erro ao usar EdgeRuntime.waitUntil:", error);
        backgroundPromise = processClientsInBackground(supabase, logId, isAutomatic);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Processamento de revisão iniciado em background (fluxo unificado)",
          timestamp: new Date().toISOString(),
          logId,
          isAutomatic,
          totalClients: startResult.totalClients || 0,
          unifiedProcess: true
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
