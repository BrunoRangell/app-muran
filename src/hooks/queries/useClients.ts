
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/components/clients/types";
import { useToast } from "@/hooks/use-toast";

export const useClients = (filters?: {
  status?: string;
  acquisition_channel?: string;
  payment_type?: string;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ["clients", filters],
    queryFn: async () => {
      console.log("🔍 Buscando clientes com filtros:", filters);
      
      let query = supabase
        .from("clients")
        .select("*");

      // Aplicar filtros apenas se existirem
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.acquisition_channel) {
        query = query.eq('acquisition_channel', filters.acquisition_channel);
      }
      if (filters?.payment_type) {
        query = query.eq('payment_type', filters.payment_type);
      }

      const { data, error } = await query.order("company_name");

      if (error) {
        console.error("❌ Erro ao buscar clientes:", error);
        throw new Error(`Erro ao buscar clientes: ${error.message}`);
      }

      console.log("✅ Clientes encontrados:", data?.length || 0);
      return data as Client[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, "id">) => {
      const { data, error } = await supabase
        .from("clients")
        .insert(client)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Cliente criado",
        description: "Cliente cadastrado com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Erro ao criar cliente:", error);
      toast({
        title: "Erro ao criar cliente",
        description: "Você não tem permissão para criar clientes ou ocorreu um erro.",
        variant: "destructive",
      });
    }
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...client }: Client) => {
      const { data, error } = await supabase
        .from("clients")
        .update(client)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Cliente atualizado",
        description: "Cliente atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Erro ao atualizar cliente:", error);
      toast({
        title: "Erro ao atualizar cliente",
        description: "Você não tem permissão para atualizar clientes ou ocorreu um erro.",
        variant: "destructive",
      });
    }
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Cliente excluído",
        description: "Cliente excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Erro ao excluir cliente:", error);
      toast({
        title: "Erro ao excluir cliente",
        description: "Você não tem permissão para excluir clientes ou ocorreu um erro.",
        variant: "destructive",
      });
    }
  });

  // Função adicional para buscar apenas clientes ativos
  const useActiveClients = () => {
    return useQuery({
      queryKey: ["clients-active"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq('status', 'active')
          .order("company_name");

        if (error) {
          console.error("❌ Erro ao buscar clientes ativos:", error);
          throw error;
        }

        return data as Client[];
      },
      staleTime: 5 * 60 * 1000,
      retry: 3,
    });
  };

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    useActiveClients
  };
};
