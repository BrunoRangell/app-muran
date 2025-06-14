
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client } from "@/components/clients/types";
import { useToast } from "@/hooks/use-toast";

interface UseUnifiedClientDataProps {
  filters?: Record<string, any>;
  includeInactive?: boolean;
}

export function useUnifiedClientData({ 
  filters = {}, 
  includeInactive = false 
}: UseUnifiedClientDataProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ["unified-clients", filters, includeInactive],
    queryFn: async () => {
      console.log("Buscando clientes com filtros:", filters);
      let query = supabase
        .from("clients")
        .select("*")
        .order("company_name");

      // Aplicar filtro de status
      if (!includeInactive) {
        query = query.eq("status", "active");
      }

      // Aplicar filtros dinâmicos
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw new Error("Não foi possível carregar a lista de clientes");
      }

      return data as Client[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
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
        queryClient.invalidateQueries({ queryKey: ["unified-clients"] });
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
        queryClient.invalidateQueries({ queryKey: ["unified-clients"] });
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
        queryClient.invalidateQueries({ queryKey: ["unified-clients"] });
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

  // Função auxiliar para buscar apenas clientes ativos
  const useActiveClients = () => {
    return useUnifiedClientData({ filters: { status: 'active' } });
  };

  return {
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    createClient,
    updateClient,
    deleteClient,
    useActiveClients,
    refetch: clientsQuery.refetch
  };
}
