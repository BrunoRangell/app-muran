
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

  // Chave única para evitar conflitos
  const queryKey = ["clients-list", filters];

  const { data: clients, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log("🔍 [useClients] Iniciando busca de clientes com filtros:", filters);
      
      try {
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
          console.error("❌ [useClients] Erro ao buscar clientes:", error);
          throw new Error(`Erro ao buscar clientes: ${error.message}`);
        }

        console.log("✅ [useClients] Clientes encontrados:", data?.length || 0);
        return data as Client[];
      } catch (error) {
        console.error("❌ [useClients] Erro na função queryFn:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 3,
    retryDelay: attemptIndex => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
      console.log(`🔄 [useClients] Tentativa ${attemptIndex + 1}, aguardando ${delay}ms`);
      return delay;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, "id">) => {
      console.log("➕ [useClients] Criando cliente:", client.company_name);
      
      const { data, error } = await supabase
        .from("clients")
        .insert(client)
        .select()
        .single();

      if (error) {
        console.error("❌ [useClients] Erro ao criar cliente:", error);
        throw error;
      }
      
      console.log("✅ [useClients] Cliente criado com sucesso:", data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      toast({
        title: "Cliente criado",
        description: "Cliente cadastrado com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("❌ [useClients] Erro ao criar cliente:", error);
      toast({
        title: "Erro ao criar cliente",
        description: "Você não tem permissão para criar clientes ou ocorreu um erro.",
        variant: "destructive",
      });
    }
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...client }: Client) => {
      console.log("✏️ [useClients] Atualizando cliente:", id);
      
      const { data, error } = await supabase
        .from("clients")
        .update(client)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ [useClients] Erro ao atualizar cliente:", error);
        throw error;
      }
      
      console.log("✅ [useClients] Cliente atualizado com sucesso:", data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      toast({
        title: "Cliente atualizado",
        description: "Cliente atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("❌ [useClients] Erro ao atualizar cliente:", error);
      toast({
        title: "Erro ao atualizar cliente",
        description: "Você não tem permissão para atualizar clientes ou ocorreu um erro.",
        variant: "destructive",
      });
    }
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      console.log("🗑️ [useClients] Excluindo cliente:", id);
      
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ [useClients] Erro ao excluir cliente:", error);
        throw error;
      }
      
      console.log("✅ [useClients] Cliente excluído com sucesso:", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      toast({
        title: "Cliente excluído",
        description: "Cliente excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error("❌ [useClients] Erro ao excluir cliente:", error);
      toast({
        title: "Erro ao excluir cliente",
        description: "Você não tem permissão para excluir clientes ou ocorreu um erro.",
        variant: "destructive",
      });
    }
  });

  // Função auxiliar para buscar apenas clientes ativos
  const useActiveClients = () => {
    return useQuery({
      queryKey: ["clients-active"],
      queryFn: async () => {
        console.log("🔍 [useActiveClients] Buscando clientes ativos");
        
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq('status', 'active')
          .order("company_name");

        if (error) {
          console.error("❌ [useActiveClients] Erro ao buscar clientes ativos:", error);
          throw error;
        }

        console.log("✅ [useActiveClients] Clientes ativos encontrados:", data?.length || 0);
        return data as Client[];
      },
      staleTime: 5 * 60 * 1000,
      retry: 3,
    });
  };

  console.log("🔍 [useClients] Estado atual do hook:", {
    isLoading,
    clientsCount: clients?.length || 0,
    hasError: !!error,
    filters
  });

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
