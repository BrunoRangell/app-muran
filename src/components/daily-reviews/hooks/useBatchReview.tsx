
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";

export const useBatchReview = () => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados dos clientes com revisões
  const {
    data: clientsWithReviews,
    isLoading,
    refetch: refetchClients,
  } = useQuery({
    queryKey: ["clients-with-reviews"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error("Usuário não autenticado");
      }

      // Buscar clientes ativos
      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          id,
          company_name,
          meta_account_id,
          meta_ads_budget
        `)
        .eq('status', 'active')
        .order('company_name');
        
      if (error) {
        throw new Error(`Erro ao buscar clientes: ${error.message}`);
      }

      // Para cada cliente, buscar sua revisão mais recente
      const clientsWithLastReview = await Promise.all(
        clients.map(async (client) => {
          const { data: reviewData } = await supabase
            .from('daily_budget_reviews')
            .select('*')
            .eq('client_id', client.id)
            .order('review_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...client,
            lastReview: reviewData || null
          };
        })
      );

      return clientsWithLastReview;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  // Buscar informações da última execução em lote
  const {
    data: lastBatchInfo,
    refetch: refetchBatchInfo
  } = useQuery({
    queryKey: ["last-batch-review-info"],
    queryFn: async () => {
      // Buscar timestamp da última execução bem-sucedida
      const { data: lastTimeConfig } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .single();

      // Buscar informações do processo em lote atual (se existir)
      const { data: batchProgress } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "batch_review_progress")
        .single();

      return {
        lastBatchReviewTime: lastTimeConfig?.value || null,
        batchProgress: batchProgress?.value || null
      };
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos para mostrar o progresso
    refetchOnWindowFocus: false
  });

  // Mutação para iniciar análise em lote
  const batchReviewMutation = useMutation({
    mutationFn: async () => {
      console.log("Iniciando análise em lote de todos os clientes");
      
      // Criar registro na tabela de logs
      const { data: logEntry, error: logError } = await supabase
        .from('cron_execution_logs')
        .insert({
          job_name: 'daily-meta-review-job',
          status: 'started',
          details: {
            source: 'manual_trigger',
            timestamp: new Date().toISOString(),
            triggered_from: 'batch_review_button',
            isAutomatic: false
          }
        })
        .select()
        .single();
      
      if (logError) {
        throw new Error(`Erro ao criar log de execução: ${logError.message}`);
      }
      
      // Chamar a função Edge
      const { data, error: edgeError } = await supabase.functions.invoke(
        "daily-meta-review",
        {
          body: {
            executeReview: true,
            manual: true,
            logId: logEntry.id,
            isAutomatic: false,
            timestamp: new Date().toISOString()
          }
        }
      );
      
      if (edgeError) {
        throw new Error(`Erro na função Edge: ${edgeError.message}`);
      }
      
      return { 
        success: true, 
        logId: logEntry.id,
        ...data
      };
    },
    onSuccess: () => {
      toast({
        title: "Análise iniciada",
        description: "A análise de todos os clientes foi iniciada. Acompanhe o progresso na barra acima.",
      });
      
      // Atualizar dados
      refetchBatchInfo();
      
      // Começar a monitorar o progresso
      const intervalId = setInterval(() => {
        refetchBatchInfo();
      }, 3000);
      
      // Limpar o intervalo após 2 minutos
      setTimeout(() => {
        clearInterval(intervalId);
        queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      }, 2 * 60 * 1000);
    },
    onError: (error) => {
      toast({
        title: "Erro na análise em lote",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao iniciar a análise em lote",
        variant: "destructive",
      });
    }
  });

  // Mutação para análise individual de clientes
  const clientReviewMutation = useMutation({
    mutationFn: async (clientId: string) => {
      console.log(`Analisando cliente individual: ${clientId}`);
      
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
        throw new Error(`Erro na análise do cliente: ${error.message}`);
      }

      if (!data) {
        throw new Error("Resposta vazia da API");
      }

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
        success: true
      };
    },
    onSuccess: (data) => {
      // Remover cliente da lista de processamento
      setProcessingClients(prev => prev.filter(id => id !== data.clientId));
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    },
    onError: (error, clientId) => {
      console.error(`Erro na análise do cliente ${clientId}:`, error);
      
      // Remover cliente da lista de processamento mesmo em caso de erro
      setProcessingClients(prev => prev.filter(id => id !== clientId));
      
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  });

  // Função para analisar um cliente individual
  const reviewSingleClient = async (clientId: string) => {
    // Evitar análises simultâneas do mesmo cliente
    if (processingClients.includes(clientId)) {
      toast({
        title: "Análise em andamento",
        description: "Este cliente já está sendo analisado.",
      });
      return;
    }
    
    // Adicionar o cliente à lista de processamento
    setProcessingClients(prev => [...prev, clientId]);
    
    // Chamar a mutação
    return clientReviewMutation.mutateAsync(clientId);
  };

  // Função para analisar todos os clientes
  const reviewAllClients = async () => {
    if (batchReviewMutation.isPending) {
      toast({
        title: "Análise já em andamento",
        description: "Aguarde a conclusão do processamento atual.",
      });
      return;
    }
    
    return batchReviewMutation.mutateAsync();
  };

  // Verificar se alguma análise está em andamento
  const isBatchAnalyzing = useMemo(() => {
    const batchProgress = lastBatchInfo?.batchProgress;
    if (!batchProgress) return false;
    
    const isRunning = batchProgress.status === 'running';
    const isRecent = batchProgress.startTime && 
      (new Date().getTime() - new Date(batchProgress.startTime).getTime()) < 10 * 60 * 1000; // 10 minutos
    
    return isRunning && isRecent;
  }, [lastBatchInfo]);

  // Extrair informações de progresso
  const batchProgress = useMemo(() => {
    if (!lastBatchInfo?.batchProgress) return 0;
    return lastBatchInfo.batchProgress.processedClients || 0;
  }, [lastBatchInfo]);

  const totalClientsToAnalyze = useMemo(() => {
    if (!lastBatchInfo?.batchProgress) return 0;
    return lastBatchInfo.batchProgress.totalClients || 0;
  }, [lastBatchInfo]);

  return {
    clientsWithReviews,
    isLoading,
    processingClients,
    reviewSingleClient,
    reviewAllClients,
    lastBatchReviewTime: lastBatchInfo?.lastBatchReviewTime,
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze,
    refetchClients
  };
};
