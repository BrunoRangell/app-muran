
import { corsHeaders } from "./cors.ts";

// Função para formatar a resposta da API
export function formatResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      }, 
      status: 200 
    }
  );
}
