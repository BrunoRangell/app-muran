
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { getMetaToken } from "@/lib/metaAuth";

export function useClientDetails(clientId: string | undefined) {
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      setError("ID do cliente não fornecido");
      return;
    }
    
    const fetchClientDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const accessToken = await getMetaToken();
        if (!accessToken) {
          throw new Error("Token de acesso não encontrado");
        }
        
        // Aqui você faria a chamada para a API para obter os detalhes do cliente
        // Este é um exemplo simulado
        const response = await axios.get(`/api/clients/${clientId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        setClient(response.data);
      } catch (error) {
        console.error("Erro ao buscar detalhes do cliente:", error);
        setError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || "Erro ao buscar detalhes do cliente"
            : "Erro desconhecido ao buscar detalhes do cliente"
        );
        toast.error("Falha ao carregar dados do cliente");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientDetails();
  }, [clientId]);
  
  return {
    client,
    isLoading,
    error
  };
}
