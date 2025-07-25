
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/components/clients/types";
import { useToast } from "@/hooks/use-toast";

// Função separada para buscar clientes
const fetchClients = async (filters?: {
  status?: string;
  acquisition_channel?: string;
  payment_type?: string;
}) => {
  console.log("🔍 [fetchClients] Iniciando busca de clientes...");
  console.log("🔍 [fetchClients] Filtros recebidos:", filters);
  
  try {
    // Verificar se o supabase está disponível
    if (!supabase) {
      console.error("❌ [fetchClients] Supabase client não está disponível");
      throw new Error("Supabase client não está disponível");
    }

    console.log("🔄 [fetchClients] Construindo query...");
    
    let query = supabase
      .from("clients")
      .select("*");

    // Aplicar filtros apenas se existirem
    if (filters?.status) {
      console.log("🔧 [fetchClients] Aplicando filtro de status:", filters.status);
      query = query.eq('status', filters.status);
    }
    if (filters?.acquisition_channel) {
      console.log("🔧 [fetchClients] Aplicando filtro de canal:", filters.acquisition_channel);
      query = query.eq('acquisition_channel', filters.acquisition_channel);
    }
    if (filters?.payment_type) {
      console.log("🔧 [fetchClients] Aplicando filtro de pagamento:", filters.payment_type);
      query = query.eq('payment_type', filters.payment_type);
    }

    console.log("🚀 [fetchClients] Executando query no Supabase...");
    const { data, error } = await query.order("company_name");

    if (error) {
      console.error("❌ [fetchClients] Erro retornado pelo Supabase:", error);
      throw new Error(`Erro ao buscar clientes: ${error.message}`);
    }

    console.log("✅ [fetchClients] Query executada com sucesso!");
    console.log("✅ [fetchClients] Dados retornados:", data?.length || 0, "clientes");
    
    return data as Client[];
  } catch (error) {
    console.error("❌ [fetchClients] Erro na função fetchClients:", error);
    throw error;
  }
};

export const useClients = (filters?: {
  status?: string;
  acquisition_channel?: string;
  payment_type?: string;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log("🔍 [useClients] Hook iniciado com filtros:", filters);

  // Criar chave única e simplificada
  const queryKey = filters 
    ? ["clients", "filtered", JSON.stringify(filters)] 
    : ["clients", "all"];

  console.log("🔑 [useClients] Query key gerada:", queryKey);

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log("🚀 [useClients] QueryFn executada!");
      return fetchClients(filters);
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
    refetchOnMount: true,
    enabled: true, // Garantir que a query está habilitada
    onError: (error) => {
      console.error("❌ [useClients] Erro capturado no onError:", error);
    },
    onSuccess: (data) => {
      console.log("✅ [useClients] Dados carregados com sucesso:", data?.length || 0);
    },
  });

  // Log do estado atual
  console.log("📊 [useClients] Estado atual:", {
    isLoading,
    clientsCount: clients?.length || 0,
    hasError: !!error,
    errorMessage: error?.message,
    filters,
    queryKey
  });

  // Mutações existentes mantidas...
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
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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

  // Função para forçar refresh
  const forceRefresh = async () => {
    console.log("🔄 [useClients] Forçando refresh dos dados...");
    try {
      await refetch();
      console.log("✅ [useClients] Refresh concluído");
    } catch (error) {
      console.error("❌ [useClients] Erro no refresh:", error);
    }
  };

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    forceRefresh
  };
};
