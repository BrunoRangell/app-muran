
import { useState, useCallback, useEffect } from "react";
import { useBatchReview } from "../hooks/useBatchReview";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { Card } from "@/components/ui/card";
import { Loader, AlertCircle, Search, RefreshCw, LayoutGrid, Table } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { ClientReviewCardCompact } from "./ClientReviewCardCompact";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

interface ReviewsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboardCard = ({ onViewClientDetails }: ReviewsDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { 
    clientsWithReviews, 
    isLoading, 
    processingClients, 
    reviewSingleClient, 
    reviewAllClients,
    lastReviewTime,
    isBatchAnalyzing,
    refetchClients,
    // Adicionar informações de progresso
    batchProgress,
    totalClientsToAnalyze
  } = useBatchReview();
  
  // Configurar listener para os orçamentos personalizados e invalidação da query
  useEffect(() => {
    // Criar um canal para ouvir mudanças na tabela meta_custom_budgets
    const channel = queryClient.getQueryCache().find(["clients-with-custom-budgets"])
      ? queryClient.getQueryCache().find(["clients-with-custom-budgets"])?.queryKey
      : ["budget-changes-channel"];

    // Função para invalidar as queries relacionadas
    const invalidateQueries = () => {
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    };

    // Adicionar listener para mudanças em orçamentos personalizados
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (
        event.type === 'updated' || 
        event.type === 'added' || 
        event.type === 'removed'
      ) {
        // Se a mudança envolveu um orçamento personalizado
        if (
          event.query.queryKey.includes("clients-with-custom-budgets") ||
          (Array.isArray(event.query.queryKey[0]) && 
           event.query.queryKey[0].includes("custom-budget"))
        ) {
          console.log("Mudança detectada em orçamentos personalizados, atualizando...");
          invalidateQueries();
          // Mostrar toast informando sobre a atualização
          toast({
            title: "Orçamentos atualizados",
            description: "O painel foi atualizado com as alterações nos orçamentos personalizados.",
            duration: 3000,
          });
        }
      }
    });

    // Invalidar a query no início para garantir dados atualizados
    invalidateQueries();
    
    // Limpar subscription quando o componente for desmontado
    return () => {
      unsubscribe();
    };
  }, [queryClient, toast]);
  
  // Calcular porcentagem de progresso
  const progressPercentage = totalClientsToAnalyze > 0 
    ? Math.round((batchProgress / totalClientsToAnalyze) * 100) 
    : 0;
  
  // Filtrar clientes com base na pesquisa
  const filteredClients = clientsWithReviews?.filter(client => 
    client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Ordenar clientes
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "name") {
      return a.company_name.localeCompare(b.company_name);
    } else if (sortBy === "budget") {
      return (b.meta_ads_budget || 0) - (a.meta_ads_budget || 0);
    } else if (sortBy === "lastReview") {
      const dateA = a.lastReview?.updated_at ? new Date(a.lastReview.updated_at).getTime() : 0;
      const dateB = b.lastReview?.updated_at ? new Date(b.lastReview.updated_at).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  // Função para verificar se um cliente precisa de ajuste
  const clientNeedsAdjustment = (client: ClientWithReview): boolean => {
    if (!client.lastReview || !client.meta_account_id) return false;
    
    // Calcular orçamento diário ideal
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const daysRemaining = daysInMonth - dayOfMonth + 1;
    
    const monthlyBudget = client.meta_ads_budget || 0;
    const totalSpent = client.lastReview.meta_total_spent || 0;
    const remaining = monthlyBudget - totalSpent;
    const idealDailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
    
    // Comparar com orçamento atual
    const currentDailyBudget = client.lastReview.meta_daily_budget_current || 0;
    const difference = idealDailyBudget - currentDailyBudget;
    
    // Se a diferença for maior ou igual a 5, precisa de ajuste
    return Math.abs(difference) >= 5;
  };

  // Ordenar clientes de acordo com a prioridade (independente da ordenação escolhida)
  const prioritizedClients = [...sortedClients].sort((a, b) => {
    // Primeiro critério: clientes sem Meta Ads ficam por último
    if (!a.meta_account_id && b.meta_account_id) return 1;
    if (a.meta_account_id && !b.meta_account_id) return -1;
    
    // Se ambos não têm Meta Ads, mantém a ordenação original
    if (!a.meta_account_id && !b.meta_account_id) return 0;
    
    // Segundo critério: clientes que precisam de ajuste vêm primeiro
    const aNeedsAdjustment = clientNeedsAdjustment(a);
    const bNeedsAdjustment = clientNeedsAdjustment(b);
    
    if (aNeedsAdjustment && !bNeedsAdjustment) return -1;
    if (!aNeedsAdjustment && bNeedsAdjustment) return 1;
    
    // Se ambos precisam ou não precisam de ajuste, mantém a ordenação original
    return 0;
  });

  // Dividir os clientes em grupos para renderização
  const clientsWithMetaId = prioritizedClients.filter(client => client.meta_account_id);
  const clientsWithoutMetaId = prioritizedClients.filter(client => !client.meta_account_id);

  // Funções de manipulação
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão para cliente:", clientId);
    reviewSingleClient(clientId);
  }, [reviewSingleClient]);

  const handleRefresh = useCallback(() => {
    refetchClients();
  }, [refetchClients]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-muran-dark mb-1">
              Dashboard Meta Ads
            </h2>
            {lastReviewTime && (
              <p className="text-sm text-gray-500">
                {formatDateInBrasiliaTz(lastReviewTime, "'Última revisão em massa em' dd/MM 'às' HH:mm")}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isBatchAnalyzing || isLoading}
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="default"
              onClick={reviewAllClients}
              disabled={isBatchAnalyzing || isLoading}
              className="bg-muran-primary hover:bg-muran-primary/90"
            >
              {isBatchAnalyzing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Analisar Todos
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Barra de progresso */}
        {isBatchAnalyzing && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso da análise</span>
              <span className="text-sm text-gray-500">{batchProgress} de {totalClientsToAnalyze} ({progressPercentage}%)</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2" 
              indicatorClassName="bg-muran-primary"
            />
          </div>
        )}
        
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Buscar cliente por nome..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <ToggleGroup type="single" value={viewMode} onValueChange={(val) => val && setViewMode(val)}>
              <ToggleGroupItem value="grid" aria-label="Visualização em grade">
                <LayoutGrid size={18} />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Visualização em tabela">
                <Table size={18} />
              </ToggleGroupItem>
            </ToggleGroup>
            
            <Separator orientation="vertical" className="h-8 mx-2" />
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="budget">Orçamento</SelectItem>
                <SelectItem value="lastReview">Última Revisão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Estado de carregamento */}
      {isLoading ? (
        <div className="py-8 flex justify-center items-center">
          <Loader className="animate-spin w-8 h-8 text-muran-primary" />
          <span className="ml-3 text-gray-500">Carregando clientes...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="text-gray-500">Nenhum cliente encontrado com os filtros atuais.</p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-350px)]">
          {/* Lista de clientes */}
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
            {clientsWithMetaId.map((client) => (
              <ClientReviewCardCompact
                key={client.id}
                client={client}
                onReviewClient={handleReviewClient}
                isProcessing={processingClients.includes(client.id)}
                compact={viewMode === 'table'}
              />
            ))}
            
            {/* Clientes sem configuração Meta Ads */}
            {clientsWithoutMetaId.map((client) => (
              <ClientReviewCardCompact
                key={client.id}
                client={client}
                onReviewClient={handleReviewClient}
                isProcessing={processingClients.includes(client.id)}
                compact={viewMode === 'table'}
                inactive
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
