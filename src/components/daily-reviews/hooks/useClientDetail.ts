
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// VERIFICAR: Este hook pode estar duplicado com useClientReviewDetails
export const useClientDetail = (clientId?: string) => {
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchClient = async () => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) {
        throw new Error(`Erro ao buscar dados do cliente: ${clientError.message}`);
      }

      setClient(data);
    } catch (err) {
      console.error('Erro ao carregar cliente:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      toast({
        title: 'Erro ao carregar cliente',
        description: err instanceof Error ? err.message : 'Ocorreu um erro ao carregar os dados do cliente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const refetch = () => {
    fetchClient();
  };

  return {
    client,
    isLoading,
    error,
    refetch
  };
};
