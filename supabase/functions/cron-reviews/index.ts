
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Configuração CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

console.log("Função Edge 'cron-reviews' carregada - v1.0.0");

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Faltam credenciais do Supabase");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar se é hora de executar a revisão agendada
    const { data, error } = await supabase.functions.invoke("scheduled-reviews", {
      body: { method: "check" }
    });
    
    if (error) {
      throw new Error(`Erro ao verificar agendamento: ${error.message}`);
    }
    
    if (data && data.shouldRun) {
      console.log("É hora de executar a revisão agendada. Executando...");
      
      // Executar a revisão em massa
      const { data: runData, error: runError } = await supabase.functions.invoke("scheduled-reviews", {
        body: { method: "force-run" }
      });
      
      if (runError) {
        throw new Error(`Erro ao executar revisão em massa: ${runError.message}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Revisão em massa agendada executada com sucesso",
          details: runData
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      console.log("Ainda não é hora de executar a revisão agendada");
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Verificação de agendamento concluída. Não é hora de executar a revisão.",
          data
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
  } catch (err) {
    console.error("Erro não tratado na função Edge:", err);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Erro interno no servidor",
        error: {
          message: err.message,
          stack: err.stack,
        }
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
