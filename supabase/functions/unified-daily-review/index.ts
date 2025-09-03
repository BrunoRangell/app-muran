import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewRequest {
  platform: 'meta' | 'google';
  mode: 'single' | 'batch';
  clientId?: string;
  accountId?: string;
  clients?: Array<{
    id: string;
    meta_account_id?: string;
    google_account_id?: string;
    company_name?: string;
  }>;
  options?: {
    skipGlobalUpdates?: boolean;
    updateCampaignHealth?: boolean;
  };
}

interface ReviewResult {
  success: boolean;
  clientId: string;
  clientName?: string;
  accountId?: string;
  error?: string;
  executionTime?: number;
}

interface BatchResult {
  success: boolean;
  totalClients: number;
  successCount: number;
  errorCount: number;
  results: ReviewResult[];
  executionTime: number;
  globalUpdatesPerformed?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🚀 [UNIFIED_REVIEW] Iniciando revisão unificada');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.text();
    if (!body || body.trim() === '') {
      throw new Error('Corpo da requisição vazio');
    }

    const reviewRequest: ReviewRequest = JSON.parse(body);
    console.log('📥 [UNIFIED_REVIEW] Request recebido:', {
      platform: reviewRequest.platform,
      mode: reviewRequest.mode,
      clientId: reviewRequest.clientId,
      clientsCount: reviewRequest.clients?.length || 0
    });

    // Validate request
    if (!reviewRequest.platform || !['meta', 'google'].includes(reviewRequest.platform)) {
      throw new Error('Platform deve ser "meta" ou "google"');
    }

    if (!reviewRequest.mode || !['single', 'batch'].includes(reviewRequest.mode)) {
      throw new Error('Mode deve ser "single" ou "batch"');
    }

    if (reviewRequest.mode === 'single' && !reviewRequest.clientId) {
      throw new Error('clientId é obrigatório para mode "single"');
    }

    if (reviewRequest.mode === 'batch' && (!reviewRequest.clients || reviewRequest.clients.length === 0)) {
      throw new Error('clients é obrigatório para mode "batch"');
    }

    let result: ReviewResult | BatchResult;

    if (reviewRequest.mode === 'single') {
      result = await processSingleReview(supabase, reviewRequest);
    } else {
      result = await processBatchReview(supabase, reviewRequest);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ [UNIFIED_REVIEW] Concluído em ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        ...result,
        executionTime: totalTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ [UNIFIED_REVIEW] Erro:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        executionTime: totalTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function processSingleReview(
  supabase: any,
  request: ReviewRequest
): Promise<ReviewResult> {
  const startTime = Date.now();
  console.log(`🔍 [SINGLE] Processando cliente ${request.clientId} (${request.platform})`);

  try {
    const functionName = request.platform === 'meta' ? 'daily-meta-review' : 'daily-google-review';
    const accountIdField = request.platform === 'meta' ? 'metaAccountId' : 'googleAccountId';
    
    const payload: any = {
      clientId: request.clientId,
      reviewDate: new Date().toISOString().split('T')[0]
    };

    if (request.accountId) {
      payload[accountIdField] = request.accountId;
    }

    console.log(`📞 [SINGLE] Chamando ${functionName} com payload:`, payload);

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) {
      console.error(`❌ [SINGLE] Erro em ${functionName}:`, error);
      return {
        success: false,
        clientId: request.clientId!,
        error: error.message || 'Erro desconhecido',
        executionTime: Date.now() - startTime
      };
    }

    console.log(`✅ [SINGLE] Sucesso para cliente ${request.clientId}`);

    return {
      success: true,
      clientId: request.clientId!,
      accountId: request.accountId,
      executionTime: Date.now() - startTime
    };

  } catch (error) {
    console.error(`❌ [SINGLE] Exceção para cliente ${request.clientId}:`, error);
    return {
      success: false,
      clientId: request.clientId!,
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

async function processBatchReview(
  supabase: any,
  request: ReviewRequest
): Promise<BatchResult> {
  const startTime = Date.now();
  const clients = request.clients!;
  console.log(`📦 [BATCH] Processando ${clients.length} clientes (${request.platform})`);

  const results: ReviewResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Process each client sequentially to avoid overloading APIs
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const clientStartTime = Date.now();
    
    console.log(`🔄 [BATCH] ${i + 1}/${clients.length} - Processando ${client.company_name || client.id}`);

    try {
      const accountId = request.platform === 'meta' 
        ? client.meta_account_id 
        : client.google_account_id;

      const singleRequest: ReviewRequest = {
        platform: request.platform,
        mode: 'single',
        clientId: client.id,
        accountId: accountId,
        options: { skipGlobalUpdates: true } // Skip global updates for individual clients in batch
      };

      const clientResult = await processSingleReview(supabase, singleRequest);
      clientResult.clientName = client.company_name;
      
      if (clientResult.success) {
        successCount++;
        console.log(`✅ [BATCH] ${i + 1}/${clients.length} - Sucesso: ${client.company_name}`);
      } else {
        errorCount++;
        console.log(`❌ [BATCH] ${i + 1}/${clients.length} - Erro: ${client.company_name} - ${clientResult.error}`);
      }

      results.push(clientResult);

      // Add small delay between requests to be respectful to APIs
      if (i < clients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      errorCount++;
      const errorResult: ReviewResult = {
        success: false,
        clientId: client.id,
        clientName: client.company_name,
        error: error.message,
        executionTime: Date.now() - clientStartTime
      };
      results.push(errorResult);
      
      console.log(`❌ [BATCH] ${i + 1}/${clients.length} - Exceção: ${client.company_name} - ${error.message}`);
    }
  }

  // Perform global updates if not skipped
  let globalUpdatesPerformed = false;
  if (!request.options?.skipGlobalUpdates) {
    console.log('🌐 [BATCH] Executando atualizações globais...');
    
    try {
      if (request.platform === 'meta') {
        // Update meta-balance for all accounts
        console.log('📊 [BATCH] Atualizando meta-balance...');
        await supabase.functions.invoke('meta-balance');
        
        // Update campaign health if requested
        if (request.options?.updateCampaignHealth !== false) {
          console.log('🏥 [BATCH] Atualizando campaign health...');
          await supabase.functions.invoke('trigger-campaign-health-update');
        }
      }
      
      globalUpdatesPerformed = true;
      console.log('✅ [BATCH] Atualizações globais concluídas');
      
    } catch (error) {
      console.error('❌ [BATCH] Erro nas atualizações globais:', error);
      // Don't fail the entire batch for global update errors
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(`🎯 [BATCH] Concluído: ${successCount} sucessos, ${errorCount} falhas em ${totalTime}ms`);

  // Log batch completion to database
  try {
    await supabase.from('batch_review_logs').insert({
      platform: request.platform,
      total_clients: clients.length,
      success_count: successCount,
      error_count: errorCount,
      execution_time_ms: totalTime,
      global_updates_performed: globalUpdatesPerformed,
      review_date: new Date().toISOString().split('T')[0]
    });
  } catch (logError) {
    console.error('⚠️ [BATCH] Erro ao registrar log:', logError);
  }

  return {
    success: true,
    totalClients: clients.length,
    successCount,
    errorCount,
    results,
    executionTime: totalTime,
    globalUpdatesPerformed
  };
}