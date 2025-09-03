
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processReviewRequest } from "./processor.ts";
import { handleCors, corsHeaders } from "./cors.ts";
import { formatResponse, formatErrorResponse } from "./response.ts";

// Handler principal da função
serve(async (req: Request) => {
  // Tratar CORS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Implementar rate limiting básico
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  console.log(`Request from IP: ${clientIP}`);

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return formatErrorResponse("Método não permitido", 405);
    }

    // Validar Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return formatErrorResponse("Content-Type deve ser application/json", 400);
    }

    // Validar tamanho do body
    const body = await req.text();
    if (body.length > 10000) { // 10KB limit
      return formatErrorResponse("Payload muito grande", 413);
    }

    // Validar JSON
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (error) {
      return formatErrorResponse("JSON inválido", 400);
    }

    // Validar parâmetros obrigatórios
    if (requestData.clientId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestData.clientId)) {
      return formatErrorResponse("Client ID inválido", 400);
    }

    // Criar novo request com body validado
    const validatedRequest = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(requestData),
    });

    const result = await processReviewRequest(validatedRequest);
    
    if (!result.success) {
      return formatErrorResponse(result.error || "Erro desconhecido", 500);
    }

    return formatResponse(result);
  } catch (error) {
    console.error("Erro na função Edge:", error.message);
    
    // Log para monitoramento de segurança
    console.error("Security log:", {
      timestamp: new Date().toISOString(),
      ip: clientIP,
      error: error.message,
      url: req.url,
      method: req.method
    });
    
    return formatErrorResponse("Erro interno do servidor", 500);
  }
});
