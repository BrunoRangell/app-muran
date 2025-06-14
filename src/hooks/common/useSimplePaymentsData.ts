
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";
import { logger } from "@/utils/logger";

export interface SimplePaymentFilters {
  clientId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const useSimplePaymentsData = (filters?: SimplePaymentFilters) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clientsWithPayments = [], isLoading, error } = useQuery({
    queryKey: ["simple-payments-clients", filters],
    queryFn: async () => {
      logger.info("PAYMENTS", "Iniciando busca de dados simplificada");

      try {
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select('*')
          .order('status', { ascending: false })
          .order('company_name');

        if (clientsError) {
          logger.error("PAYMENTS", "Erro ao buscar clientes", clientsError);
          throw clientsError;
        }

        logger.info("PAYMENTS", `Clientes encontrados: ${clientsData?.length || 0}`);

        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .order('reference_month', { ascending: false });

        if (paymentsError) {
          logger.error("PAYMENTS", "Erro ao buscar pagamentos", paymentsError);
          throw paymentsError;
        }

        logger.info("PAYMENTS", `Pagamentos encontrados: ${paymentsData?.length || 0}`);

        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        
        const processedClients = (clientsData || []).map(client => {
          const clientPayments = (paymentsData || []).filter(payment => 
            payment.client_id === client.id
          );
          
          const total_received = clientPayments.reduce((sum, payment) => {
            return sum + (Number(payment.amount) || 0);
          }, 0);
          
          const hasCurrentMonthPayment = clientPayments.some(payment => {
            if (!payment.reference_month) return false;
            
            try {
              const paymentDate = parseISO(payment.reference_month);
              return isWithinInterval(paymentDate, {
                start: currentMonthStart,
                end: currentMonthEnd
              });
            } catch (error) {
              logger.error("PAYMENTS", "Erro ao processar data", error);
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

        logger.info("PAYMENTS", `Processamento finalizado: ${processedClients.length} clientes`);
        return processedClients;
      } catch (error) {
        logger.error("PAYMENTS", "Erro durante o processamento", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados de clientes e pagamentos.",
          variant: "destructive",
        });
        throw error;
      }
    },
    staleTime: 1000 * 60,
    retry: 3,
    retryDelay: 1000,
  });

  const createPayment = useMutation({
    mutationFn: async (paymentData: any) => {
      logger.info("PAYMENTS", "Criando pagamento", paymentData);
      
      const { data, error } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        logger.error("PAYMENTS", "Erro ao criar pagamento", error);
        throw error;
      }
      
      logger.info("PAYMENTS", "Pagamento criado com sucesso");
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
      logger.error("PAYMENTS", "Erro na mutation", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento",
        variant: "destructive",
      });
    }
  });

  const updatePayment = useMutation({
    mutationFn: async (paymentData: any) => {
      logger.info("PAYMENTS", "Atualizando pagamento", paymentData);
      
      const { data, error } = await supabase
        .from("payments")
        .update(paymentData)
        .eq("id", paymentData.id)
        .select()
        .single();

      if (error) {
        logger.error("PAYMENTS", "Erro ao atualizar pagamento", error);
        throw error;
      }
      
      logger.info("PAYMENTS", "Pagamento atualizado com sucesso");
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

  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      logger.info("PAYMENTS", "Deletando pagamento", { paymentId });
      
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) {
        logger.error("PAYMENTS", "Erro ao deletar pagamento", error);
        throw error;
      }
      
      logger.info("PAYMENTS", "Pagamento deletado com sucesso");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simple-payments-clients"] });
      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso",
      });
    }
  });

  const refetchClients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["simple-payments-clients"] });
  }, [queryClient]);

  return {
    clientsWithPayments,
    isLoadingClients: isLoading,
    isLoading,
    error,
    createPayment,
    updatePayment,
    deletePayment,
    refetchClients,
  };
};
