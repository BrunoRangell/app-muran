import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🚀 Iniciando atualização geral de campaign_health...')

    // 1. Chamar a função de limpeza manual primeiro
    console.log('🧹 Executando limpeza manual...')
    const { data: cleanupData, error: cleanupError } = await supabase.rpc('manual_cleanup_campaign_health')
    
    if (cleanupError) {
      console.error('❌ Erro na limpeza manual:', cleanupError)
    } else {
      console.log('✅ Limpeza manual concluída:', cleanupData)
    }

    // 2. Chamar a função active-campaigns-health para buscar dados atualizados
    console.log('📊 Executando busca de campanhas ativas...')
    const { data: updateData, error: updateError } = await supabase.functions.invoke('active-campaigns-health')

    if (updateError) {
      console.error('❌ Erro na busca de campanhas:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: updateError.message,
          details: updateError,
          cleanup_result: cleanupData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    console.log('✅ Busca de campanhas concluída:', updateData)

    // 3. Verificar quantos registros temos agora
    const { data: finalCount, error: countError } = await supabase
      .from('campaign_health')
      .select('*', { count: 'exact', head: true })

    console.log('📊 Total de registros após atualização:', finalCount?.length || 'N/A')

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleanup_result: cleanupData,
        update_result: updateData,
        final_count: finalCount?.length || 0,
        message: 'Atualização geral executada com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Erro crítico na atualização geral:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})