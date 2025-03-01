
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Calendar, ListChecks, ArrowRight, TrendingUp, TrendingDown, Loader } from "lucide-react";
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

type Client = {
  id: string;
  company_name: string;
  meta_ads_budget: number;
  google_ads_budget: number;
};

const DailyReviews = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("clients-list");
  const { toast } = useToast();

  // Buscar clientes ativos
  const { data: clients, isLoading: isLoadingClients } = useQuery({
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
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
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
      const response = await supabase.functions.invoke("daily-budget-reviews", {
        body: { method: "analyzeClient", clientId },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Análise concluída",
        description: `A análise para ${data.client.company_name} foi atualizada com sucesso.`,
      });
      setSelectedClient(data.client.id);
      setActiveTab("client-details");
    },
    onError: (error) => {
      toast({
        title: "Erro na análise",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeClient = (clientId: string) => {
    analyzeMutation.mutate(clientId);
  };

  useEffect(() => {
    // Se um cliente for selecionado mas a tab for "clients-list", mude para "client-details"
    if (selectedClient && activeTab === "clients-list") {
      setActiveTab("client-details");
    }
  }, [selectedClient, activeTab]);

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
                      {(client.meta_ads_budget > 0 || client.google_ads_budget > 0)
                        ? "Orçamentos configurados"
                        : "Orçamentos não configurados"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {client.meta_ads_budget > 0 && (
                      <p className="text-sm">
                        Meta Ads: {formatCurrency(client.meta_ads_budget)}
                      </p>
                    )}
                    {client.google_ads_budget > 0 && (
                      <p className="text-sm">
                        Google Ads: {formatCurrency(client.google_ads_budget)}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleAnalyzeClient(client.id)}
                      className="w-full"
                      variant={
                        client.meta_ads_budget > 0 || client.google_ads_budget > 0
                          ? "default"
                          : "outline"
                      }
                      disabled={analyzeMutation.isPending}
                    >
                      {analyzeMutation.isPending && analyzeMutation.variables === client.id ? (
                        <>
                          <Loader className="animate-spin mr-2" size={16} />
                          Analisando...
                        </>
                      ) : (
                        <>
                          {client.meta_ads_budget > 0 || client.google_ads_budget > 0
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
                  <p className="text-gray-500">Nenhuma revisão encontrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 grid grid-cols-12">
                  <div className="col-span-4">Cliente</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-3">Meta Ads</div>
                  <div className="col-span-3">Google Ads</div>
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
                    <div className="px-4 py-3 text-sm grid grid-cols-12 items-center">
                      <div className="col-span-4 font-medium">{review.clients?.company_name}</div>
                      <div className="col-span-2 text-gray-500">
                        {new Date(review.review_date).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="col-span-3 flex items-center gap-1">
                        {review.meta_recommendation?.includes("Aumentar") ? (
                          <TrendingUp className="text-green-500" size={16} />
                        ) : review.meta_recommendation?.includes("Diminuir") ? (
                          <TrendingDown className="text-red-500" size={16} />
                        ) : (
                          <span>-</span>
                        )}
                        <span className="truncate">
                          {review.meta_recommendation || "Não disponível"}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center gap-1">
                        {review.google_recommendation?.includes("Aumentar") ? (
                          <TrendingUp className="text-green-500" size={16} />
                        ) : review.google_recommendation?.includes("Diminuir") ? (
                          <TrendingDown className="text-red-500" size={16} />
                        ) : (
                          <span>-</span>
                        )}
                        <span className="truncate">
                          {review.google_recommendation || "Não disponível"}
                        </span>
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
