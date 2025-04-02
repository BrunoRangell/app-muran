
import { useCallback, useState } from "react";
import { useGoogleAdsBatchReview } from "../hooks/useGoogleAdsBatchReview";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { GoogleAdsClientsGrid } from "./components/GoogleAdsClientsGrid";
import { EmptyStateView } from "./components/EmptyStateView";
import { LoadingView } from "./components/LoadingView";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { splitClientsByGoogleAdsId } from "./utils/clientSorting";
import { supabase } from "@/lib/supabase";

interface GoogleAdsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
  searchQuery: string;
  viewMode: string;
  showOnlyAdjustments: boolean;
}

export const GoogleAdsDashboardCard = ({ 
  onViewClientDetails,
  searchQuery,
  viewMode,
  showOnlyAdjustments
}: GoogleAdsDashboardCardProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isTokenVerifying, setIsTokenVerifying] = useState(false);
  
  const { 
    clients, 
    isLoading, 
    processingClients, 
    reviewClient
  } = useGoogleAdsBatchReview();
  
  // Filtrar clientes por nome e necessidade de ajuste
  const filteredByName = clients ? filterClientsByName(clients, searchQuery) : [];
  const filteredByAdjustment = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);
  
  // Ordenar clientes por nome
  const sortedClients = filteredByAdjustment.sort((a, b) => 
    a.company_name.localeCompare(b.company_name)
  );
  
  // Separar clientes com e sem ID do Google Ads
  const { clientsWithGoogleAdsId, clientsWithoutGoogleAdsId } = splitClientsByGoogleAdsId(sortedClients);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão Google Ads para cliente:", clientId);
    reviewClient(clientId);
  }, [reviewClient]);

  const handleVerifyTokens = useCallback(async () => {
    console.log("Iniciando verificação dos tokens do Google Ads...");
    setIsTokenVerifying(true);
    
    try {
      // Fazer chamada à edge function com flag para renovação manual
      const { data, error } = await supabase.functions.invoke('google-ads-token-check', {
        body: { 
          manual: true,
          forceRefresh: true,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log("Resposta da edge function google-ads-token-check:", { data, error });
      
      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }
      
      // Verificar se os tokens foram renovados
      if (data?.refreshed) {
        toast({
          title: "Tokens renovados com sucesso",
          description: `Tokens renovados automaticamente. Novos tokens válidos por ${Math.floor((data?.expires_in || 3600) / 60)} minutos.`,
        });
        
        // Recarregar dados após renovação
        queryClient.invalidateQueries({ queryKey: ["google-ads-clients-with-reviews"] });
      } else if (data?.success) {
        toast({
          title: "Tokens verificados com sucesso",
          description: data.message || "Os tokens do Google Ads estão válidos.",
        });
        
        // Recarregar dados
        queryClient.invalidateQueries({ queryKey: ["google-ads-clients-with-reviews"] });
      } else {
        toast({
          title: "Problemas com os tokens",
          description: data?.message || "Verifique os tokens do Google Ads nas configurações.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao verificar tokens:", error);
      toast({
        title: "Erro ao verificar tokens",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTokenVerifying(false);
    }
  }, [queryClient, toast]);

  if (isLoading) {
    return <LoadingView />;
  }
  
  if (sortedClients.length === 0) {
    return <EmptyStateView />;
  }

  return (
    <GoogleAdsClientsGrid 
      clientsWithGoogleAdsId={clientsWithGoogleAdsId}
      clientsWithoutGoogleAdsId={clientsWithoutGoogleAdsId}
      processingClients={processingClients}
      onReviewClient={handleReviewClient}
      viewMode={viewMode}
      onVerifyTokens={handleVerifyTokens}
      isTokenVerifying={isTokenVerifying}
    />
  );
};
