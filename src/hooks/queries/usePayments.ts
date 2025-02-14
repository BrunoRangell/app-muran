
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Payment, PaymentFilters } from "@/types/payment";
import { toast } from "@/components/ui/use-toast";

export const usePayments = (filters?: PaymentFilters) => {
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ["payments", filters],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(`
          *,
          clients (
            company_name
          )
        `);

      if (filters?.startDate) {
        query = query.gte("reference_month", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("reference_month", filters.endDate);
      }

      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Payment[];
    },
  });

  const createPayment = useMutation({
    mutationFn: async (newPayment: Partial<Payment>) => {
      const { data, error } = await supabase
        .from("payments")
        .insert(newPayment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento",
        variant: "destructive",
      });
    },
  });

  const updatePayment = useMutation({
    mutationFn: async (updatedPayment: Partial<Payment>) => {
      const { data, error } = await supabase
        .from("payments")
        .update(updatedPayment)
        .eq("id", updatedPayment.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pagamento",
        variant: "destructive",
      });
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao excluir pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o pagamento",
        variant: "destructive",
      });
    },
  });

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    createPayment,
    updatePayment,
    deletePayment,
  };
};
