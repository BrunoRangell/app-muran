import { processIndividualReview } from "./individual.ts";
import { BatchReviewRequest } from "./types.ts";
import { createSupabaseClient, cleanupOldReviews } from "./database.ts";

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
    
    console.log(`📊 [BATCH] Processando ${clientIds.length} clientes em lote para data ${today}`);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Processar cada cliente individualmente
    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      const clientStartTime = Date.now();
      
      console.log(`\n👤 [BATCH] ========================================`);
      console.log(`👤 [BATCH] Processando cliente ${i + 1}/${clientIds.length}`);
      console.log(`👤 [BATCH] Cliente ID: ${clientId}`);
      console.log(`👤 [BATCH] ========================================`);
      
      try {
        // Criar timeout de 30 segundos por cliente
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT: Cliente demorou mais de 30 segundos para processar')), 30000);
        });
        
        // Race entre o processamento e o timeout
        const individualResult = await Promise.race([
          processIndividualReview({
            clientId,
            reviewDate: today
          }),
          timeoutPromise
        ]) as any;
        
        const clientTime = Date.now() - clientStartTime;
        
        if (individualResult.success) {
          successCount++;
          console.log(`✅ [BATCH] ========================================`);
          console.log(`✅ [BATCH] Cliente ${i + 1} SUCESSO (${clientTime}ms)`);
          console.log(`✅ [BATCH] Nome: ${individualResult.data?.client?.name || 'N/A'}`);
          console.log(`✅ [BATCH] Conta: ${individualResult.data?.account?.name || 'N/A'}`);
          console.log(`✅ [BATCH] Gasto: R$ ${individualResult.data?.review?.total_spent?.toFixed(2) || '0.00'}`);
          console.log(`✅ [BATCH] ========================================\n`);
          
          results.push({
            clientId,
            status: 'success',
            data: individualResult.data,
            processing_time: clientTime
          });
        } else {
          errorCount++;
          const errorMsg = individualResult.error || 'Erro desconhecido';
          console.error(`❌ [BATCH] ========================================`);
          console.error(`❌ [BATCH] Cliente ${i + 1} ERRO (${clientTime}ms)`);
          console.error(`❌ [BATCH] Cliente ID: ${clientId}`);
          console.error(`❌ [BATCH] Erro: ${errorMsg}`);
          console.error(`❌ [BATCH] ========================================\n`);
          
          errors.push({
            clientId,
            error: errorMsg,
            processing_time: clientTime
          });
          
          results.push({
            clientId,
            status: 'error',
            error: errorMsg,
            processing_time: clientTime
          });
        }
      } catch (error) {
        const clientTime = Date.now() - clientStartTime;
        errorCount++;
        const errorMsg = error.message || 'Erro inesperado';
        const errorStack = error.stack || 'Sem stack trace disponível';
        
        console.error(`❌ [BATCH] ========================================`);
        console.error(`❌ [BATCH] Cliente ${i + 1} EXCEPTION (${clientTime}ms)`);
        console.error(`❌ [BATCH] Cliente ID: ${clientId}`);
        console.error(`❌ [BATCH] Mensagem: ${errorMsg}`);
        console.error(`❌ [BATCH] Stack Trace:`);
        console.error(errorStack);
        console.error(`❌ [BATCH] Objeto de erro completo:`, JSON.stringify(error, null, 2));
        console.error(`❌ [BATCH] ========================================\n`);
        
        errors.push({
          clientId,
          error: errorMsg,
          stack_trace: errorStack,
          processing_time: clientTime
        });
        
        results.push({
          clientId,
          status: 'error',
          error: errorMsg,
          processing_time: clientTime
        });
      }
      
      // Pequena pausa entre processamentos para evitar sobrecarga
      if (i < clientIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const batchTime = Date.now() - batchStartTime;
    
    console.log(`🎉 [BATCH] PROCESSAMENTO EM LOTE CONCLUÍDO (${batchTime}ms):`, {
      totalClients: clientIds.length,
      successCount,
      errorCount,
      successRate: `${((successCount / clientIds.length) * 100).toFixed(1)}%`
    });
    
    return {
      success: true,
      data: {
        summary: {
          total_clients: clientIds.length,
          success_count: successCount,
          error_count: errorCount,
          success_rate: (successCount / clientIds.length) * 100,
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