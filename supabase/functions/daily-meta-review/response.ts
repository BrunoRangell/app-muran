
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

// Função para formatar respostas de erro
export function formatErrorResponse(message: string, status = 500) {
  console.error(`Erro: ${message}`);
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message 
    }),
    { 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      }, 
      status 
    }
  );
}
