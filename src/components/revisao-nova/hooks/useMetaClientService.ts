
import { useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Hook para serviços relacionados ao cliente e conta Meta Ads
 */
export const useMetaClientService = () => {
  const [client, setClient] = useState<{
    id: string;
    company_name: string;
    meta_account_id: string;
  } | null>(null);

  /**
   * Busca os dados do cliente, incluindo ID de conta Meta Ads
   */
  const fetchClientData = async (clientId: string) => {
    try {
      console.log("[useMetaClientService] Buscando dados do cliente:", clientId);
      
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id")
        .eq("id", clientId)
        .single();
      
      if (clientError) {
        console.error("[useMetaClientService] Erro ao buscar cliente:", clientError);
        throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
      }
      
      if (!clientData) {
        console.error("[useMetaClientService] Cliente não encontrado:", clientId);
        throw new Error("Cliente não encontrado");
      }
      
      if (!clientData.meta_account_id) {
        console.error("[useMetaClientService] Cliente sem ID Meta Ads:", clientData);
        throw new Error("Cliente não possui ID do Meta Ads configurado");
      }
      
      setClient(clientData);
      console.log("[useMetaClientService] Cliente encontrado:", clientData);
      
      return clientData;
    } catch (error) {
      setClient(null);
      throw error;
    }
  };

  /**
   * Prepara as datas para período atual da análise
   */
  const prepareDateRangeForCurrentMonth = () => {
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
    
    console.log("[useMetaClientService] Período de análise:", formattedStartDate, "a", formattedEndDate);
    
    return {
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      today: formattedToday
    };
  };

  return {
    client,
    fetchClientData,
    prepareDateRangeForCurrentMonth
  };
};
