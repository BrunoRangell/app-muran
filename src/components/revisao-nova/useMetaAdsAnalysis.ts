
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { SimpleAnalysisResult } from "@/components/daily-reviews/hooks/types";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  company_name: string;
  meta_account_id: string;
}

export const useMetaAdsAnalysis = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [analysis, setAnalysis] = useState<SimpleAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const fetchAnalysis = async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setRawApiResponse(null);
    setDebugInfo(null);

    try {
      console.log("[useMetaAdsAnalysis] Iniciando análise para cliente:", clientId);
      
      // 1. Verificar se o cliente existe e buscar seus dados
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id")
        .eq("id", clientId)
        .single();
      
      if (clientError) {
        console.error("[useMetaAdsAnalysis] Erro ao buscar cliente:", clientError);
        throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
      }
      
      if (!clientData) {
        console.error("[useMetaAdsAnalysis] Cliente não encontrado:", clientId);
        throw new Error("Cliente não encontrado");
      }
      
      if (!clientData.meta_account_id) {
        console.error("[useMetaAdsAnalysis] Cliente sem ID Meta Ads:", clientData);
        throw new Error("Cliente não possui ID do Meta Ads configurado");
      }
      
      setClient(clientData as Client);
      console.log("[useMetaAdsAnalysis] Cliente encontrado:", clientData);
      
      // 2. Verificar se há token configurado
      const { data: tokenData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .single();
      
      if (tokenError) {
        console.error("[useMetaAdsAnalysis] Erro ao buscar token do Meta Ads:", tokenError);
        throw new Error(`Erro ao buscar token do Meta Ads: ${tokenError.message}`);
      }
      
      if (!tokenData?.value) {
        console.error("[useMetaAdsAnalysis] Token Meta Ads não encontrado");
        throw new Error("Token do Meta Ads não configurado");
      }
      
      console.log("[useMetaAdsAnalysis] Token Meta Ads encontrado");
      
      // 3. Preparar datas para o período atual
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Primeiro dia do mês atual
      const startDate = new Date(currentYear, currentMonth, 1);
      // Último dia do mês atual
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      const formattedToday = today.toISOString().split('T')[0];
      
      console.log("[useMetaAdsAnalysis] Período de análise:", formattedStartDate, "a", formattedEndDate);
      
      // 4. Chamar a função Edge com melhorias no tratamento do payload
      try {
        console.log("[useMetaAdsAnalysis] Tentando invocar função Edge...");
        
        // Payload com dados completos
        const payload = {
          method: "getMetaAdsData",
          clientId,
          reviewDate: formattedToday,
          accessToken: tokenData.value,
          clientName: clientData.company_name,
          metaAccountId: clientData.meta_account_id,
          dateRange: {
            start: formattedStartDate,
            end: formattedEndDate
          },
          debug: true // Solicitar informações extras de debug
        };
        
        // Substituir o token para o log para evitar expor dados sensíveis
        const payloadForLog = {
          ...payload,
          accessToken: "***TOKEN OCULTADO***"
        };
        
        console.log("[useMetaAdsAnalysis] Enviando payload para Edge Function:", JSON.stringify(payloadForLog));
        
        // IMPORTANTE: Garantir que o payload seja um objeto válido para serialização
        if (!payload || typeof payload !== 'object') {
          throw new Error("Payload inválido para a requisição da função Edge");
        }
        
        // Converter explicitamente para string com try/catch para capturar erros de serialização
        let payloadString;
        try {
          payloadString = JSON.stringify(payload);
          
          // Verificação adicional após a serialização
          if (!payloadString || payloadString === '{}' || payloadString === 'null') {
            throw new Error("Serialização do payload resultou em dados vazios");
          }
          
          console.log("[useMetaAdsAnalysis] Tamanho do payload serializado:", payloadString.length, "bytes");
        } catch (serializationError) {
          console.error("[useMetaAdsAnalysis] Erro ao serializar payload:", serializationError);
          throw new Error(`Erro ao preparar dados para envio: ${serializationError.message}`);
        }
        
        // Adicionar timeout para evitar problemas de conexão pendente
        const functionPromise = supabase.functions.invoke(
          "daily-budget-reviews", 
          { 
            body: payloadString,  // Usar string já serializada
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        
        // Timeout de 15 segundos (mais curto para falhar mais rápido)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout ao esperar resposta da função Edge (15s)")), 15000);
        });
        
        // Corrida entre a função e o timeout
        const { data: result, error: functionError } = await Promise.race([
          functionPromise,
          timeoutPromise
        ]) as any;
        
        // Log do resultado completo para debug
        console.log("[useMetaAdsAnalysis] Resposta da função Edge:", result);
        
        if (functionError) {
          console.error("[useMetaAdsAnalysis] Erro na função Edge:", functionError);
          throw new Error(`Erro na função Edge: ${functionError.message || "Erro desconhecido"}`);
        }
        
        if (!result) {
          console.error("[useMetaAdsAnalysis] Resultado vazio da função Edge");
          throw new Error("A função retornou dados vazios ou inválidos");
        }
        
        // Processar resultado da função Edge
        handleSuccessfulResponse(result, tokenData.value);
      } catch (edgeError) {
        console.error("[useMetaAdsAnalysis] Erro ao chamar função Edge:", edgeError);
        
        // Verificar se devemos tentar método alternativo
        if (edgeError.message?.includes("Timeout") || 
            edgeError.message?.includes("Failed to send") ||
            edgeError.message?.includes("Network")) {
          
          // Temos um erro de conectividade, vamos tentar uma abordagem alternativa
          // Informar o usuário sobre o problema e recomendar verificar a função Edge
          setError(`Erro de conectividade com a função Edge: ${edgeError.message}. Verifique se a função Edge está publicada e acessível.`);
          
          // Adicionar informações de diagnóstico
          setDebugInfo({
            edgeError: edgeError.message,
            suggestion: "Verifique se a função Edge 'daily-budget-reviews' está publicada e acessível no Supabase.",
            alternativeSolution: "Use o botão 'Testar Função Edge' para diagnosticar o problema."
          });
          
          // Mostrar toast com informação sobre o erro
          toast({
            title: "Erro na função Edge",
            description: "Não foi possível conectar com a função Edge. Use as ferramentas de diagnóstico para identificar o problema.",
            variant: "destructive",
          });
        } else if (edgeError.message?.includes("Corpo da requisição vazio")) {
          // Erro específico de corpo vazio
          setError(`Erro no formato da requisição: ${edgeError.message}. O corpo da requisição não está sendo recebido pela função Edge.`);
          
          setDebugInfo({
            edgeError: edgeError.message,
            requestType: "JSON stringified payload",
            payloadSize: payloadString ? payloadString.length : 'N/A',
            payloadSample: payloadString ? payloadString.substring(0, 100) + '...' : 'N/A',
            suggestion: "Verifique se o payload está sendo corretamente serializado e enviado com content-type: application/json"
          });
          
          toast({
            title: "Erro no formato da requisição",
            description: "O corpo da requisição está vazio. Verifique a ferramenta de diagnóstico para mais detalhes.",
            variant: "destructive",
          });
        } else {
          // Outro tipo de erro, repassar
          throw edgeError;
        }
      }
      
    } catch (err) {
      console.error("[useMetaAdsAnalysis] Erro na análise:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      
      // Tentativa de extrair mais informações do erro para depuração
      let errorDetails: any = {};
      if (err instanceof Error) {
        errorDetails = {
          name: err.name,
          message: err.message,
          details: err.stack
        };
      } else if (typeof err === 'object' && err !== null) {
        try {
          errorDetails = {
            ...err,
            stringified: JSON.stringify(err)
          };
        } catch (e) {
          errorDetails = { raw: String(err) };
        }
      } else {
        errorDetails = {
          raw: String(err)
        };
      }
      
      // Incluir detalhes do erro na resposta bruta
      setRawApiResponse(prev => ({
        ...prev,
        error: errorDetails
      }));
      
      setDebugInfo(prev => ({
        ...prev,
        error: errorDetails
      }));
      
      toast({
        title: "Erro na análise",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para processar resposta bem-sucedida
  const handleSuccessfulResponse = (result: any, token: string) => {
    // Guardar a resposta bruta para depuração com informações extra
    setRawApiResponse({
      ...result,
      token: token.substring(0, 12) + "..." // Mostrar apenas parte do token para diagnóstico
    });
    
    console.log("[useMetaAdsAnalysis] Resposta completa da API Meta Ads:", result);
    
    // Se tiver erro, mostrar detalhes específicos
    if (result.error) {
      console.error("[useMetaAdsAnalysis] Erro reportado na resposta:", result.error);
      
      // Tentar extrair mais informações do erro
      const errorDetails = typeof result.error === 'object' ? 
        JSON.stringify(result.error) : 
        String(result.error);
      
      throw new Error(`Erro na API do Meta Ads: ${errorDetails}`);
    }
    
    // Verificação rigorosa dos dados recebidos
    if (!result.meta) {
      console.error("[useMetaAdsAnalysis] Dados recebidos inválidos ou incompletos (sem meta):", result);
      throw new Error("Os dados recebidos da API do Meta Ads estão incompletos ou em formato inválido");
    }
    
    // Garantir que meta.campaigns existe, mesmo que vazio
    if (!result.meta.campaigns) {
      result.meta.campaigns = [];
      console.warn("[useMetaAdsAnalysis] Nenhuma campanha encontrada, inicializando array vazio");
    }
    
    // Configurar valores padrão para evitar erros
    if (typeof result.meta.totalSpent === 'undefined') {
      result.meta.totalSpent = 0;
      console.warn("[useMetaAdsAnalysis] totalSpent não encontrado, definindo como 0");
    }
    
    if (typeof result.meta.dailyBudget === 'undefined') {
      result.meta.dailyBudget = 0;
      console.warn("[useMetaAdsAnalysis] dailyBudget não encontrado, definindo como 0");
    }
    
    // Logs detalhados para verificação dos valores
    console.log("[useMetaAdsAnalysis] Meta dados recebidos:");
    console.log("- Total gasto:", result.meta.totalSpent);
    console.log("- Orçamento diário:", result.meta.dailyBudget);
    console.log("- Período:", result.meta.dateRange);
    console.log("- Número de campanhas:", result.meta.campaigns.length);
    
    // Verificar cada campanha individualmente
    if (result.meta.campaigns && result.meta.campaigns.length > 0) {
      console.log("[useMetaAdsAnalysis] Detalhes das campanhas:");
      result.meta.campaigns.forEach((campaign: any, index: number) => {
        console.log(`Campanha ${index + 1}: ${campaign.name}`);
        console.log(`- ID: ${campaign.id}`);
        console.log(`- Status: ${campaign.status}`);
        console.log(`- Gasto: ${campaign.spend}`);
      });
      
      // Validação do total das campanhas vs total reportado
      const totalFromCampaigns = result.meta.campaigns.reduce(
        (total: number, campaign: any) => total + parseFloat(String(campaign.spend || "0")), 
        0
      );
      
      console.log(`[useMetaAdsAnalysis] Total calculado manualmente das campanhas: ${totalFromCampaigns}`);
      console.log(`[useMetaAdsAnalysis] Total reportado pela API: ${result.meta.totalSpent}`);
      
      if (Math.abs(totalFromCampaigns - result.meta.totalSpent) > 0.01) {
        console.warn("[useMetaAdsAnalysis] AVISO: Discrepância entre o total reportado e a soma das campanhas!");
      }
    }
    
    // Garantir que todos os valores numéricos sejam números
    if (result.meta) {
      if (typeof result.meta.totalSpent !== 'number') {
        const converted = parseFloat(String(result.meta.totalSpent || "0"));
        result.meta.totalSpent = isNaN(converted) ? 0 : converted;
        console.log("[useMetaAdsAnalysis] Convertido totalSpent para número:", result.meta.totalSpent);
      }
      
      if (typeof result.meta.dailyBudget !== 'number') {
        const converted = parseFloat(String(result.meta.dailyBudget || "0"));
        result.meta.dailyBudget = isNaN(converted) ? 0 : converted;
        console.log("[useMetaAdsAnalysis] Convertido dailyBudget para número:", result.meta.dailyBudget);
      }
      
      if (result.meta.campaigns) {
        result.meta.campaigns = result.meta.campaigns.map((campaign: any) => {
          const spendValue = typeof campaign.spend === 'number' 
            ? campaign.spend 
            : parseFloat(String(campaign.spend || "0"));
          
          return {
            ...campaign,
            spend: isNaN(spendValue) ? 0 : spendValue
          };
        });
      }
    }
    
    setAnalysis(result as SimpleAnalysisResult);
    
    toast({
      title: "Análise concluída",
      description: "Dados do Meta Ads obtidos com sucesso!",
    });
  };

  const testMetaToken = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Buscar token
      const { data: tokenData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .single();
      
      if (tokenError || !tokenData?.value) {
        throw new Error("Token do Meta Ads não configurado ou erro ao buscar");
      }

      // Teste básico de validação do token
      const testUrl = `https://graph.facebook.com/v20.0/me?access_token=${tokenData.value}&fields=id,name`;
      
      const response = await fetch(testUrl);
      const result = await response.json();
      
      setDebugInfo({
        tokenTest: {
          url: testUrl.replace(tokenData.value, "***TOKEN***"),
          status: response.status,
          statusText: response.statusText,
          result
        }
      });
      
      if (result.error) {
        throw new Error(`Erro no teste do token: ${result.error.message || JSON.stringify(result.error)}`);
      }
      
      toast({
        title: "Token válido",
        description: `Token do Meta Ads válido. Usuário: ${result.name || result.id}`,
      });
      
      return true;
    } catch (err) {
      console.error("[testMetaToken] Erro ao testar token:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      setError("Erro ao testar token: " + errorMessage);
      
      toast({
        title: "Erro no token",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testEdgeFunction = async () => {
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      // Verificar se a função Edge está disponível
      console.log("[testEdgeFunction] Tentando conectar à função Edge...");
      
      // Teste simples com payload mínimo
      const testPayload = { method: "ping" };
      
      // Serializar o payload para JSON
      const testPayloadString = JSON.stringify(testPayload);
      
      // Verificar se o payload foi corretamente serializado
      if (!testPayloadString || testPayloadString === '{}' || testPayloadString === 'null') {
        throw new Error("Erro ao serializar payload de teste");
      }
      
      console.log("[testEdgeFunction] Enviando payload de teste:", testPayloadString);
      
      const { data, error } = await supabase.functions.invoke(
        "daily-budget-reviews",
        { 
          body: testPayloadString,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      
      console.log("[testEdgeFunction] Resposta do teste:", data, error);
      
      setDebugInfo({
        edgeFunctionTest: {
          success: !error,
          data,
          error,
          timestamp: new Date().toISOString(),
          payloadSent: testPayload,
          payloadSize: testPayloadString.length
        }
      });
      
      if (error) {
        const errorMsg = error.message || "Erro ao conectar à função Edge";
        console.error("[testEdgeFunction] Falha no teste:", errorMsg);
        
        toast({
          title: "Erro na função Edge",
          description: `Não foi possível conectar à função Edge: ${errorMsg}`,
          variant: "destructive",
        });
        
        // Tentar classificar o tipo de erro
        let errorType = "UNKNOWN";
        let suggestion = "";
        
        if (errorMsg.includes("Failed to send") || errorMsg.includes("fetch")) {
          errorType = "NETWORK_ERROR";
          suggestion = "Verifique se a função Edge está publicada e se o Supabase está online.";
        } else if (errorMsg.includes("timeout") || errorMsg.includes("Timeout")) {
          errorType = "TIMEOUT_ERROR";
          suggestion = "A função Edge demorou muito para responder. Pode ser um problema de conexão ou sobrecarga.";
        } else if (errorMsg.includes("CORS") || errorMsg.includes("cross-origin")) {
          errorType = "CORS_ERROR";
          suggestion = "Problema de CORS. Verifique se a função Edge tem as configurações corretas de CORS.";
        } else if (errorMsg.includes("Corpo da requisição vazio")) {
          errorType = "EMPTY_BODY_ERROR";
          suggestion = "O corpo da requisição está vazio. Verifique a serialização do payload e o content-type.";
        }
        
        setDebugInfo(prev => ({
          ...prev,
          errorType,
          suggestion,
          possibleFixes: [
            "Verificar se a função 'daily-budget-reviews' está publicada no Supabase",
            "Verificar se há regras de CORS configuradas na função",
            "Tentar republicar a função Edge",
            "Verificar se o payload está sendo serializado corretamente"
          ]
        }));
        
        return false;
      }
      
      console.log("[testEdgeFunction] Teste bem-sucedido:", data);
      
      toast({
        title: "Função Edge disponível",
        description: "Conexão com a função Edge estabelecida com sucesso.",
      });
      
      return true;
    } catch (err) {
      console.error("[testEdgeFunction] Erro:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      setDebugInfo({
        edgeFunctionTest: {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      });
      
      toast({
        title: "Erro na função Edge",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    client,
    analysis,
    isLoading,
    error,
    fetchAnalysis,
    rawApiResponse,
    debugInfo,
    testMetaToken,
    testEdgeFunction
  };
};
