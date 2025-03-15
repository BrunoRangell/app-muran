
import { useState, useCallback, useEffect } from "react";
import { useBatchReview } from "../hooks/useBatchReview";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { Card } from "@/components/ui/card";
import { Loader, AlertCircle, Search, RefreshCw, LayoutGrid, Table, BadgeDollarSign, TrendingUp } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface ReviewsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboardCard = ({ onViewClientDetails }: ReviewsDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
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
    batchProgress,
    totalClientsToAnalyze
  } = useBatchReview();
  
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (
        event.type === 'updated' || 
        event.type === 'added' || 
        event.type === 'removed'
      ) {
        if (
          (event.query.queryKey && 
           Array.isArray(event.query.queryKey) &&
           event.query.queryKey[0] === "clients-with-custom-budgets") ||
          (Array.isArray(event.query.queryKey) && 
           event.query.queryKey.length > 0 &&
           Array.isArray(event.query.queryKey[0]) && 
           event.query.queryKey[0].includes && 
           event.query.queryKey[0].includes("custom-budget"))
        ) {
          console.log("Mudança detectada em orçamentos personalizados, atualizando...");
          queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
          toast({
            title: "Orçamentos atualizados",
            description: "O painel foi atualizado com as alterações nos orçamentos personalizados.",
            duration: 3000,
          });
        }
      }
    });

    queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    
    return () => {
      unsubscribe();
    };
  }, [queryClient, toast]);
  
  const progressPercentage = totalClientsToAnalyze > 0 
    ? Math.round((batchProgress / totalClientsToAnalyze) * 100) 
    : 0;
  
  const filteredClients = clientsWithReviews?.filter(client => 
    client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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

  // Função auxiliar para verificar se um cliente precisa de ajuste de orçamento
  const clientNeedsAdjustment = (client: ClientWithReview): boolean => {
    // Verificar se o cliente tem uma revisão e conta Meta
    if (!client.lastReview || !client.meta_account_id) return false;
    
    // Verificar se o cliente tem um orçamento diário atual válido
    const hasDailyBudget = 
      client.lastReview.meta_daily_budget_current !== null && 
      client.lastReview.meta_daily_budget_current !== undefined;
    
    if (!hasDailyBudget) return false;
    
    // Pegar valores atuais e ideais de orçamento diário
    const currentDailyBudget = client.lastReview.meta_daily_budget_current || 0;
    const idealDailyBudget = client.lastReview.idealDailyBudget || 0;
    
    // Verificar se a diferença é significativa (≥ 5)
    const needsAdjustment = Math.abs(idealDailyBudget - currentDailyBudget) >= 5;
    
    console.log(`Cliente ${client.company_name} precisa de ajuste? ${needsAdjustment}`, {
      currentDailyBudget,
      idealDailyBudget,
      difference: Math.abs(idealDailyBudget - currentDailyBudget),
      meta_account_id: client.meta_account_id,
      hasDailyBudget
    });
    
    return needsAdjustment;
  };

  // Aplicar a ordenação priorizada - agora colocando clientes que precisam de ajuste no topo
  const prioritizedClients = [...sortedClients].sort((a, b) => {
    // Primeiro verificar se ambos têm meta_account_id (são clientes ativos)
    const aHasMetaId = !!a.meta_account_id;
    const bHasMetaId = !!b.meta_account_id;
    
    // Somente clientes com Meta Ads aparecem no topo
    if (!aHasMetaId && bHasMetaId) return 1;
    if (aHasMetaId && !bHasMetaId) return -1;
    
    // Se nenhum tem meta_account_id, manter a ordenação original
    if (!aHasMetaId && !bHasMetaId) return 0;
    
    // Agora verificar explicitamente se precisa de ajuste
    const aNeedsAdjustment = clientNeedsAdjustment(a);
    const bNeedsAdjustment = clientNeedsAdjustment(b);
    
    // Os clientes que precisam de ajuste vêm primeiro - esta é a ordenação prioritária
    if (aNeedsAdjustment && !bNeedsAdjustment) return -1;
    if (!aNeedsAdjustment && bNeedsAdjustment) return 1;
    
    // Se ambos precisam ou não precisam de ajuste, manter a ordenação original
    return 0;
  });

  // Aplicar filtro de ajustes necessários, se ativado
  const filteredPrioritizedClients = showOnlyAdjustments
    ? prioritizedClients.filter(client => clientNeedsAdjustment(client))
    : prioritizedClients;

  // Separar clientes com e sem Meta ID
  const clientsWithMetaId = filteredPrioritizedClients.filter(client => client.meta_account_id);
  const clientsWithoutMetaId = filteredPrioritizedClients.filter(client => !client.meta_account_id);

  // Contar quantos clientes precisam de ajustes para mostrar no botão de filtro
  const adjustmentsCount = prioritizedClients.filter(client => clientNeedsAdjustment(client)).length;

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

  const toggleAdjustmentsFilter = useCallback(() => {
    setShowOnlyAdjustments(prev => !prev);
  }, []);

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
            <Button
              variant={showOnlyAdjustments ? "default" : "outline"}
              onClick={toggleAdjustmentsFilter}
              className={showOnlyAdjustments ? "bg-muran-primary hover:bg-muran-primary/90" : ""}
              size="sm"
            >
              <TrendingUp size={16} className="mr-2" />
              Ajustes necessários
              {adjustmentsCount > 0 && (
                <Badge variant="outline" className="ml-2 bg-white text-muran-primary">
                  {adjustmentsCount}
                </Badge>
              )}
            </Button>
            
            <Separator orientation="vertical" className="h-8 mx-2" />
            
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

      {isLoading ? (
        <div className="py-8 flex justify-center items-center">
          <Loader className="animate-spin w-8 h-8 text-muran-primary" />
          <span className="ml-3 text-gray-500">Carregando clientes...</span>
        </div>
      ) : (filteredPrioritizedClients.length === 0) ? (
        <Card className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="text-gray-500">
            {showOnlyAdjustments 
              ? "Nenhum cliente encontrado que necessite de ajustes no orçamento." 
              : "Nenhum cliente encontrado com os filtros atuais."}
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-350px)]">
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

