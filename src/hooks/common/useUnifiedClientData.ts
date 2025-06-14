
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client } from "@/components/clients/types";

interface UseUnifiedClientDataProps {
  filters?: Record<string, any>;
  includeInactive?: boolean;
}

export function useUnifiedClientData({ 
  filters = {}, 
  includeInactive = false 
}: UseUnifiedClientDataProps = {}) {
  return useQuery({
    queryKey: ["unified-clients", filters, includeInactive],
    queryFn: async () => {
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
          query = query.eq(key, value);
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
  });
}
