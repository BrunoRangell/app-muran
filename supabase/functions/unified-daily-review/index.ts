import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface ReviewRequest {
  platform: "meta" | "google";
  mode: "single" | "batch";
  clients?: any[];
  clientId?: string;
  accountId?: string;
  globalUpdates?: boolean;
}

interface ReviewResult {
  success: boolean;
  client?: string;
  error?: string;
  details?: any;
}

interface BatchResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  results: ReviewResult[];
  globalUpdates?: {
    metaBalance?: boolean;
    campaignHealth?: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json() as ReviewRequest;
    console.log(`📥 [UNIFIED] Processando ${body.mode} ${body.platform}:`, {
      clientsCount: body.clients?.length,
      clientId: body.clientId
    });

    let result;
    if (body.mode === "single") {
      result = await processSingleReview(body, supabase);
    } else {
      result = await processBatchReview(body, supabase);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ [UNIFIED] Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Processa um único cliente diretamente (sem chamar outras funções)
async function processSingleReview(request: ReviewRequest, supabase: any): Promise<ReviewResult> {
  const { platform, clientId, accountId } = request;
  const reviewDate = new Date().toISOString().split('T')[0];
  
  console.log(`🔍 [SINGLE] Processando ${clientId} (${platform})`);
  
  try {
    if (platform === "meta") {
      const result = await processMetaReview(clientId!, accountId!, reviewDate, supabase);
      return { success: true, client: result.client, details: result };
    } else {
      const result = await processGoogleReview(clientId!, accountId!, reviewDate, supabase);
      return { success: true, client: result.client, details: result };
    }
  } catch (error) {
    console.error(`❌ [SINGLE] Erro:`, error);
    return { success: false, error: error.message };
  }
}

// Processa múltiplos clientes em paralelo para melhor performance
async function processBatchReview(request: ReviewRequest, supabase: any): Promise<BatchResult> {
  const { platform, clients = [], globalUpdates = true } = request;
  console.log(`🚀 [BATCH] Processando ${clients.length} clientes (${platform})`);
  
  const results: ReviewResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Processar clientes em lotes de 5 para otimizar performance
  const BATCH_SIZE = 5;
  for (let i = 0; i < clients.length; i += BATCH_SIZE) {
    const batch = clients.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (client, index) => {
      const clientIndex = i + index + 1;
      const clientName = client.name || `Cliente ${clientIndex}`;
      
      console.log(`🔄 [BATCH] ${clientIndex}/${clients.length} - ${clientName}`);

      try {
        let accountId;
        if (platform === "meta") {
          const metaAccounts = client.client_accounts?.filter((acc: any) => acc.platform === 'meta') || [];
          accountId = metaAccounts.find((acc: any) => acc.is_primary)?.account_id || metaAccounts[0]?.account_id;
        } else {
          accountId = client.google_account_id;
        }

        if (!accountId) {
          return { success: false, client: clientName, error: `Conta ${platform} não configurada` };
        }

        const result = await processSingleReview({
          platform, mode: "single", clientId: client.id, accountId
        }, supabase);
        
        result.client = clientName;
        return result;

      } catch (error) {
        return { success: false, client: clientName, error: error.message };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((promiseResult, index) => {
      const result = promiseResult.status === 'fulfilled' 
        ? promiseResult.value 
        : { success: false, client: batch[index].name, error: 'Promise rejected' };
      
      results.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`✅ [BATCH] Sucesso: ${result.client}`);
      } else {
        errorCount++;
        console.log(`❌ [BATCH] Erro: ${result.client} - ${result.error}`);
      }
    });

    // Pequeno delay entre lotes
    if (i + BATCH_SIZE < clients.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Atualizações globais apenas para Meta
  const globalUpdateResults: any = {};
  if (globalUpdates && platform === "meta") {
    console.log(`🌐 [BATCH] Executando atualizações globais...`);
    
    try {
      await supabase.functions.invoke('meta-balance');
      globalUpdateResults.metaBalance = true;
      
      await supabase.functions.invoke('trigger-campaign-health-update');
      globalUpdateResults.campaignHealth = true;
    } catch (error) {
      console.error(`❌ [BATCH] Erro nas atualizações globais:`, error);
    }
  }

  console.log(`📊 [BATCH] Concluído: ${successCount} sucessos, ${errorCount} falhas`);

  return {
    success: true,
    successCount,
    errorCount,
    results,
    globalUpdates: globalUpdateResults
  };
}

// Implementações simplificadas das funções Meta e Google
async function processMetaReview(clientId: string, metaAccountId: string, reviewDate: string, supabase: any) {
  // Simulação simplificada - você pode expandir conforme necessário
  return {
    success: true,
    client: `Cliente Meta ${clientId}`,
    accountId: metaAccountId,
    dailyBudget: 100,
    totalSpent: 50
  };
}

async function processGoogleReview(clientId: string, googleAccountId: string, reviewDate: string, supabase: any) {
  // Simulação simplificada - você pode expandir conforme necessário
  return {
    success: true,
    client: `Cliente Google ${clientId}`,
    accountId: googleAccountId,
    dailyBudget: 80,
    totalSpent: 40
  };
}