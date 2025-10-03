import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/components/clients/types";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";

const PAGE_SIZE = 30;

interface ClientFilters {
  status?: string;
  acquisition_channel?: string;
  payment_type?: string;
  search?: string;
}

export const useClientsPaginated = (filters?: ClientFilters) => {
  const queryClient = useQueryClient();

  const clientsQuery = useInfiniteQuery({
    queryKey: ["clients-paginated", filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("clients")
        .select("*", { count: "exact" });

      // Aplicar filtros
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.acquisition_channel && filters.acquisition_channel !== "all") {
        query = query.eq("acquisition_channel", filters.acquisition_channel);
      }

      if (filters?.payment_type && filters.payment_type !== "all") {
        query = query.eq("payment_type", filters.payment_type);
      }

      if (filters?.search) {
        query = query.or(
          `company_name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`
        );
      }

      const { data, error, count } = await query
        .order("company_name")
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (error) {
        logger.error("Erro ao buscar clientes:", error);
        throw error;
      }

      return {
        clients: data as Client[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
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
      queryClient.invalidateQueries({ queryKey: ["clients-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      });
    },
    onError: (error: Error) => {
      logger.error("Erro ao criar cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o cliente",
        variant: "destructive",
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ["clients-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      logger.error("Erro ao atualizar cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive",
      });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      logger.error("Erro ao excluir cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente",
        variant: "destructive",
      });
    },
  });

  return {
    clients: clientsQuery.data?.pages.flatMap((page) => page.clients) || [],
    totalCount: clientsQuery.data?.pages[0]?.totalCount || 0,
    isLoading: clientsQuery.isLoading,
    isFetchingNextPage: clientsQuery.isFetchingNextPage,
    hasNextPage: clientsQuery.hasNextPage,
    fetchNextPage: clientsQuery.fetchNextPage,
    error: clientsQuery.error,
    createClient,
    updateClient,
    deleteClient,
  };
};
