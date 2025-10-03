import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestrationRequest {
  clientId: string;
  integrations: {
    clickup: boolean;
    discord: boolean;
    drive: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, integrations }: OrchestrationRequest = await req.json();

    console.log(`🎯 [ORCHESTRATOR] Iniciando onboarding para cliente ${clientId}`);
    console.log(`🔧 [ORCHESTRATOR] Integrações: ${JSON.stringify(integrations)}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('company_name')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      throw new Error('Cliente não encontrado');
    }

    const clientName = client.company_name;
    console.log(`👤 [ORCHESTRATOR] Cliente: ${clientName}`);

    // Criar ou atualizar registro de onboarding
    const { data: existingOnboarding } = await supabase
      .from('onboarding')
      .select('id')
      .eq('client_id', clientId)
      .single();

    if (existingOnboarding) {
      await supabase
        .from('onboarding')
        .update({ status: 'in_progress' })
        .eq('client_id', clientId);
    } else {
      await supabase
        .from('onboarding')
        .insert({
          client_id: clientId,
          status: 'in_progress'
        });
    }

    const results = {
      clickup: null as any,
      discord: null as any,
      drive: null as any
    };

    let driveLink = null;

    // Executar integrações sequencialmente
    // 1. Criar Drive primeiro (se habilitado)
    if (integrations.drive) {
      console.log(`📁 [ORCHESTRATOR] Iniciando Google Drive...`);
      try {
        const driveResult = await supabase.functions.invoke('create-drive-folder', {
          body: { clientName, clientId }
        });
        results.drive = driveResult.data;
        driveLink = driveResult.data?.folderLink;
        console.log(`✅ [ORCHESTRATOR] Drive concluído`);
      } catch (err: any) {
        results.drive = { success: false, error: err.message };
        console.error(`❌ [ORCHESTRATOR] Drive falhou:`, err);
      }
    }

    // 2. Criar Discord e enviar link do Drive (se habilitado)
    if (integrations.discord) {
      console.log(`💬 [ORCHESTRATOR] Iniciando Discord...`);
      try {
        const discordResult = await supabase.functions.invoke('create-discord-channel', {
          body: { clientName, clientId, driveLink }
        });
        results.discord = discordResult.data;
        console.log(`✅ [ORCHESTRATOR] Discord concluído`);
      } catch (err: any) {
        results.discord = { success: false, error: err.message };
        console.error(`❌ [ORCHESTRATOR] Discord falhou:`, err);
      }
    }

    // 3. Criar ClickUp por último (se habilitado)
    if (integrations.clickup) {
      console.log(`📋 [ORCHESTRATOR] Iniciando ClickUp...`);
      try {
        const clickupResult = await supabase.functions.invoke('create-clickup-project', {
          body: { clientName, clientId }
        });
        results.clickup = clickupResult.data;
        console.log(`✅ [ORCHESTRATOR] ClickUp concluído`);
      } catch (err: any) {
        results.clickup = { success: false, error: err.message };
        console.error(`❌ [ORCHESTRATOR] ClickUp falhou:`, err);
      }
    }

    // Calcular status final
    const enabledIntegrations = Object.values(integrations).filter(Boolean).length;
    const successfulIntegrations = Object.values(results)
      .filter(r => r && r.success === true).length;

    let finalStatus = 'completed';
    if (successfulIntegrations === 0) {
      finalStatus = 'failed';
    } else if (successfulIntegrations < enabledIntegrations) {
      finalStatus = 'partial';
    }

    // Atualizar status final
    await supabase
      .from('onboarding')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString()
      })
      .eq('client_id', clientId);

    console.log(`🎉 [ORCHESTRATOR] Onboarding concluído: ${finalStatus}`);
    console.log(`📊 [ORCHESTRATOR] ${successfulIntegrations}/${enabledIntegrations} integrações bem-sucedidas`);

    return new Response(
      JSON.stringify({
        success: true,
        status: finalStatus,
        results,
        summary: {
          enabled: enabledIntegrations,
          successful: successfulIntegrations,
          failed: enabledIntegrations - successfulIntegrations
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [ORCHESTRATOR] Erro crítico:', error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
