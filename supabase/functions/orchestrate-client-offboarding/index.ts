import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface OrchestrationRequest {
  clientId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log("🎯 [ORCHESTRATOR-OFFBOARDING] Iniciando orquestração de offboarding");

    const { clientId }: OrchestrationRequest = await req.json();

    if (!clientId) {
      throw new Error("clientId é obrigatório");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar dados do cliente
    console.log(`📋 Buscando dados do cliente ${clientId}...`);
    
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      throw new Error(`Cliente não encontrado: ${clientError?.message}`);
    }

    console.log(`✅ Cliente encontrado: ${client.company_name}`);

    // 2. Validar se o cliente está ativo
    if (client.status !== "active") {
      throw new Error(`Cliente não está ativo. Status atual: ${client.status}`);
    }

    // 3. Verificar se já existe offboarding em andamento
    const { data: existingOffboarding } = await supabase
      .from("offboarding")
      .select("*")
      .eq("client_id", clientId)
      .in("status", ["pending", "in_progress"])
      .maybeSingle();

    if (existingOffboarding) {
      throw new Error("Já existe um processo de offboarding em andamento para este cliente");
    }

    // 4. Criar registro de offboarding
    console.log("📝 Criando registro de offboarding...");
    
    const { data: offboarding, error: offboardingError } = await supabase
      .from("offboarding")
      .insert({
        client_id: clientId,
        status: "in_progress",
      })
      .select()
      .single();

    if (offboardingError) {
      throw new Error(`Erro ao criar registro de offboarding: ${offboardingError.message}`);
    }

    console.log(`✅ Registro de offboarding criado: ${offboarding.id}`);

    // 5. Executar integração ClickUp
    console.log("🔧 Iniciando integração ClickUp...");
    
    const clickupResult = await supabase.functions.invoke("create-clickup-offboarding", {
      body: {
        clientName: client.company_name,
        clientId: client.id,
      },
    });

    if (clickupResult.error) {
      console.error("❌ Erro na integração ClickUp:", clickupResult.error);
      
      await supabase
        .from("offboarding")
        .update({
          status: "failed",
          clickup_status: "failed",
          clickup_error: { message: clickupResult.error.message },
        })
        .eq("id", offboarding.id);

      throw new Error(`Erro no ClickUp: ${clickupResult.error.message}`);
    }

    console.log("✅ Integração ClickUp concluída com sucesso");

    // 6. Buscar resultado final do offboarding
    const { data: finalOffboarding } = await supabase
      .from("offboarding")
      .select("*")
      .eq("id", offboarding.id)
      .single();

    console.log("✅ [ORCHESTRATOR-OFFBOARDING] Processo concluído com sucesso");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Offboarding executado com sucesso",
        data: {
          offboarding: finalOffboarding,
          client: {
            id: client.id,
            company_name: client.company_name,
            status: client.status,
          },
          clickup: clickupResult.data,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ [ORCHESTRATOR-OFFBOARDING] Erro:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
