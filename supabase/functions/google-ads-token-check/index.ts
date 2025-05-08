
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

async function handleTokenCheck() {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: "Configuração do Supabase incompleta" };
    }

    // Obter tokens da API do Google Ads
    const googleTokensResponse = await fetch(
      `${supabaseUrl}/rest/v1/api_tokens?name=in.(google_ads_access_token,google_ads_refresh_token,google_ads_client_id,google_ads_client_secret,google_ads_developer_token,google_ads_manager_id)&select=name,value`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!googleTokensResponse.ok) {
      throw new Error(`Erro ao buscar tokens: ${googleTokensResponse.statusText}`);
    }
    
    const googleTokensData = await googleTokensResponse.json();
    const googleTokens: Record<string, string> = {};
    
    googleTokensData.forEach((token: { name: string; value: string }) => {
      googleTokens[token.name] = token.value;
    });
    
    // Verificar se os tokens necessários existem
    const tokenStatuses: Record<string, string> = {};
    const requiredTokens = [
      'google_ads_access_token',
      'google_ads_refresh_token',
      'google_ads_client_id',
      'google_ads_client_secret',
      'google_ads_developer_token',
      'google_ads_manager_id'
    ];
    
    let allTokensPresent = true;
    
    // Verificar presença dos tokens
    for (const tokenName of requiredTokens) {
      if (!googleTokens[tokenName]) {
        tokenStatuses[tokenName] = "ausente";
        allTokensPresent = false;
      } else {
        const value = googleTokens[tokenName];
        // Mostrar apenas os primeiros caracteres do token para segurança
        tokenStatuses[tokenName] = `presente (${value.substring(0, 4)}...)`;
      }
    }
    
    // Se temos tokens de refresh, tentar atualizar o token de acesso
    if (googleTokens.google_ads_refresh_token && 
        googleTokens.google_ads_client_id && 
        googleTokens.google_ads_client_secret) {
      
      try {
        console.log("Tentando atualizar o token de acesso...");
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: googleTokens.google_ads_client_id,
            client_secret: googleTokens.google_ads_client_secret,
            refresh_token: googleTokens.google_ads_refresh_token,
            grant_type: "refresh_token"
          })
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.access_token) {
            console.log("Token de acesso atualizado com sucesso");
            
            // Atualizar o token no banco de dados
            const updateResponse = await fetch(
              `${supabaseUrl}/rest/v1/api_tokens?name=eq.google_ads_access_token`, {
              method: "PATCH",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({
                value: refreshData.access_token,
                updated_at: new Date().toISOString()
              })
            });
            
            if (!updateResponse.ok) {
              throw new Error(`Erro ao atualizar token: ${updateResponse.statusText}`);
            }
            
            // Registrar a atualização
            await fetch(
              `${supabaseUrl}/rest/v1/google_ads_token_metadata`, {
              method: "POST",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({
                token_type: "access_token",
                status: "updated",
                last_refreshed: new Date().toISOString(),
                expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hora de validade
                details: {
                  token_type: refreshData.token_type,
                  expires_in: refreshData.expires_in,
                  scope: refreshData.scope
                }
              })
            });
            
            return { 
              success: true, 
              message: "Token atualizado com sucesso", 
              tokenStatuses,
              apiAccess: true,
              refreshSuccess: true
            };
          } else {
            throw new Error("Resposta do refresh sem token de acesso");
          }
        } else {
          const errorText = await refreshResponse.text();
          let errorJson;
          try {
            errorJson = JSON.parse(errorText);
          } catch (e) {
            errorJson = { error: errorText };
          }
          
          console.error("Erro ao atualizar token:", errorJson);
          throw new Error(`Falha ao atualizar token: ${errorJson?.error?.message || errorText}`);
        }
      } catch (refreshError) {
        console.error("Erro no processo de refresh:", refreshError);
        return { 
          success: false, 
          error: `Erro ao atualizar token: ${refreshError.message}`, 
          tokenStatuses,
          apiAccess: false,
          refreshSuccess: false
        };
      }
    }
    
    // Se não temos todos os tokens necessários ou a atualização não foi possível
    return {
      success: allTokensPresent,
      message: allTokensPresent 
        ? "Todos os tokens estão presentes, mas não foi possível testar o acesso à API" 
        : "Alguns tokens estão ausentes",
      tokenStatuses,
      apiAccess: false,
      allTokensPresent
    };
    
  } catch (error) {
    console.error("Erro ao verificar tokens:", error);
    return {
      success: false,
      error: `Erro ao verificar tokens: ${error.message}`
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const result = await handleTokenCheck();
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Erro na função Edge:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Erro desconhecido"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
