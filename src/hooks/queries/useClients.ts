import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/components/clients/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export const useClients = (filters?: {
  status?: string;
  acquisition_channel?: string;
  payment_type?: string;
}) => {
  console.log("[useClients] Iniciado com filtros:", filters);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ["clients", filters],
    queryFn: async () => {
      console.log("[useClients] Executando query com filtros:", filters);
      
      let query = supabase
        .from("clients")
        .select("*");

      // Aplicar filtros apenas se tiverem valor
      if (filters?.status && filters.status !== '') {
        console.log("[useClients] Aplicando filtro de status:", filters.status);
        query = query.eq('status', filters.status);
      }
      if (filters?.acquisition_channel && filters.acquisition_channel !== '') {
        console.log("[useClients] Aplicando filtro de canal:", filters.acquisition_channel);
        query = query.eq('acquisition_channel', filters.acquisition_channel);
      }
      if (filters?.payment_type && filters.payment_type !== '') {
        console.log("[useClients] Aplicando filtro de pagamento:", filters.payment_type);
        query = query.eq('payment_type', filters.payment_type);
      }

      const { data, error } = await query.order("company_name");

      if (error) {
        console.error("[useClients] Erro ao buscar clientes:", error);
        throw error;
      }

      console.log("[useClients] Dados carregados:", data?.length || 0, "clientes");
      return data as Client[];
    },
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Handle errors with useEffect
  useEffect(() => {
    if (error) {
      console.error("[useClients] Erro detectado:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes. Verifique sua conexão.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

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
      toast({
        title: "Erro ao excluir cliente",
        description: "Você não tem permissão para excluir clientes ou ocorreu um erro.",
        variant: "destructive",
      });
    }
  });

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient
  };
};
