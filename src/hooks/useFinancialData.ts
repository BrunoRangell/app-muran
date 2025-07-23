
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateFinancialMetrics } from "@/utils/financialCalculations";

export const useFinancialData = () => {
  return useQuery({
    queryKey: ["unified-financial-data"],
    queryFn: async () => {
      console.log("🔄 Buscando dados financeiros unificados...");
      
      // Buscar todos os dados necessários em paralelo com queries otimizadas
      const [clientsResult, costsResult, paymentsResult] = await Promise.all([
        supabase
          .from("clients")
          .select("id, company_name, status, contract_value, first_payment_date, last_payment_date, acquisition_channel, payment_type"),
        
        supabase
          .from("costs")
          .select("id, amount, date, category_id"),
        
        supabase
          .from("payments")
          .select("id, client_id, amount, reference_month")
      ]);

      // Verificar erros
      if (clientsResult.error) {
        console.error("❌ Erro ao buscar clientes:", clientsResult.error);
        throw clientsResult.error;
      }

      if (costsResult.error) {
        console.error("❌ Erro ao buscar custos:", costsResult.error);
        throw costsResult.error;
      }

      if (paymentsResult.error) {
        console.error("❌ Erro ao buscar pagamentos:", paymentsResult.error);
        throw paymentsResult.error;
      }

      const clients = clientsResult.data || [];
      const costs = costsResult.data || [];
      const payments = paymentsResult.data || [];

      console.log("✅ Dados carregados:", { 
        clients: clients.length, 
        costs: costs.length, 
        payments: payments.length 
      });

      // Calcular métricas financeiras
      const metrics = calculateFinancialMetrics(clients, costs);

      return {
        clients,
        costs,
        payments,
        metrics
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
