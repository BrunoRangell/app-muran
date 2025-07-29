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
      console.log("Buscando clientes com filtros:", filters);
      let query = supabase
        .from("clients")
        .select("*");

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
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      return data as Client[];
    },
    meta: {
      onError: (error: Error) => {
        console.error("Erro na query de clientes:", error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Você não tem permissão para visualizar os clientes ou ocorreu um erro de conexão.",
          variant: "destructive",
        });
      }
    }
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
    meta: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        toast({
          title: "Cliente criado",
          description: "Cliente cadastrado com sucesso!",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Erro ao criar cliente",
          description: "Você não tem permissão para criar clientes ou ocorreu um erro.",
          variant: "destructive",
        });
      }
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
    meta: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        toast({
          title: "Cliente atualizado",
          description: "Cliente atualizado com sucesso!",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Erro ao atualizar cliente",
          description: "Você não tem permissão para atualizar clientes ou ocorreu um erro.",
          variant: "destructive",
        });
      }
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
    meta: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        toast({
          title: "Cliente excluído",
          description: "Cliente excluído com sucesso!",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Erro ao excluir cliente",
          description: "Você não tem permissão para excluir clientes ou ocorreu um erro.",
          variant: "destructive",
        });
      }
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
          console.error("Erro ao buscar clientes ativos:", error);
          throw error;
        }

        return data as Client[];
      },
      meta: {
        onError: (error: Error) => {
          console.error("Erro na query de clientes ativos:", error);
          toast({
            title: "Erro ao carregar clientes",
            description: "Ocorreu um erro ao carregar a lista de clientes ativos.",
            variant: "destructive",
          });
        }
      }
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
