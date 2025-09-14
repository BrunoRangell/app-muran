import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SetManualBalanceData {
  clientId: string;
  accountId: string;
  balance: number;
}

export function useManualBalance() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<{clientId: string, accountId: string} | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const setManualBalanceMutation = useMutation({
    mutationFn: async ({ clientId, accountId, balance }: SetManualBalanceData) => {
      console.log(`💰 Definindo saldo manual para conta ${accountId}:`, balance);
      
      // Converter para timezone de Brasília (UTC-3)
      const now = new Date();
      const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
      
      const { data, error } = await supabase
        .from("client_accounts")
        .update({
          saldo_restante: balance,
          balance_set_at: brasiliaTime.toISOString()
        })
        .eq("client_id", clientId)
        .eq("account_id", accountId)
        .eq("platform", "meta")
        .select();

      if (error) {
        console.error("❌ Erro ao salvar saldo manual:", error);
        throw error;
      }

      console.log("✅ Saldo manual salvo com sucesso:", data);
      return data;
    },
    onSuccess: () => {
      // Invalidar múltiplos caches para atualização imediata e completa
      queryClient.invalidateQueries({ queryKey: ["improved-meta-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["unified-meta-balance-consolidated"] });
      queryClient.invalidateQueries({ queryKey: ["unified-reviews-data"] });
      queryClient.invalidateQueries({ queryKey: ["meta-balance"] });
      queryClient.invalidateQueries({ queryKey: ["client-accounts"] });
      
      // Forçar refresh dos componentes relacionados a saldos
      queryClient.refetchQueries({ queryKey: ["improved-meta-reviews"] });
      queryClient.refetchQueries({ queryKey: ["unified-reviews-data"] });
      
      toast({
        title: "Saldo definido",
        description: "O saldo manual foi salvo com sucesso. O sistema irá recalcular automaticamente com base nos gastos futuros.",
      });

      // Fechar modal
      setIsModalOpen(false);
      setCurrentAccount(null);
    },
    onError: (error: any) => {
      console.error("❌ Erro na mutação de saldo manual:", error);
      toast({
        title: "Erro ao definir saldo",
        description: error.message || "Ocorreu um erro ao salvar o saldo manual",
        variant: "destructive"
      });
    }
  });

  const openModal = (clientId: string, accountId: string) => {
    setCurrentAccount({ clientId, accountId });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentAccount(null);
  };

  const setBalance = (balance: number) => {
    if (!currentAccount) return;
    
    setManualBalanceMutation.mutate({
      clientId: currentAccount.clientId,
      accountId: currentAccount.accountId,
      balance
    });
  };

  return {
    isModalOpen,
    isLoading: setManualBalanceMutation.isPending,
    openModal,
    closeModal,
    setBalance,
    currentAccount
  };
}