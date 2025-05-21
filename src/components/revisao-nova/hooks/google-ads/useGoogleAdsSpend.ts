
import { useState } from "react";
import axios from "axios";
import { DateTime } from "luxon";
import { useGoogleAdsAuth } from "./useGoogleAdsAuth";

export interface GoogleAdsSpend {
  totalSpend: number;
  lastFiveDaysAvg: number;
}

export const useGoogleAdsSpend = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spendInfo, setSpendInfo] = useState<GoogleAdsSpend | null>(null);
  const { getAuthHeaders } = useGoogleAdsAuth();

  const fetchMonthlySpend = async (customerId: string): Promise<GoogleAdsSpend> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const today = DateTime.now().setZone('America/Sao_Paulo');
      const startDate = today.startOf('month').toISODate();
      const endDate = today.toISODate();
      const fiveDaysAgo = today.minus({ days: 5 }).toISODate();
      
      const query = `
        SELECT
            metrics.cost_micros,
            campaign.id,
            campaign.name,
            segments.date
        FROM
            campaign
        WHERE
            segments.date BETWEEN '${startDate}' AND '${endDate}'
      `;
      
      const headers = await getAuthHeaders(customerId);
      
      if (!headers) {
        throw new Error("Não foi possível obter headers de autenticação válidos");
      }
      
      try {
        const response = await axios.post(
          `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
          { query },
          { headers }
        );
        
        if (!response.data || !response.data.results) {
          const defaultResult = { totalSpend: 0, lastFiveDaysAvg: 0 };
          setSpendInfo(defaultResult);
          return defaultResult;
        }
        
        const campaigns = response.data.results;
        
        let totalSpend = campaigns.reduce((acc: number, campaign: any) => {
          const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
          return acc + cost;
        }, 0);
        
        let lastFiveDaysSpend = 0;
        let uniqueDates = new Set();
        
        campaigns.forEach((campaign: any) => {
          const date = campaign.segments?.date;
          if (date && DateTime.fromISO(date).setZone('America/Sao_Paulo') < today.startOf('day').setZone('America/Sao_Paulo') && 
            DateTime.fromISO(date).setZone('America/Sao_Paulo') >= DateTime.fromISO(fiveDaysAgo).setZone('America/Sao_Paulo')) {
            const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
            lastFiveDaysSpend += cost;
            uniqueDates.add(date);
          }
        });
        
        const countLastFiveDays = uniqueDates.size;
        const lastFiveDaysAvg = countLastFiveDays > 0 ? lastFiveDaysSpend / countLastFiveDays : 0;
        
        const result = {
          totalSpend,
          lastFiveDaysAvg
        };
        
        setSpendInfo(result);
        return result;
      } catch (apiError: any) {
        console.error("Erro na API Google Ads:", apiError.response?.data || apiError.message);
        throw new Error(`Erro ao acessar API do Google Ads: ${apiError.message}`);
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("Erro ao buscar gastos mensais:", errorMessage);
      return { totalSpend: 0, lastFiveDaysAvg: 0 };
    } finally {
      setIsLoading(false);
    }
    
    return { totalSpend: 0, lastFiveDaysAvg: 0 };
  };

  return {
    fetchMonthlySpend,
    spendInfo,
    isLoading,
    error
  };
};
