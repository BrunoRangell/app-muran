
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Review {
  id: string;
  client_id: string;
  total_spent: number;
  daily_budget: number;
  date: string;
  budget_difference: number;
  needs_adjustment: boolean;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  monthly_budget: number;
  reviews?: Review[];
  latest_review?: Review;
}

export function useClientReviews(platform: 'meta' | 'google' = 'meta') {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active');

      if (clientsError) throw clientsError;

      // Buscar revisões
      const { data: reviewsData, error: reviewsError } = await supabase
        .from(`${platform}_reviews`)
        .select('*')
        .order('date', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Processar dados
      const processedClients = clientsData.map((client) => {
        const clientReviews = reviewsData
          .filter((review) => review.client_id === client.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const latestReview = clientReviews[0] || null;

        return {
          id: client.id,
          name: client.name,
          monthly_budget: client.monthly_budget,
          reviews: clientReviews,
          latest_review: latestReview,
        };
      });

      setClients(processedClients);
    } catch (err) {
      console.error("Erro ao buscar clientes e revisões:", err);
      setError("Falha ao carregar dados. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshClient = async (clientId: string) => {
    try {
      const { data: reviewData, error: reviewError } = await supabase
        .from(`${platform}_reviews`)
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (reviewError) throw reviewError;

      setClients((prev) =>
        prev.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              latest_review: reviewData,
            };
          }
          return client;
        })
      );
    } catch (err) {
      console.error(`Erro ao atualizar cliente ${clientId}:`, err);
    }
  };

  const batchProcess = async (clientIds: string[]) => {
    // Função que processaria vários clientes em lote
    // Implementação simplificada
    for (const id of clientIds) {
      await refreshClient(id);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [platform]);

  return {
    clients,
    isLoading,
    error,
    refreshClient,
    batchProcess,
    reloadAll: fetchClients,
  };
}
