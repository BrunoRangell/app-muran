
// Função Edge para revisão diária automatizada de orçamentos Meta Ads
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configuração CORS para permitir acesso da aplicação frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

console.log("Função Edge 'daily-meta-review' carregada - v1.1.0");

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const executionStart = new Date();
    console.log(`Iniciando revisão diária automatizada de Meta Ads às ${executionStart.toISOString()}`);
    
    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Função para registrar logs
    async function logEvent(message: string, details: any = {}) {
      try {
        await supabaseClient
          .from("system_logs")
          .insert({
            event_type: "daily_meta_review",
            message,
            details: {
              ...details,
              timestamp: new Date().toISOString()
            }
          });
      } catch (error) {
        console.error("Erro ao registrar log:", error);
      }
    }
    
    // Obter os dados da requisição
    let requestData: any = {};
    try {
      requestData = await req.json();
    } catch (e) {
      // Se não houver corpo JSON, assumimos valores padrão
      requestData = { scheduled: false, manual: true };
    }
    
    // Verificar se é um teste de status do cron
    const isStatusTest = requestData.testType === "cron_status_check";
    if (isStatusTest) {
      console.log("Teste de status do cron recebido");
      
      // Registrar log de status
      try {
        await supabaseClient.from("system_logs").insert({
          event_type: "cron_job",
          message: "Verificação de status do cron realizada com sucesso",
          details: {
            timestamp: new Date().toISOString(),
            source: "status_check"
          }
        });
        
        // Registrar também em cron_execution_logs
        await supabaseClient.from("cron_execution_logs").insert({
          job_name: "cron-status-check",
          execution_time: new Date().toISOString(),
          status: "active",
          details: {
            source: "status_check",
            message: "Verificação de status do cron realizada com sucesso",
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error("Erro ao registrar logs de status:", error);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          status: "active",
          message: "Verificação de status do cron concluída"
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Verificar se é um teste de conectividade
    const isTest = requestData.test === true;
    
    if (isTest) {
      console.log("Requisição de teste recebida, verificando conectividade");
      
      // Registrar o teste no log
      try {
        await logEvent("Teste de conectividade realizado", {
          timestamp: new Date().toISOString(),
          success: true,
          requestData
        });
      } catch (logError) {
        console.error("Erro ao registrar log de teste:", logError);
      }
      
      // Registrar log também na tabela cron_execution_logs para atualizar o status
      try {
        await supabaseClient
          .from("cron_execution_logs")
          .insert({
            job_name: "daily-meta-review-job",
            execution_time: new Date().toISOString(),
            status: "test_success",
            details: {
              test: true,
              message: "Teste de conectividade realizado com sucesso",
              timestamp: new Date().toISOString()
            }
          });
      } catch (error) {
        console.error("Erro ao registrar log de execução de cron:", error);
      }
      
      // Realizar verificação adicional no token Meta
      let metaTokenValid = false;
      try {
        const { data: tokenData } = await supabaseClient
          .from("api_tokens")
          .select("value")
          .eq("name", "meta_access_token")
          .maybeSingle();
          
        metaTokenValid = Boolean(tokenData?.value && tokenData.value.length > 10);
      } catch (error) {
        console.error("Erro ao verificar token Meta:", error);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Teste de conectividade bem-sucedido",
          timestamp: new Date().toISOString(),
          endpoints: {
            meta_api: metaTokenValid,
            database: true
          }
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Verificar se é uma execução agendada ou manual
    const isScheduled = requestData.scheduled === true;
    const isManual = requestData.manual === true;
    const shouldExecuteReview = requestData.executeReview === true;
    const pendingClientsOnly = requestData.pendingClientsOnly === true;
    const pendingClientIds = requestData.pendingClientIds || [];
    
    // Registrar início da execução
    await logEvent(`Execução ${isScheduled ? 'agendada' : 'manual'} iniciada`, { 
      requestData,
      timestamp: executionStart.toISOString()
    });
    
    // Verificar se devemos executar (checar a última execução)
    const { data: configData } = await supabaseClient
      .from("system_configs")
      .select("value")
      .eq("key", "last_batch_review_time")
      .maybeSingle();
      
    const now = new Date();
    let shouldRun = true;
    
    if (configData?.value && isScheduled && !shouldExecuteReview) {
      const lastRun = new Date(configData.value);
      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
      
      // Se a última execução foi há menos de 12 horas, não executar novamente
      // (isso impede execuções duplicadas no mesmo dia)
      // A menos que seja execução manual ou shouldExecuteReview=true
      if (hoursSinceLastRun < 12) {
        console.log(`Última execução foi há ${hoursSinceLastRun.toFixed(2)} horas. Pulando execução agendada.`);
        shouldRun = false;
      }
    }
    
    if (!shouldRun && !isManual && !shouldExecuteReview) {
      await logEvent("Execução ignorada - executada recentemente", {
        lastExecution: configData?.value,
        isScheduled,
        shouldExecuteReview
      });
      
      // Mesmo assim vamos registrar um log para manter o status ativo
      try {
        await supabaseClient.from("cron_execution_logs").insert({
          job_name: "daily-meta-review-job",
          execution_time: new Date().toISOString(),
          status: "skipped",
          details: {
            message: "Execução ignorada - realizada recentemente",
            last_execution: configData?.value
          }
        });
      } catch (error) {
        console.error("Erro ao registrar logs de execução ignorada:", error);
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "Revisão já foi executada recentemente. Pulando execução.",
          lastExecution: configData?.value
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Registrar o início da revisão
    await supabaseClient.from("cron_execution_logs").insert({
      job_name: "daily-meta-review-job",
      execution_time: new Date().toISOString(),
      status: "started",
      details: {
        message: "Iniciando revisão automática",
        timestamp: new Date().toISOString(),
        pendingClientsOnly,
        pendingClientIdCount: pendingClientIds.length
      }
    });
    
    // Obter token de acesso Meta
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("api_tokens")
      .select("value")
      .eq("name", "meta_access_token")
      .maybeSingle();
      
    if (tokenError || !tokenData?.value) {
      const errorMsg = "Token Meta Ads não encontrado ou inválido";
      await logEvent(errorMsg, { error: tokenError });
      
      // Atualizar status para erro
      await supabaseClient.from("cron_execution_logs").insert({
        job_name: "daily-meta-review-job",
        execution_time: now.toISOString(),
        status: "error",
        details: {
          error: errorMsg,
          timestamp: now.toISOString()
        }
      });
      
      throw new Error(errorMsg);
    }
    
    const metaToken = tokenData.value;
    
    // Buscar clientes ativos com Meta Ads configurado
    const clientsQuery = supabaseClient
      .from("clients")
      .select("id, company_name, meta_account_id")
      .eq("status", "active")
      .not("meta_account_id", "is", null)
      .not("meta_account_id", "eq", "");
      
    // Se for apenas clientes pendentes, filtrar pelo array passado
    if (pendingClientsOnly && pendingClientIds.length > 0) {
      clientsQuery.in("id", pendingClientIds);
    }
    
    const { data: clientsData, error: clientsError } = await clientsQuery;
      
    if (clientsError) {
      const errorMsg = `Erro ao buscar clientes: ${clientsError.message}`;
      await logEvent(errorMsg, { error: clientsError });
      
      // Atualizar status para erro
      await supabaseClient.from("cron_execution_logs").insert({
        job_name: "daily-meta-review-job", 
        execution_time: now.toISOString(),
        status: "error",
        details: {
          error: errorMsg,
          timestamp: now.toISOString()
        }
      });
      
      throw new Error(errorMsg);
    }
    
    if (!clientsData || clientsData.length === 0) {
      const msg = pendingClientsOnly 
        ? "Nenhum cliente pendente para processar" 
        : "Nenhum cliente com Meta Ads encontrado";
      
      await logEvent(msg);
      
      // Atualizar status para concluído (sem clientes para processar)
      await supabaseClient.from("cron_execution_logs").insert({
        job_name: "daily-meta-review-job",
        execution_time: now.toISOString(),
        status: "success",
        details: {
          message: msg,
          timestamp: now.toISOString()
        }
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: msg
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    console.log(`Encontrados ${clientsData.length} clientes para análise`);
    await logEvent(`Encontrados ${clientsData.length} clientes para análise`, {
      pendingClientsOnly,
      clientCount: clientsData.length
    });
    
    // Definir período de análise (primeiro dia do mês até hoje)
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
    
    // Processar cada cliente
    const results = {
      successful: 0,
      failed: 0,
      clients: [] as any[],
      processedClientIds: [] as string[]
    };
    
    // Usar EdgeRuntime.waitUntil para processamento em background
    const backgroundProcessing = (async () => {
      for (const client of clientsData) {
        try {
          console.log(`Processando cliente: ${client.company_name}`);
          await logEvent(`Processando cliente: ${client.company_name}`, { 
            clientId: client.id, 
            metaAccountId: client.meta_account_id 
          });
          
          if (!client.meta_account_id) {
            console.log(`Cliente ${client.company_name} sem Meta Account ID. Pulando.`);
            continue;
          }
          
          // Verificar se o cliente já foi processado hoje
          const currentDate = now.toISOString().split('T')[0];
          const { data: existingReview } = await supabaseClient
            .from('daily_budget_reviews')
            .select('id, meta_daily_budget_current')
            .eq('client_id', client.id)
            .eq('review_date', currentDate)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // Se pendingClientsOnly=true, processar mesmo se já existe revisão
          if (existingReview && !pendingClientsOnly) {
            console.log(`Cliente ${client.company_name} já foi processado hoje. Pulando.`);
            results.clients.push({
              id: client.id,
              name: client.company_name,
              success: true,
              skipped: true,
              message: "Já processado hoje"
            });
            continue;
          }
          
          // Chamar função para análise do Meta Ads
          const { data: metaData, error: metaError } = await supabaseClient.functions.invoke(
            "meta-budget-calculator", 
            {
              body: {
                accountId: client.meta_account_id,
                accessToken: metaToken,
                dateRange: dateRange,
                fetchSeparateInsights: true
              }
            }
          );
          
          if (metaError) {
            console.error(`Erro ao analisar cliente ${client.company_name}:`, metaError);
            await logEvent(`Erro ao analisar cliente ${client.company_name}`, { error: metaError });
            
            results.failed++;
            results.clients.push({
              id: client.id,
              name: client.company_name,
              success: false,
              error: metaError.message || "Erro desconhecido na API Meta"
            });
            
            continue;
          }
          
          if (!metaData) {
            console.error(`Resposta vazia da API para cliente ${client.company_name}`);
            await logEvent(`Resposta vazia da API para cliente ${client.company_name}`);
            
            results.failed++;
            results.clients.push({
              id: client.id,
              name: client.company_name,
              success: false,
              error: "Resposta vazia da API"
            });
            
            continue;
          }
          
          // Verificar orçamento personalizado
          const { data: customBudgetData } = await supabaseClient
            .from("meta_custom_budgets")
            .select("id, budget_amount, start_date, end_date")
            .eq("client_id", client.id)
            .eq("is_active", true)
            .lte("start_date", now.toISOString().split('T')[0])
            .gte("end_date", now.toISOString().split('T')[0])
            .order("created_at", { ascending: false })
            .maybeSingle();
            
          // Preparar informações do orçamento personalizado
          const customBudgetInfo = customBudgetData 
            ? {
                using_custom_budget: true,
                custom_budget_id: customBudgetData.id,
                custom_budget_amount: customBudgetData.budget_amount
              }
            : {
                using_custom_budget: false,
                custom_budget_id: null,
                custom_budget_amount: null
              };
          
          // Extrair valores da resposta da API
          const currentDate = now.toISOString().split('T')[0];
          const metaDailyBudgetCurrent = metaData.totalDailyBudget || 0;
          const metaTotalSpent = metaData.totalSpent || 0;
          
          // Salvar dados da revisão
          if (existingReview) {
            // Atualizar revisão existente
            const { error: updateError } = await supabaseClient
              .from('daily_budget_reviews')
              .update({
                meta_daily_budget_current: metaDailyBudgetCurrent,
                meta_total_spent: metaTotalSpent,
                ...customBudgetInfo,
                updated_at: now.toISOString()
              })
              .eq('id', existingReview.id);
              
            if (updateError) {
              console.error(`Erro ao atualizar revisão para ${client.company_name}:`, updateError);
              results.failed++;
              continue;
            }
          } else {
            // Criar nova revisão
            const { error: insertError } = await supabaseClient
              .from('daily_budget_reviews')
              .insert({
                client_id: client.id,
                review_date: currentDate,
                meta_daily_budget_current: metaDailyBudgetCurrent,
                meta_total_spent: metaTotalSpent,
                meta_account_id: client.meta_account_id,
                meta_account_name: `Conta ${client.meta_account_id}`,
                ...customBudgetInfo
              });
              
            if (insertError) {
              console.error(`Erro ao inserir revisão para ${client.company_name}:`, insertError);
              results.failed++;
              continue;
            }
          }
          
          console.log(`Cliente ${client.company_name}: Análise concluída com sucesso`);
          await logEvent(`Cliente ${client.company_name}: Análise concluída com sucesso`, { 
            metaDailyBudget: metaDailyBudgetCurrent,
            metaTotalSpent: metaTotalSpent,
            hasCustomBudget: customBudgetInfo.using_custom_budget
          });
          
          results.successful++;
          results.processedClientIds.push(client.id);
          results.clients.push({
            id: client.id,
            name: client.company_name,
            success: true,
            meta_daily_budget: metaDailyBudgetCurrent,
            meta_total_spent: metaTotalSpent
          });
          
        } catch (error) {
          console.error(`Erro ao processar cliente ${client.company_name}:`, error);
          await logEvent(`Erro ao processar cliente ${client.company_name}`, { 
            error: error instanceof Error ? error.message : String(error) 
          });
          
          results.failed++;
          results.clients.push({
            id: client.id,
            name: client.company_name,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
        
        // Atualizar o log de execução com o progresso atual após cada cliente
        const progressPercentage = Math.round((results.successful + results.failed) / clientsData.length * 100);
        await supabaseClient.from("cron_execution_logs").insert({
          job_name: "daily-meta-review-job",
          execution_time: new Date().toISOString(),
          status: "progress",
          details: {
            completed: results.successful + results.failed,
            total: clientsData.length,
            progress: progressPercentage,
            success: results.successful,
            failed: results.failed
          }
        });
      }
      
      // Atualizar timestamp da última revisão
      const executionEnd = new Date();
      await supabaseClient
        .from("system_configs")
        .upsert({ 
          key: "last_batch_review_time",
          value: executionEnd.toISOString()
        }, {
          onConflict: "key"
        });
      
      await logEvent("Revisão em massa concluída", {
        sucessos: results.successful,
        falhas: results.failed,
        total: clientsData.length,
        duracaoExecucao: `${(executionEnd.getTime() - executionStart.getTime()) / 1000}s`
      });
      
      // Adicionar um registro de conclusão na tabela de execução de cron
      await supabaseClient
        .from("cron_execution_logs")
        .insert({
          job_name: "daily-meta-review-job",
          execution_time: executionEnd.toISOString(),
          status: results.failed > 0 ? "partial_success" : "success",
          details: {
            total_clients: clientsData.length,
            successful: results.successful,
            failed: results.failed,
            execution_time_seconds: (executionEnd.getTime() - executionStart.getTime()) / 1000,
            success_rate: Math.round((results.successful / clientsData.length) * 100),
            processed_client_ids: results.processedClientIds
          }
        });
    })();
    
    // Usar EdgeRuntime.waitUntil se disponível
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundProcessing);
    } else {
      // Se não estiver disponível, ainda iniciamos o processo
      // mas não esperamos que termine
      backgroundProcessing.catch(err => {
        console.error("Erro no processamento em background:", err);
      });
    }
    
    // Retornar resposta imediata
    return new Response(
      JSON.stringify({
        success: true,
        message: "Revisão em massa iniciada",
        timestamp: executionStart.toISOString(),
        status: "processing",
        clients_to_process: clientsData.length
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("Erro na função de revisão diária:", err);
    
    // Tentar registrar o erro nos logs
    try {
      const supabaseErrorClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      await supabaseErrorClient.from("system_logs").insert({
        event_type: "daily_meta_review",
        message: "Erro crítico na função de revisão diária",
        details: {
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString()
        }
      });
      
      // Registrar falha na tabela de execuções de cron
      await supabaseErrorClient.from("cron_execution_logs").insert({
        job_name: "daily-meta-review-job",
        execution_time: new Date().toISOString(),
        status: "error",
        details: {
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString()
        }
      });
    } catch (logErr) {
      console.error("Erro ao registrar falha:", logErr);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: err instanceof Error ? err.message : "Erro na função de revisão diária",
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      }),
      {
        status: 200, // Retornar 200 mesmo com erro para evitar problemas de CORS
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
