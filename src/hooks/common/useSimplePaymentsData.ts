
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

export interface SimplePaymentFilters {
  clientId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const useSimplePaymentsData = (filters?: SimplePaymentFilters) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para buscar clientes com pagamentos
  const { data: clientsWithPayments = [], isLoading, error } = useQuery({
    queryKey: ["simple-payments-clients", filters],
    queryFn: async () => {
      console.log("🔍 Iniciando busca de dados simplificada...");

      try {
        // Buscar todos os clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select('*')
          .order('status', { ascending: false })
          .order('company_name');

        if (clientsError) {
          console.error("❌ Erro ao buscar clientes:", clientsError);
          throw clientsError;
        }

        console.log("👥 Clientes encontrados:", clientsData?.length || 0);

        // Buscar todos os pagamentos
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .order('reference_month', { ascending: false });

        if (paymentsError) {
          console.error("❌ Erro ao buscar pagamentos:", paymentsError);
          throw paymentsError;
        }

        console.log("💰 Pagamentos encontrados:", paymentsData?.length || 0);

        // Processar dados
        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        
        const processedClients = (clientsData || []).map(client => {
          // Filtrar pagamentos deste cliente
          const clientPayments = (paymentsData || []).filter(payment => 
            payment.client_id === client.id
          );
          
          // Calcular total recebido
          const total_received = clientPayments.reduce((sum, payment) => {
            return sum + (Number(payment.amount) || 0);
          }, 0);
          
          // Verificar pagamento do mês atual
          const hasCurrentMonthPayment = clientPayments.some(payment => {
            if (!payment.reference_month) return false;
            
            try {
              const paymentDate = parseISO(payment.reference_month);
              return isWithinInterval(paymentDate, {
                start: currentMonthStart,
                end: currentMonthEnd
              });
            } catch (error) {
              console.error("Erro ao processar data:", error);
              return false;
            }
          });

          return {
            ...client,
            total_received,
            payments: clientPayments,
            hasCurrentMonthPayment
          };
        });

        console.log("✅ Processamento finalizado:", {
          total_clients: processedClients.length,
          exemplo_cliente: processedClients[0]
        });

        return processedClients;
      } catch (error) {
        console.error("❌ Erro durante o processamento:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados de clientes e pagamentos.",
          variant: "destructive",
        });
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minuto
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations para criar pagamento
  const createPayment = useMutation({
    mutationFn: async (paymentData: any) => {
      console.log("📝 Criando pagamento:", paymentData);
      
      const { data, error } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao criar pagamento:", error);
        throw error;
      }
      
      console.log("✅ Pagamento criado:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simple-payments-clients"] });
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso",
      });
    },
    onError: (error) => {
      console.error("❌ Erro na mutation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento",
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar pagamento
  const updatePayment = useMutation({
    mutationFn: async (paymentData: any) => {
      console.log("📝 Atualizando pagamento:", paymentData);
      
      const { data, error } = await supabase
        .from("payments")
        .update(paymentData)
        .eq("id", paymentData.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao atualizar pagamento:", error);
        throw error;
      }
      
      console.log("✅ Pagamento atualizado:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simple-payments-clients"] });
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso",
      });
    }
  });

  // Mutation para deletar pagamento
  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      console.log("🗑️ Deletando pagamento:", paymentId);
      
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) {
        console.error("❌ Erro ao deletar pagamento:", error);
        throw error;
      }
      
      console.log("✅ Pagamento deletado");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simple-payments-clients"] });
      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso",
      });
    }
  });

  // Callback para refetch
  const refetchClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["simple-payments-clients"] });
  }, [queryClient]);

  return {
    // Dados
    clientsWithPayments,
    
    // Estados de loading
    isLoadingClients: isLoading,
    isLoading,
    
    // Errors
    error,
    
    // Mutations
    createPayment,
    updatePayment,
    deletePayment,
    
    // Refetch functions
    refetchClients,
  };
};
