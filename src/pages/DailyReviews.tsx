
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Calendar, ListChecks, ArrowRight, TrendingUp, TrendingDown, Loader, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { DailyReviewsSummary } from "@/components/daily-reviews/DailyReviewsSummary";
import { ClientReviewDetails } from "@/components/daily-reviews/ClientReviewDetails";
import { BudgetSetupForm } from "@/components/daily-reviews/BudgetSetupForm";
import { TokensSetupForm } from "@/components/daily-reviews/TokensSetupForm";
import { ErrorState } from "@/components/clients/components/ErrorState";

type Client = {
  id: string;
  company_name: string;
  meta_ads_budget: number;
  meta_account_id: string | null;
};

const DailyReviews = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("clients-list");
  const { toast } = useToast();

  // Buscar clientes ativos
  const { data: clients, isLoading: isLoadingClients, refetch: refetchClients } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*")
        .eq("status", "active")
        .order("company_name");

      if (error) throw error;
      return clients as Client[];
    },
  });

  // Buscar revisões recentes
  const { data: reviews, isLoading: isLoadingReviews, refetch: refetchReviews } = useQuery({
    queryKey: ["recent-reviews"],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("daily_budget_reviews")
        .select(`
          *,
          clients(company_name)
        `)
        .order("review_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return reviews;
    },
  });

  // Mutation para analisar cliente específico
  const analyzeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      console.log("Iniciando análise para o cliente:", clientId);
      
      // Verificar se o cliente tem ID da conta e orçamento configurados
      const client = clients?.find(c => c.id === clientId);
      
      if (!client) {
        throw new Error("Cliente não encontrado");
      }
      
      if (!client.meta_account_id) {
        toast({
          title: "Configuração incompleta",
          description: "O cliente não possui um ID de conta Meta configurado. Por favor, configure-o primeiro.",
          variant: "destructive",
        });
        throw new Error("O cliente não possui um ID de conta Meta configurado");
      }
      
      if (!client.meta_ads_budget || client.meta_ads_budget <= 0) {
        toast({
          title: "Configuração incompleta",
          description: "O cliente não possui um orçamento Meta Ads configurado. Por favor, configure-o primeiro.",
          variant: "destructive",
        });
        throw new Error("O cliente não possui um orçamento Meta Ads configurado");
      }
      
      console.log("Chamando função Edge para análise do cliente:", client);
      
      try {
        // Verificar se estamos em ambiente de desenvolvimento para simular resposta
        if (import.meta.env.DEV) {
          console.log("Ambiente de desenvolvimento detectado - simulando resposta da função Edge");
          
          // Simular um atraso para dar feedback visual
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Criar uma revisão simulada no banco de dados
          const today = new Date().toISOString().split('T')[0];
          
          const { data: existingReview, error: checkError } = await supabase
            .from("daily_budget_reviews")
            .select("id")
            .eq("client_id", clientId)
            .eq("review_date", today)
            .maybeSingle();
            
          if (checkError) {
            console.error("Erro ao verificar revisão existente:", checkError);
          }
          
          // Se já existe uma revisão para hoje, atualizamos, senão inserimos uma nova
          let reviewId;
          
          if (existingReview) {
            console.log("Atualizando revisão existente para hoje");
            const { data, error } = await supabase
              .from("daily_budget_reviews")
              .update({
                meta_daily_budget_current: client.meta_ads_budget / 30, // Simplificação para o exemplo
                meta_daily_budget_recommended: client.meta_ads_budget / 30,
                meta_total_spent: client.meta_ads_budget * 0.7, // Simula 70% do orçamento gasto
                updated_at: new Date().toISOString()
              })
              .eq("id", existingReview.id)
              .select();
              
            if (error) throw error;
            reviewId = existingReview.id;
          } else {
            console.log("Criando nova revisão");
            const { data, error } = await supabase
              .from("daily_budget_reviews")
              .insert({
                client_id: clientId,
                review_date: today,
                meta_daily_budget_current: client.meta_ads_budget / 30,
                meta_daily_budget_recommended: client.meta_ads_budget / 30,
                meta_total_spent: client.meta_ads_budget * 0.7,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select();
              
            if (error) throw error;
            reviewId = data?.[0]?.id;
          }
          
          return {
            status: "success",
            message: "Análise simulada concluída com sucesso",
            client: client,
            reviewId: reviewId
          };
        }
        
        // Em produção, chama a função Edge real
        const response = await supabase.functions.invoke("daily-budget-reviews", {
          body: { method: "analyzeClient", clientId },
        });

        console.log("Resposta da função Edge:", response);
        
        if (response.error) {
          console.error("Erro retornado pela função Edge:", response.error);
          throw new Error(response.error.message || "Erro na análise");
        }
        
        return response.data;
      } catch (error: any) {
        console.error("Erro ao chamar função Edge:", error);
        toast({
          title: "Erro na análise",
          description: String(error?.message || error),
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Análise concluída com sucesso:", data);
      toast({
        title: "Análise concluída",
        description: `A análise para ${data.client?.company_name || 'o cliente'} foi atualizada com sucesso.`,
      });
      
      // Atualizar dados
      refetchClients();
      refetchReviews();
      
      setSelectedClient(data.client?.id);
      setActiveTab("client-details");
    },
    onError: (error: any) => {
      console.error("Erro detalhado na análise:", error);
      toast({
        title: "Erro na análise",
        description: String(error?.message || error),
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeClient = (clientId: string) => {
    console.log("Solicitando análise para cliente:", clientId);
    analyzeMutation.mutate(clientId);
  };

  const handleConfigureBudgetsClick = (clientId: string) => {
    console.log("Configurando orçamentos para cliente:", clientId);
    setSelectedClient(clientId);
    setActiveTab("setup");
  };

  useEffect(() => {
    // Se um cliente for selecionado mas a tab for "clients-list", mude para "client-details"
    if (selectedClient && activeTab === "clients-list") {
      setActiveTab("client-details");
    }
  }, [selectedClient, activeTab]);

  // Função para gerar recomendação dinâmica na listagem
  const getRecommendationIcon = (recommendationText: string | null) => {
    if (!recommendationText) return null;
    
    if (recommendationText.includes("Aumentar")) {
      return <TrendingUp className="text-green-500" size={16} />;
    } else if (recommendationText.includes("Diminuir")) {
      return <TrendingDown className="text-red-500" size={16} />;
    }
    return null;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark flex items-center gap-2">
            <Calendar className="h-8 w-8 text-muran-primary" />
            Revisões Diárias
          </h1>
          <p className="text-gray-600">
            Acompanhe e gerencie os orçamentos diários de campanhas
          </p>
        </div>

        <div className="flex gap-2">
          <TokensSetupForm />
          <Select
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione a visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clients-list">Lista de Clientes</SelectItem>
              {selectedClient && (
                <SelectItem value="client-details">Detalhes do Cliente</SelectItem>
              )}
              <SelectItem value="summary">Resumo</SelectItem>
              <SelectItem value="setup">Configuração</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="clients-list">Lista de Clientes</TabsTrigger>
          <TabsTrigger value="client-details" disabled={!selectedClient}>
            Detalhes do Cliente
          </TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="setup">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="clients-list" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingClients ? (
              Array(6)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className="h-[160px] animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    </CardContent>
                    <CardFooter>
                      <div className="h-9 bg-gray-200 rounded w-full"></div>
                    </CardFooter>
                  </Card>
                ))
            ) : clients?.length === 0 ? (
              <div className="col-span-3 text-center p-8">
                <p className="text-gray-500">Nenhum cliente encontrado</p>
              </div>
            ) : (
              clients?.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{client.company_name}</CardTitle>
                    <CardDescription>
                      {client.meta_ads_budget > 0 && client.meta_account_id
                        ? "Orçamento configurado"
                        : "Orçamento não configurado"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {client.meta_ads_budget > 0 && (
                      <p className="text-sm">
                        Meta Ads: {formatCurrency(client.meta_ads_budget)}
                      </p>
                    )}
                    {client.meta_account_id && (
                      <p className="text-sm text-gray-500">
                        ID da Conta: {client.meta_account_id}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => 
                        (client.meta_ads_budget > 0 && client.meta_account_id) 
                          ? handleAnalyzeClient(client.id)
                          : handleConfigureBudgetsClick(client.id)
                      }
                      className="w-full"
                      variant={(client.meta_ads_budget > 0 && client.meta_account_id) ? "default" : "outline"}
                      disabled={analyzeMutation.isPending && analyzeMutation.variables === client.id}
                    >
                      {analyzeMutation.isPending && analyzeMutation.variables === client.id ? (
                        <>
                          <Loader className="animate-spin mr-2" size={16} />
                          Analisando...
                        </>
                      ) : (
                        <>
                          {(client.meta_ads_budget > 0 && client.meta_account_id)
                            ? "Analisar orçamentos"
                            : "Configurar orçamentos"}
                          <ArrowRight className="ml-2" size={16} />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ListChecks className="text-muran-primary" size={20} />
              Revisões Recentes
            </h2>

            {isLoadingReviews ? (
              <div className="rounded-lg border animate-pulse">
                <div className="h-12 bg-gray-100 rounded-t-lg"></div>
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="h-16 border-t bg-white px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  ))}
              </div>
            ) : reviews?.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                    <AlertCircle className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500">Nenhuma revisão encontrada</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Faça uma análise de cliente para ver revisões aqui
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 grid grid-cols-8">
                  <div className="col-span-4">Cliente</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-2">Orçamento Diário</div>
                </div>
                {reviews?.map((review) => (
                  <div
                    key={review.id}
                    className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedClient(review.client_id);
                      setActiveTab("client-details");
                    }}
                  >
                    <div className="px-4 py-3 text-sm grid grid-cols-8 items-center">
                      <div className="col-span-4 font-medium">{review.clients?.company_name}</div>
                      <div className="col-span-2 text-gray-500">
                        {new Date(review.review_date).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        {formatCurrency(review.meta_daily_budget_current || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="client-details" className="mt-4">
          {selectedClient && <ClientReviewDetails clientId={selectedClient} onBack={() => setActiveTab("clients-list")} />}
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <DailyReviewsSummary />
        </TabsContent>

        <TabsContent value="setup" className="mt-4">
          <BudgetSetupForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyReviews;
