
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configura os cabeçalhos CORS para permitir chamadas do frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Tratamento da requisição OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializa o cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Função para registrar logs
    async function logTokenEvent(event: string, status: string, message: string, details?: any) {
      try {
        await supabaseClient.from("google_ads_token_logs").insert({
          event_type: event,
          token_status: status,
          message: message,
          details: details ? JSON.stringify(details) : null
        });
      } catch (error) {
        console.error("Erro ao registrar log:", error);
      }
    }

    // Busca os tokens do Google Ads
    const { data: tokensData, error: tokensError } = await supabaseClient
      .from("api_tokens")
      .select("name, value")
      .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret');
    
    if (tokensError) {
      await logTokenEvent("error", "unknown", "Erro ao buscar tokens", tokensError);
      throw new Error(`Erro ao buscar tokens: ${tokensError.message}`);
    }
    
    const tokens: Record<string, string> = {};
    tokensData.forEach((token: any) => {
      tokens[token.name] = token.value;
    });
    
    // Verifica se todos os tokens necessários estão presentes
    const requiredTokens = ['google_ads_access_token', 'google_ads_refresh_token', 'google_ads_client_id', 'google_ads_client_secret'];
    const missingTokens = requiredTokens.filter(token => !tokens[token]);
    
    if (missingTokens.length > 0) {
      await logTokenEvent("check", "error", `Tokens obrigatórios ausentes: ${missingTokens.join(', ')}`, { missingTokens });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Tokens obrigatórios ausentes: ${missingTokens.join(', ')}`,
          missing: missingTokens
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Tenta verificar o token de acesso atual
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + tokens.google_ads_access_token);
      
      if (response.status === 200) {
        const tokenInfo = await response.json();
        
        await logTokenEvent("check", "valid", "Token de acesso válido", { 
          expires_in: tokenInfo.expires_in,
          scope: tokenInfo.scope
        });
        
        // Atualiza os metadados do token
        await supabaseClient
          .from("google_ads_token_metadata")
          .upsert({
            token_type: "access_token",
            last_checked: new Date().toISOString(),
            status: "valid",
            details: JSON.stringify(tokenInfo)
          });
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Token de acesso válido", 
            expires_in: tokenInfo.expires_in,
            token_info: tokenInfo
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Token inválido ou expirado, tenta renovar
        await logTokenEvent("check", "expired", "Token de acesso expirado ou inválido");
        
        // Atualiza o status nos metadados
        await supabaseClient
          .from("google_ads_token_metadata")
          .upsert({
            token_type: "access_token",
            last_checked: new Date().toISOString(),
            status: "expired"
          });
        
        // Tenta renovar o token
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: tokens.google_ads_client_id,
            client_secret: tokens.google_ads_client_secret,
            refresh_token: tokens.google_ads_refresh_token,
            grant_type: "refresh_token"
          })
        });
        
        if (refreshResponse.status === 200) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.access_token;
          const expiresIn = refreshData.expires_in || 3600; // Padrão 1 hora

          // Salva o novo token de acesso
          await supabaseClient
            .from("api_tokens")
            .update({ value: newAccessToken })
            .eq("name", "google_ads_access_token");
          
          // Calcula e salva quando o token expira
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
          
          // Atualiza os metadados
          await supabaseClient
            .from("google_ads_token_metadata")
            .upsert({
              token_type: "access_token",
              last_refreshed: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              status: "valid",
              details: JSON.stringify(refreshData)
            });
          
          await logTokenEvent("refresh", "valid", "Token renovado com sucesso", { 
            expires_in: expiresIn,
            expires_at: expiresAt.toISOString()
          });
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Token renovado com sucesso",
              refreshed: true,
              expires_in: expiresIn,
              expires_at: expiresAt.toISOString()
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          const errorData = await refreshResponse.json();
          await logTokenEvent("error", "expired", "Falha ao renovar token", errorData);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Falha ao renovar token",
              error: errorData
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (error) {
      // Erro ao verificar ou renovar token
      await logTokenEvent("error", "unknown", "Erro durante verificação/renovação do token", error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Erro durante verificação/renovação do token: ${error instanceof Error ? error.message : String(error)}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    // Erro geral do serviço
    console.error("Erro no serviço de verificação de token:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erro no serviço: ${error instanceof Error ? error.message : String(error)}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
