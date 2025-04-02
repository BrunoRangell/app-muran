
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configura os cabeçalhos CORS para permitir chamadas do frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Limiar de renovação: renovar token se expirar em menos de X minutos
const REFRESH_THRESHOLD_MINUTES = 30;

serve(async (req) => {
  // Tratamento da requisição OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge function google-ads-token-check iniciada");
    
    // Extrair corpo da requisição
    let payload = {};
    try {
      if (req.body) {
        const body = await req.json();
        payload = body;
        console.log("Payload recebido:", JSON.stringify(payload));
      }
    } catch (e) {
      console.log("Requisição sem payload ou payload inválido");
    }
    
    // Inicializa o cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Função para registrar logs
    async function logTokenEvent(event: string, status: string, message: string, details?: any) {
      try {
        console.log(`[TokenEvent] ${event} - ${status}: ${message}`);
        
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
    
    // Verificar configuração
    const { data: config, error: configError } = await supabaseClient
      .from("system_configs")
      .select("value")
      .eq("key", "google_ads_token_config")
      .maybeSingle();
      
    // Se a edge function estiver desativada e não for uma chamada manual, retornamos
    const isManual = payload && (payload as any).manual === true;
    if (!isManual && configError || !isManual && !config?.value?.edge_function_enabled) {
      if (configError) {
        await logTokenEvent("error", "unknown", "Erro ao verificar configuração da edge function", configError);
      } else {
        await logTokenEvent("check", "unknown", "Edge function desativada nas configurações");
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          disabled: true,
          message: "Edge function está desativada nas configurações" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    tokensData?.forEach((token: any) => {
      tokens[token.name] = token.value;
    });
    
    // Verificar se todos os tokens necessários estão presentes
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
    
    // Verificar metadados do token para decisão inteligente
    const { data: metadata } = await supabaseClient
      .from("google_ads_token_metadata")
      .select("*")
      .eq("token_type", "access_token")
      .maybeSingle();
      
    let shouldRefresh = isManual; // Sempre renovar se for chamada manual
    
    // Se temos metadados e não é uma chamada manual, verificamos se o token está próximo de expirar
    if (!isManual && metadata?.expires_at) {
      const expiresAt = new Date(metadata.expires_at);
      const now = new Date();
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (60 * 1000);
      
      await logTokenEvent("check", "info", `Token expira em ${minutesUntilExpiry.toFixed(1)} minutos`, {
        expires_at: metadata.expires_at,
        minutes_remaining: minutesUntilExpiry,
        is_manual: isManual
      });
      
      // Se o token expira em menos de X minutos, renovar proativamente
      if (minutesUntilExpiry < REFRESH_THRESHOLD_MINUTES) {
        shouldRefresh = true;
      }
    } else if (!isManual) {
      // Se não temos metadados e não é chamada manual, verificamos o token
      shouldRefresh = true;
    }
    
    // Se não precisamos renovar, apenas verificamos o token atual
    if (!shouldRefresh) {
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
              status: "valid",
              last_checked: new Date().toISOString(),
              details: JSON.stringify(tokenInfo),
              expires_at: new Date(Date.now() + (tokenInfo.expires_in * 1000)).toISOString()
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
          // Token inválido ou expirado, precisamos renovar
          shouldRefresh = true;
        }
      } catch (error) {
        // Erro ao verificar token, vamos tentar renovar
        await logTokenEvent("check", "error", "Erro ao verificar token atual", error);
        shouldRefresh = true;
      }
    }
    
    // Processo de renovação de token
    if (shouldRefresh) {
      await logTokenEvent("refresh", "refreshing", isManual ? "Iniciando renovação manual do token" : "Iniciando renovação proativa do token");
      
      try {
        console.log("Iniciando processo de renovação do token...");
        
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
        
        console.log("Resposta do Google OAuth:", refreshResponse.status);
        
        if (refreshResponse.status === 200) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.access_token;
          const expiresIn = refreshData.expires_in || 3600; // Padrão 1 hora
          
          if (!newAccessToken) {
            throw new Error("Resposta da API Google não contém access_token");
          }

          console.log("Token renovado com sucesso, atualizando no banco de dados");
          
          // Salva o novo token de acesso
          const { error: updateError } = await supabaseClient
            .from("api_tokens")
            .update({ value: newAccessToken })
            .eq("name", "google_ads_access_token");
            
          if (updateError) {
            throw new Error(`Erro ao atualizar token no banco de dados: ${updateError.message}`);
          }
          
          // Calcula e salva quando o token expira
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
          
          // Atualiza os metadados
          await supabaseClient
            .from("google_ads_token_metadata")
            .upsert({
              token_type: "access_token",
              status: "valid",
              last_refreshed: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              last_checked: new Date().toISOString(),
              details: JSON.stringify(refreshData)
            });
          
          await logTokenEvent("refresh", "valid", isManual ? "Token renovado com sucesso manualmente" : "Token renovado com sucesso pela edge function", { 
            expires_in: expiresIn,
            expires_at: expiresAt.toISOString(),
            is_manual: isManual
          });
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: isManual ? "Token renovado com sucesso manualmente" : "Token renovado com sucesso pela edge function",
              refreshed: true,
              expires_in: expiresIn,
              expires_at: expiresAt.toISOString()
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          const errorData = await refreshResponse.json();
          await logTokenEvent("error", "expired", "Falha ao renovar token pela edge function", errorData);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Falha ao renovar token pela edge function",
              error: errorData
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        // Erro ao renovar token
        await logTokenEvent("error", "unknown", "Erro durante renovação do token pela edge function", error);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Erro durante renovação do token pela edge function: ${error instanceof Error ? error.message : String(error)}` 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
