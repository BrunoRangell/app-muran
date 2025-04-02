import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useClientDetail } from "../hooks/useClientDetail";
import { useClientAnalysis } from "../hooks/useClientAnalysis";
import { ClientReviewHistory } from "./ClientReviewHistory";
import { ClientLatestReview } from "./ClientLatestReview";
import { ClientBudgetSettings } from "./ClientBudgetSettings";
import { ClientMetaAccountSettings } from "./ClientMetaAccountSettings";
import { Loader, RefreshCw } from "lucide-react";

export const ClientReviewDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [activeTab, setActiveTab] = useState("latest");
  const { toast } = useToast();
  
  const { 
    client, 
    isLoading: isClientLoading, 
    error: clientError,
    refetch: refetchClient
  } = useClientDetail(clientId);
  
  const { analyzeMutation, isAnalyzing } = useClientAnalysis();
  
  useEffect(() => {
    if (clientError) {
      toast({
        title: "Erro ao carregar cliente",
        description: clientError instanceof Error ? clientError.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  }, [clientError, toast]);
  
  const handleAnalyzeClient = () => {
    if (!clientId) return;
    
    analyzeMutation.mutate(clientId, {
      onSuccess: () => {
        toast({
          title: "Análise concluída",
          description: "A análise do cliente foi concluída com sucesso.",
        });
        refetchClient();
      },
      onError: (error) => {
        toast({
          title: "Erro na análise",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      }
    });
  };
  
  if (isClientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6e00]"></div>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl font-semibold text-gray-700">Cliente não encontrado</h2>
        <p className="text-gray-500 mt-2">O cliente solicitado não existe ou foi removido.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold text-[#321e32]">
            {client.company_name}
          </CardTitle>
          <Button
            onClick={handleAnalyzeClient}
            disabled={isAnalyzing}
            className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Analisar Agora
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="latest">Última Revisão</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="meta-account">Conta Meta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="latest">
              <ClientLatestReview clientId={clientId} />
            </TabsContent>
            
            <TabsContent value="history">
              <ClientReviewHistory clientId={clientId} />
            </TabsContent>
            
            <TabsContent value="settings">
              <ClientBudgetSettings 
                clientId={clientId} 
                clientName={client.company_name}
                currentBudget={client.meta_ads_budget}
              />
            </TabsContent>
            
            <TabsContent value="meta-account">
              <ClientMetaAccountSettings 
                clientId={clientId}
                clientName={client.company_name}
                metaAccountId={client.meta_account_id}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
