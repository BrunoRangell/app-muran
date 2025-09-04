import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors } from "./cors.ts";
import { formatResponse, formatErrorResponse } from "./response.ts";
import { processIndividualReview } from "./individual.ts";
import { processBatchReview } from "./batch.ts";
import { processAccountHealth } from "./account-health.ts";
import { processBudgetCalculation } from "./budget-calculation.ts";
import { IndividualReviewRequest, BatchReviewRequest } from "./types.ts";

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
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      return formatErrorResponse("JSON inválido", 400);
    }

    // Detectar tipo de requisição
    const isIndividualReview = !!payload.clientId && !payload.clientIds;
    const isBatchReview = !!payload.clientIds && Array.isArray(payload.clientIds);
    const isAccountHealth = !!payload.accountId && !payload.clientId && !payload.clientIds;
    const isBudgetCalculation = !!payload.accountId && !!payload.accessToken && !payload.clientId && !payload.clientIds;
    
    console.log(`🔍 [UNIFIED-REVIEW] Dados recebidos:`, {
      hasClientId: !!payload.clientId,
      hasClientIds: !!payload.clientIds,
      hasAccountId: !!payload.accountId,
      hasAccessToken: !!payload.accessToken,
      isBatch: isBatchReview,
      isHealth: isAccountHealth,
      isBudget: isBudgetCalculation,
      reviewDate: payload.reviewDate || 'hoje',
      timestamp: new Date().toISOString()
    });

    let result;
    if (isBudgetCalculation) {
      console.log(`💰 [UNIFIED-REVIEW] Processando CÁLCULO DE ORÇAMENTO`);
      result = await processBudgetCalculation(payload);
    } else if (isAccountHealth) {
      console.log(`🏥 [UNIFIED-REVIEW] Processando HEALTH de conta individual`);
      result = await processAccountHealth(payload.accountId);
    } else if (isIndividualReview) {
      console.log(`👤 [UNIFIED-REVIEW] Processando revisão INDIVIDUAL`);
      result = await processIndividualReview(payload as IndividualReviewRequest);
    } else if (isBatchReview) {
      console.log(`👥 [UNIFIED-REVIEW] Processando revisão EM LOTE`);
      result = await processBatchReview(payload as BatchReviewRequest);
    } else {
      console.error(`❌ [UNIFIED-REVIEW] Tipo de requisição não identificado`);
      return formatErrorResponse("Parâmetros inválidos", 400);
    }
    
    if (!result.success) {
      return formatErrorResponse(result.error || "Erro no processamento", 500);
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