
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientReviewList } from "./components/ClientReviewList";
import { useToast } from "@/hooks/use-toast";

interface ReviewsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export function ReviewsDashboardCard({ onViewClientDetails }: ReviewsDashboardCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  // Consulta para buscar clientes com revisão Meta
  const { data: clientsData, isLoading, error, refetch } = useQuery({
    queryKey: ["clients-with-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients_with_reviews")
        .select("*")
        .order("client_name");
        
      if (error) throw error;
      return data || [];
    },
  });
  
  // Buscar informações sobre a última revisão em lote
  const { data: lastBatchInfo } = useQuery({
    queryKey: ["last-batch-review-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .single();
        
      if (error) return null;
      return data || null;
    },
  });
  
  // Função para analisar todos os clientes
  const handleAnalyzeAll = async () => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: {
          executeReview: true,
          scheduled: false,
          source: "ui_manual_trigger"
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Processo iniciado",
        description: "A análise de todos os clientes foi iniciada com sucesso.",
      });
      
      // Aguardar um pouco e então atualizar a lista
      setTimeout(() => {
        refetch();
      }, 3000);
      
    } catch (error) {
      console.error("Erro ao analisar todos os clientes:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao iniciar análise",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Função para formatar a data da última revisão
  const formatLastReviewTime = () => {
    if (!lastBatchInfo?.value) return "Nunca realizada";
    
    try {
      const date = new Date(lastBatchInfo.value);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Formato de data inválido";
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Relatórios de Revisão Meta Ads</CardTitle>
            <CardDescription>
              Visualize e gerencie relatórios de revisão diária para seus clientes
            </CardDescription>
          </div>
          
          <Button
            onClick={handleAnalyzeAll}
            disabled={isProcessing}
            className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
          >
            {isProcessing ? "Processando..." : "Analisar Todos"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 text-sm text-gray-500">
          <span>Última revisão em lote: {formatLastReviewTime()}</span>
        </div>
        
        <ClientReviewList 
          clients={clientsData || []} 
          isLoading={isLoading} 
          error={error}
          onViewDetails={onViewClientDetails}
          onRefresh={refetch}
        />
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-sm text-gray-500">
          {clientsData ? `${clientsData.length} clientes com Meta Ads` : "Carregando..."}
        </div>
      </CardFooter>
    </Card>
  );
}
