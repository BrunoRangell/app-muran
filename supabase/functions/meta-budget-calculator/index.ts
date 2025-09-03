
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { validateRequest, processDateRange } from "./validators.ts";
import { fetchCampaigns, fetchCampaignInsights, fetchAdSets } from "./api.ts";
import { calculateDailyBudgets, processCampaign } from "./budget.ts";
import { formatResponse } from "./response.ts";

serve(async (req) => {
  // Processar requisição CORS preflight se for OPTIONS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Extrair corpo da requisição
    const requestBody = await req.json();
    console.log("Meta Budget Calculator - Requisição recebida:", JSON.stringify({
      ...requestBody,
      accessToken: requestBody.accessToken ? "***TOKEN OCULTADO***" : undefined
    }));
    
    const { accountId, accessToken, dateRange } = requestBody;

    // Validar parâmetros de entrada
    const validationError = validateRequest(accountId, accessToken);
    if (validationError) {
      return validationError;
    }

    // CORREÇÃO: Se não há dateRange especificado, usar período do mês atual completo
    let effectiveDateRange;
    let daysDiff;
    
    if (!dateRange) {
      // Calcular período do mês atual completo (igual ao daily-meta-review)
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      effectiveDateRange = {
        start: firstDayOfMonth.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
      
      daysDiff = Math.ceil((today.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      console.log(`📅 CORREÇÃO: Usando período do mês atual completo: ${effectiveDateRange.start} a ${effectiveDateRange.end}`);
      console.log(`📅 Diferença em dias calculada: ${daysDiff}`);
    } else {
      // Processar intervalo de datas fornecido
      const dateRangeResult = processDateRange(dateRange);
      effectiveDateRange = dateRangeResult.effectiveDateRange;
      daysDiff = dateRangeResult.daysDiff;
      
      console.log(`📅 Usando período fornecido: ${effectiveDateRange.start} a ${effectiveDateRange.end}`);
      console.log(`📅 Diferença em dias: ${daysDiff}`);
    }
    
    // Buscar campanhas e insights
    const campaigns = await fetchCampaigns(accountId, accessToken);
    if (!campaigns.success) {
      return campaigns.response;
    }

    // Buscar insights de gastos para o período CORRIGIDO
    const insightsResult = await fetchCampaignInsights(
      accountId, 
      accessToken, 
      effectiveDateRange, 
      requestBody.fetchSeparateInsights
    );
    
    if (!insightsResult.success) {
      return insightsResult.response;
    }

    console.log(`💰 Total gasto no período (${effectiveDateRange.start} a ${effectiveDateRange.end}): ${insightsResult.totalSpent}`);

    // Calcular orçamentos
    const budgetResult = await calculateDailyBudgets(
      campaigns.data, 
      insightsResult.totalSpent,
      accessToken,
      daysDiff
    );

    // Formatar resposta com os resultados calculados
    return formatResponse({
      totalDailyBudget: budgetResult.totalDailyBudget,
      totalSpent: insightsResult.totalSpent,
      campaignDetails: budgetResult.campaignDetails,
      diagnostics: {
        totalCampaigns: campaigns.data.length,
        includedItems: budgetResult.campaignDetails.length,
        skippedCampaigns: budgetResult.skippedCampaigns,
        statusCounts: budgetResult.statusCounts,
        dateRange: effectiveDateRange,
        daysPeriod: daysDiff,
        correctedPeriod: !dateRange ? "Período corrigido para mês atual completo" : "Período fornecido pelo usuário"
      }
    });

  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return new Response(
      JSON.stringify({ error: `Erro ao processar requisição: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
