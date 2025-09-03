import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, corsHeaders } from "./cors.ts";
import { formatResponse, formatErrorResponse } from "./response.ts";
import { processIndividualReview } from "./individual.ts";
import { processBatchReview } from "./batch.ts";

// Handler principal da função unificada
serve(async (req: Request) => {
  // Tratar CORS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Implementar rate limiting básico
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  console.log(`🚀 [UNIFIED-REVIEW] Request from IP: ${clientIP}`);

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
    if (body.length > 50000) { // 50KB limit para suportar batch
      return formatErrorResponse("Payload muito grande", 413);
    }

    // Validar JSON
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (error) {
      return formatErrorResponse("JSON inválido", 400);
    }

    console.log(`🔍 [UNIFIED-REVIEW] Dados recebidos:`, {
      hasClientId: !!requestData.clientId,
      hasClientIds: !!requestData.clientIds,
      isBatch: !!requestData.clientIds && Array.isArray(requestData.clientIds),
      reviewDate: requestData.reviewDate,
      timestamp: new Date().toISOString()
    });

    // Detectar se é revisão individual ou batch
    const isBatchReview = requestData.clientIds && Array.isArray(requestData.clientIds);
    
    let result;
    if (isBatchReview) {
      console.log(`📊 [UNIFIED-REVIEW] Processando BATCH de ${requestData.clientIds.length} clientes`);
      result = await processBatchReview(requestData);
    } else {
      console.log(`👤 [UNIFIED-REVIEW] Processando revisão INDIVIDUAL`);
      result = await processIndividualReview(requestData);
    }
    
    if (!result.success) {
      return formatErrorResponse(result.error || "Erro desconhecido", 500);
    }

    return formatResponse(result);
  } catch (error) {
    console.error("❌ [UNIFIED-REVIEW] Erro na função:", error.message);
    
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