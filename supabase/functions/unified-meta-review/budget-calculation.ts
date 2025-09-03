import { fetchMetaApiData } from "./meta-api.ts";

interface BudgetCalculationRequest {
  accountId: string;
  accessToken: string;
  dateRange?: { start: string; end: string };
  fetchSeparateInsights?: boolean;
}

/**
 * Calcula a diferença em dias entre duas datas
 */
function calculateDaysDiff(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  } catch (error) {
    console.error(`Erro ao calcular diferença de dias entre ${startDate} e ${endDate}:`, error);
    return 1;
  }
}

/**
 * Processa requisições de cálculo de orçamento
 */
export async function processBudgetCalculation(request: BudgetCalculationRequest) {
  const startTime = Date.now();
  
  try {
    console.log(`💰 [BUDGET-CALC] INICIANDO cálculo para conta ${request.accountId}`);
    
    const { accountId, accessToken, dateRange } = request;

    // Validar parâmetros obrigatórios
    if (!accountId) {
      return {
        success: false,
        error: "ID da conta Meta Ads não fornecido"
      };
    }

    if (!accessToken) {
      return {
        success: false,
        error: "Token de acesso não fornecido"
      };
    }

    // Determinar período de análise
    let effectiveDateRange;
    let daysDiff;
    
    if (!dateRange) {
      // Usar período do mês atual completo
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      effectiveDateRange = {
        start: firstDayOfMonth.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
      
      daysDiff = Math.ceil((today.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      console.log(`📅 [BUDGET-CALC] Usando período do mês atual: ${effectiveDateRange.start} a ${effectiveDateRange.end} (${daysDiff} dias)`);
    } else {
      effectiveDateRange = dateRange;
      daysDiff = calculateDaysDiff(dateRange.start, dateRange.end);
      
      console.log(`📅 [BUDGET-CALC] Usando período fornecido: ${effectiveDateRange.start} a ${effectiveDateRange.end} (${daysDiff} dias)`);
    }

    // Buscar dados da Meta API com o período definido
    const customBudget = effectiveDateRange !== dateRange ? null : {
      start_date: effectiveDateRange.start,
      end_date: effectiveDateRange.end
    };

    const metaData = await fetchMetaApiData(accountId, accessToken, customBudget);

    if (!metaData.success) {
      return {
        success: false,
        error: metaData.error || "Erro ao buscar dados da Meta API"
      };
    }

    const totalTime = Date.now() - startTime;
    
    console.log(`💰 [BUDGET-CALC] CONCLUÍDO (${totalTime}ms): {
      dailyBudget: "R$ ${metaData.daily_budget}",
      totalSpent: "R$ ${metaData.total_spent}",
      accountName: "${metaData.account_name}"
    }`);

    // Retornar dados no formato compatível com meta-budget-calculator
    return {
      success: true,
      totalDailyBudget: metaData.daily_budget,
      totalSpent: metaData.total_spent,
      campaignDetails: [], // Dados detalhados das campanhas poderiam ser implementados aqui
      diagnostics: {
        dateRange: effectiveDateRange,
        daysPeriod: daysDiff,
        accountName: metaData.account_name,
        correctedPeriod: !dateRange ? "Período corrigido para mês atual completo" : "Período fornecido pelo usuário",
        totalTime: `${totalTime}ms`
      }
    };

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [BUDGET-CALC] Erro após ${totalTime}ms:`, error);
    
    return {
      success: false,
      error: `Erro no cálculo de orçamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}