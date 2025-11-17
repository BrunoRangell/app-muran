import { processIndividualReview } from "./individual.ts";
import { BatchReviewRequest } from "./types.ts";
import { createSupabaseClient, cleanupOldReviews, fetchAllMetaAccounts } from "./database.ts";

export async function processBatchReview(request: BatchReviewRequest) {
  const batchStartTime = Date.now();
  console.log(`🚀 [BATCH] INICIANDO processamento em lote`);
  
  try {
    const { clientIds, reviewDate } = request;
    
    console.log(`🔍 [BATCH] Parâmetros recebidos:`, {
      totalClients: clientIds?.length || 0,
      reviewDate,
      timestamp: new Date().toISOString()
    });
    
    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      console.error(`❌ [BATCH] ERRO: clientIds não fornecido ou vazio`);
      return { success: false, error: "clientIds é obrigatório e deve ser um array não vazio" };
    }
    
    const today = reviewDate || new Date().toISOString().split('T')[0];
    
    // Limpeza GLOBAL de revisões antigas no início do batch (mais eficiente)
    console.log(`🧹 [BATCH] Executando limpeza global de revisões antigas do Meta Ads...`);
    const cleanupStartTime = Date.now();
    const supabase = createSupabaseClient();
    
    const cleanupResult = await cleanupOldReviews(supabase, 'meta', today);
    const cleanupTime = Date.now() - cleanupStartTime;
    
    console.log(`✅ [BATCH] Limpeza global concluída (${cleanupTime}ms):`, {
      deleted_old: cleanupResult.deleted_old,
      deleted_today_duplicates: cleanupResult.deleted_today_duplicates
    });
    
    console.log(`📊 [BATCH] Buscando contas Meta para ${clientIds.length} clientes...`);
    
    // Buscar todas as contas Meta de todos os clientes
    const clientAccountsMap = new Map();
    for (const clientId of clientIds) {
      const accounts = await fetchAllMetaAccounts(supabase, clientId);
      if (accounts.length > 0) {
        clientAccountsMap.set(clientId, accounts);
      }
    }
    
    // Criar lista de tarefas individuais (clientId + accountId)
    const allReviewTasks: Array<{clientId: string, accountId: string, accountName: string}> = [];
    clientAccountsMap.forEach((accounts, clientId) => {
      accounts.forEach(account => {
        allReviewTasks.push({ 
          clientId, 
          accountId: account.account_id,
          accountName: account.account_name
        });
      });
    });
    
    console.log(`📊 [BATCH] Total de ${allReviewTasks.length} conta(s) Meta para processar em PARALELO`);
    
    // Processar TODAS as contas em paralelo
    const processingStartTime = Date.now();
    const accountResults = await Promise.allSettled(
      allReviewTasks.map((task) => {
        const taskStartTime = Date.now();
        console.log(`\n🚀 [BATCH] Iniciando processamento - Cliente: ${task.clientId} | Conta: ${task.accountName}`);
        
        return processIndividualReview({
          clientId: task.clientId,
          metaAccountId: task.accountId,
          reviewDate: today
        }).then(result => ({
          ...result,
          clientId: task.clientId,
          accountId: task.accountId,
          accountName: task.accountName,
          processing_time: Date.now() - taskStartTime
        })).catch(error => ({
          success: false,
          error: error.message || 'Erro inesperado',
          stack_trace: error.stack || 'Sem stack trace',
          clientId: task.clientId,
          accountId: task.accountId,
          accountName: task.accountName,
          processing_time: Date.now() - taskStartTime
        }));
      })
    );
    
    const processingTime = Date.now() - processingStartTime;
    console.log(`⚡ [BATCH] Processamento paralelo concluído em ${processingTime}ms`);
    
    // Processar resultados
    const results = [];
    const errors = [];
    let successCount = 0;
    let errorCount = 0;
    
    accountResults.forEach((promiseResult, index) => {
      const task = allReviewTasks[index];
      
      if (promiseResult.status === 'fulfilled') {
        const result = promiseResult.value;
        const clientTime = result.processing_time || 0;
        
        if (result.success) {
          successCount++;
          console.log(`✅ [BATCH] ========================================`);
          console.log(`✅ [BATCH] Conta ${index + 1}/${allReviewTasks.length} SUCESSO (${clientTime}ms)`);
          console.log(`✅ [BATCH] Cliente ID: ${task.clientId}`);
          console.log(`✅ [BATCH] Conta ID: ${task.accountId}`);
          console.log(`✅ [BATCH] Nome: ${result.data?.client?.name || 'N/A'}`);
          console.log(`✅ [BATCH] Conta: ${result.data?.account?.name || task.accountName}`);
          console.log(`✅ [BATCH] Gasto: R$ ${result.data?.review?.total_spent?.toFixed(2) || '0.00'}`);
          console.log(`✅ [BATCH] ========================================\n`);
          
          results.push({
            clientId: task.clientId,
            accountId: task.accountId,
            accountName: task.accountName,
            status: 'success',
            data: result.data,
            processing_time: clientTime
          });
        } else {
          errorCount++;
          const errorMsg = result.error || 'Erro desconhecido';
          console.error(`❌ [BATCH] ========================================`);
          console.error(`❌ [BATCH] Conta ${index + 1}/${allReviewTasks.length} ERRO (${clientTime}ms)`);
          console.error(`❌ [BATCH] Cliente ID: ${task.clientId}`);
          console.error(`❌ [BATCH] Conta ID: ${task.accountId}`);
          console.error(`❌ [BATCH] Erro: ${errorMsg}`);
          if (result.stack_trace) {
            console.error(`❌ [BATCH] Stack Trace:`);
            console.error(result.stack_trace);
          }
          console.error(`❌ [BATCH] ========================================\n`);
          
          errors.push({
            clientId: task.clientId,
            accountId: task.accountId,
            accountName: task.accountName,
            error: errorMsg,
            stack_trace: result.stack_trace,
            processing_time: clientTime
          });
          
          results.push({
            clientId: task.clientId,
            accountId: task.accountId,
            accountName: task.accountName,
            status: 'error',
            error: errorMsg,
            processing_time: clientTime
          });
        }
      } else {
        // Promise rejected
        errorCount++;
        const errorMsg = promiseResult.reason?.message || 'Promise rejeitada';
        const errorStack = promiseResult.reason?.stack || 'Sem stack trace';
        
        console.error(`❌ [BATCH] ========================================`);
        console.error(`❌ [BATCH] Conta ${index + 1}/${allReviewTasks.length} EXCEPTION`);
        console.error(`❌ [BATCH] Cliente ID: ${task.clientId}`);
        console.error(`❌ [BATCH] Conta ID: ${task.accountId}`);
        console.error(`❌ [BATCH] Mensagem: ${errorMsg}`);
        console.error(`❌ [BATCH] Stack Trace:`);
        console.error(errorStack);
        console.error(`❌ [BATCH] ========================================\n`);
        
        errors.push({
          clientId: task.clientId,
          accountId: task.accountId,
          accountName: task.accountName,
          error: errorMsg,
          stack_trace: errorStack,
          processing_time: 0
        });
        
        results.push({
          clientId: task.clientId,
          accountId: task.accountId,
          accountName: task.accountName,
          status: 'error',
          error: errorMsg,
          processing_time: 0
        });
      }
    });
    
    const batchTime = Date.now() - batchStartTime;
    
    console.log(`🎉 [BATCH] PROCESSAMENTO EM LOTE CONCLUÍDO (${batchTime}ms):`, {
      totalClients: clientIds.length,
      totalAccounts: allReviewTasks.length,
      successCount,
      errorCount,
      successRate: `${((successCount / allReviewTasks.length) * 100).toFixed(1)}%`
    });
    
    // Registrar log da revisão em massa para exibição na interface
    await supabase.from('system_logs').insert({
      event_type: 'batch_review_completed',
      message: 'Revisão em massa Meta Ads concluída automaticamente',
      details: {
        platform: 'meta',
        source: 'automatic',
        reviewDate: today,
        totalClients: clientIds.length,
        totalAccounts: allReviewTasks.length,
        successCount,
        errorCount,
        completedAt: new Date().toISOString(),
        processing_time: batchTime
      }
    });
    
    // Registrar na tabela de batch logs
    await supabase.from('batch_review_logs').insert({
      platform: 'meta',
      review_date: today,
      total_clients: clientIds.length,
      success_count: successCount,
      error_count: errorCount,
      execution_time_ms: batchTime,
      global_updates_performed: true,
      details: {
        total_accounts: allReviewTasks.length
      }
    });
    
    console.log(`📝 [BATCH] Logs registrados em system_logs e batch_review_logs`);
    
    return {
      success: true,
      data: {
        summary: {
          total_clients: clientIds.length,
          total_accounts: allReviewTasks.length,
          success_count: successCount,
          error_count: errorCount,
          success_rate: (successCount / allReviewTasks.length) * 100,
          processing_time: batchTime,
          review_date: today
        },
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    };

  } catch (error) {
    const batchTime = Date.now() - batchStartTime;
    console.error(`❌ [BATCH] ERRO NO PROCESSAMENTO EM LOTE (${batchTime}ms):`, error);
    return { success: false, error: error.message };
  }
}