import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader, RefreshCw, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  client_id: string;
  client_name: string;
  meta_account_id?: string;
  last_review_date?: string;
  recommendation?: string;
  status?: string;
  budget_amount?: number;
  spent_amount?: number;
  review_status?: string;
}

interface ClientReviewListProps {
  clients: Client[];
  isLoading: boolean;
  error: any;
  onViewDetails: (clientId: string) => void;
  onRefresh: () => void;
}

export function ClientReviewList({ clients, isLoading, error, onViewDetails, onRefresh }: ClientReviewListProps) {
  const [refreshingClient, setRefreshingClient] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para revisar um cliente específico
  const handleReviewClient = async (clientId: string) => {
    try {
      setRefreshingClient(clientId);
      
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: {
          clientId,
          executeReview: true,
          scheduled: false,
          source: "ui_manual_single"
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Revisão iniciada",
        description: "A revisão do cliente foi iniciada com sucesso."
      });
      
      setTimeout(() => {
        onRefresh();
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao revisar cliente:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao iniciar revisão",
        variant: "destructive"
      });
    } finally {
      setRefreshingClient(null);
    }
  };

  // Renderização do estado de carregamento
  if (isLoading) {
    return (
      <div className="py-8 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <Loader className="h-8 w-8 animate-spin text-[#ff6e00]" />
          <p className="mt-4 text-gray-500">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  // Renderização do estado de erro
  if (error) {
    return (
      <div className="py-8">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <h3 className="text-lg font-semibold text-red-600">Erro ao carregar clientes</h3>
            <p className="mt-2 text-red-600">{error.message || "Ocorreu um erro desconhecido"}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Renderização do estado vazio
  if (!clients || clients.length === 0) {
    return (
      <div className="py-8">
        <Card className="p-6 border-gray-200 bg-gray-50">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
            <h3 className="text-lg font-semibold text-gray-500">Nenhum cliente encontrado</h3>
            <p className="mt-2 text-gray-500">Não há clientes com contas Meta Ads configuradas.</p>
          </div>
        </Card>
      </div>
    );
  }

  // Renderização da lista de clientes
  return (
    <div className="space-y-3">
      {clients.map((client) => (
        <Card 
          key={client.id || client.client_id} 
          className="p-4 border-gray-200 hover:border-[#ff6e00] transition-colors"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{client.client_name}</h3>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <span>
                  Meta ID: {client.meta_account_id || "Não configurado"}
                </span>
                {client.last_review_date && (
                  <span className="ml-3">
                    Última revisão: {new Date(client.last_review_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReviewClient(client.client_id)}
                disabled={refreshingClient === client.client_id}
              >
                {refreshingClient === client.client_id ? (
                  <>
                    <Loader className="h-3 w-3 mr-1 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Revisar
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewDetails(client.client_id)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {client.review_status && (
            <div className="mt-2 pt-2 border-t border-gray-100 text-sm">
              <div className="flex items-center">
                {client.review_status === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                )}
                <span className={client.review_status === "success" ? "text-green-600" : "text-amber-600"}>
                  {client.recommendation || "Sem recomendação disponível"}
                </span>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
