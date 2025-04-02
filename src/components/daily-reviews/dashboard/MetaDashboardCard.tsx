
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAltCard } from "./ClientAltCard";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { FilterOptions } from "./components/FilterOptions";
import { CompactNextReviewCountdown } from "./components/CompactNextReviewCountdown";
import { useBatchReview } from "@/hooks/useBatchReview";

interface MetaDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const MetaDashboardCard = ({ onViewClientDetails }: MetaDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Usar o hook centralizado para revisão em lote
  const { 
    reviewAllClients, 
    lastBatchReviewTime,
    batchProgress,
    isLoading: isReviewing
  } = useBatchReview();

  // Buscar clientes do Supabase
  useEffect(() => {
    fetchClients();
    
    // Atualizar a cada 60 segundos ou quando lastBatchReviewTime mudar
    const intervalId = setInterval(fetchClients, 60000);
    
    return () => clearInterval(intervalId);
  }, [lastBatchReviewTime]);

  // Função para buscar clientes
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      
      // Buscar clientes ativos
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          company_name,
          meta_account_id,
          meta_ads_budget
        `)
        .eq('status', 'active')
        .order('company_name');
      
      if (clientsError) throw clientsError;
      
      // Para cada cliente, buscar a revisão mais recente
      const processedClients = [];
      
      for (const client of clientsData || []) {
        const { data: reviewData } = await supabase
          .from('daily_budget_reviews')
          .select('*')
          .eq('client_id', client.id)
          .order('review_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // Adicionar a revisão mais recente ao cliente
        processedClients.push({
          ...client,
          lastReview: reviewData,
          // Pré-calcular se o cliente precisa de ajuste
          needsBudgetAdjustment: reviewData ? calculateNeedsAdjustment(client, reviewData) : false
        });
      }
      
      setClients(processedClients);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar os dados dos clientes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para analisar cliente individual
  const reviewClient = async (clientId: string) => {
    // Evitar análises simultâneas do mesmo cliente
    if (processingClients.includes(clientId) || isReviewing) {
      return;
    }
    
    try {
      setProcessingClients(prev => [...prev, clientId]);
      
      // Buscar token do Meta Ads
      const { data: tokenData, error: tokenError } = await supabase
        .from('api_tokens')
        .select('value')
        .eq('name', 'meta_access_token')
        .single();
      
      if (tokenError) throw new Error("Token do Meta Ads não encontrado");
      
      // Buscar cliente
      const client = clients.find(c => c.id === clientId);
      if (!client) throw new Error("Cliente não encontrado");
      if (!client.meta_account_id) throw new Error("Cliente sem ID do Meta Ads configurado");
      
      // Preparar datas
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedToday = now.toISOString().split('T')[0];
      
      // Chamar a função Edge
      const { data: result, error: functionError } = await supabase.functions.invoke(
        "meta-budget-calculator",
        {
          body: {
            accountId: client.meta_account_id,
            accessToken: tokenData.value,
            dateRange: {
              start: formattedStartDate,
              end: formattedToday
            },
            fetchSeparateInsights: true
          }
        }
      );
      
      if (functionError) throw functionError;
      if (!result) throw new Error("A resposta da API não contém dados");
      
      // Extrair valores
      const metaDailyBudget = result.totalDailyBudget || 0;
      const metaTotalSpent = result.totalSpent || 0;
      
      // Buscar orçamento personalizado
      const { data: customBudgetData } = await supabase
        .from("meta_custom_budgets")
        .select("id, budget_amount, start_date, end_date")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .lte("start_date", formattedToday)
        .gte("end_date", formattedToday)
        .order("created_at", { ascending: false })
        .maybeSingle();
      
      // Preparar informações do orçamento personalizado
      const customBudgetInfo = customBudgetData
        ? {
            using_custom_budget: true,
            custom_budget_id: customBudgetData.id,
            custom_budget_amount: customBudgetData.budget_amount,
          }
        : {
            using_custom_budget: false,
            custom_budget_id: null,
            custom_budget_amount: null,
          };
      
      // Verificar se já existe revisão para hoje
      const { data: existingReview } = await supabase
        .from('daily_budget_reviews')
        .select('id')
        .eq('client_id', clientId)
        .eq('review_date', formattedToday)
        .maybeSingle();
      
      // Salvar ou atualizar a revisão
      if (existingReview) {
        await supabase
          .from('daily_budget_reviews')
          .update({
            meta_daily_budget_current: metaDailyBudget,
            meta_total_spent: metaTotalSpent,
            ...customBudgetInfo,
            updated_at: now.toISOString()
          })
          .eq('id', existingReview.id);
      } else {
        await supabase
          .from('daily_budget_reviews')
          .insert({
            client_id: clientId,
            review_date: formattedToday,
            meta_daily_budget_current: metaDailyBudget,
            meta_total_spent: metaTotalSpent,
            meta_account_id: client.meta_account_id,
            meta_account_name: `Conta ${client.meta_account_id}`,
            ...customBudgetInfo
          });
      }
      
      // Exibir toast de sucesso
      toast({
        title: "Análise concluída",
        description: "A análise do cliente foi atualizada com sucesso."
      });
      
      // Atualizar a lista de clientes
      fetchClients();
      
    } catch (error: any) {
      console.error("Erro ao analisar cliente:", error);
      toast({
        title: "Erro na análise",
        description: error.message || "Ocorreu um erro ao analisar o cliente.",
        variant: "destructive"
      });
    } finally {
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  };

  // Auxiliar para determinar se um cliente precisa de ajuste
  const calculateNeedsAdjustment = (client: any, review: any): boolean => {
    if (!review) return false;
    
    const currentDailyBudget = review.meta_daily_budget_current || 0;
    const totalSpent = review.meta_total_spent || 0;
    
    // Calcular orçamento diário ideal
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const daysRemaining = daysInMonth - dayOfMonth + 1;
    
    const monthlyBudget = review.using_custom_budget ? 
      review.custom_budget_amount : 
      client.meta_ads_budget || 0;
    
    const remaining = monthlyBudget - totalSpent;
    const idealDailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
    
    // Considerar ajuste necessário se a diferença for >= 5
    const budgetDiff = Math.abs(idealDailyBudget - currentDailyBudget);
    return budgetDiff >= 5;
  };

  // Aplicar filtros
  const filteredByName = clients ? filterClientsByName(clients, searchQuery) : [];
  const finalFilteredClients = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-xl font-bold text-[#321e32]">
          Revisão de Orçamentos Meta
        </CardTitle>
        <div className="text-right">
          <CompactNextReviewCountdown />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar cliente por nome..."
            className="w-full h-10 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff6e00] focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <FilterOptions 
          showOnlyAdjustments={showOnlyAdjustments}
          onShowOnlyAdjustmentsChange={setShowOnlyAdjustments}
        />

        {isLoading ? (
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6e00] mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando clientes...</p>
          </div>
        ) : finalFilteredClients.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orçamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gasto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recomendado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {finalFilteredClients.map((client) => (
                  <ClientAltCard
                    key={client.id}
                    client={client}
                    onReviewClient={reviewClient}
                    isProcessing={processingClients.includes(client.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-10">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        )}
        
        {batchProgress && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Análise em lote em andamento</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-[#ff6e00] h-2.5 rounded-full" 
                style={{ width: `${batchProgress.percentComplete || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Processados: {batchProgress.processedClients || 0}/{batchProgress.totalClients || 0}</span>
              <span>{batchProgress.percentComplete || 0}%</span>
            </div>
            {batchProgress.lastProcessed && (
              <p className="text-xs text-gray-500 mt-2">Último cliente: {batchProgress.lastProcessed}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
