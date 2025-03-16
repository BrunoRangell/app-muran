
import { useState, useCallback, useEffect } from "react";
import { useBatchReview } from "../hooks/useBatchReview";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { Card } from "@/components/ui/card";
import { Loader, AlertCircle, Search, RefreshCw, LayoutGrid, Table, BadgeDollarSign, Filter } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";

interface ReviewsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboardCard = ({ onViewClientDetails }: ReviewsDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("adjustments");
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
  
  // Filtra clientes pelo nome
  const filteredByName = clientsWithReviews?.filter(client => 
    client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Verificação completa da necessidade de ajuste usando hook
  const getClientAdjustmentInfo = (client: ClientWithReview) => {
    if (!client.meta_account_id || !client.lastReview) {
      return { needsAdjustment: false, adjustmentValue: 0 };
    }

    // Usar o hook para obter todas as informações de cálculo de orçamento
    const {
      needsBudgetAdjustment,
      budgetDifference,
      idealDailyBudget,
      currentDailyBudget
    } = useClientBudgetCalculation(client);

    return {
      needsAdjustment: needsBudgetAdjustment || false,
      adjustmentValue: Math.abs(budgetDifference || 0),
      idealDailyBudget,
      currentDailyBudget
    };
  };

  // Filtrar apenas clientes que precisam de ajuste se a opção estiver marcada
  const filteredByAdjustment = showOnlyAdjustments 
    ? filteredByName.filter(client => {
        const { needsAdjustment } = getClientAdjustmentInfo(client);
        return needsAdjustment;
      })
    : filteredByName;

  // Cache para otimizar a ordenação e evitar recálculos
  const clientAdjustmentCache = new Map<string, { needsAdjustment: boolean, adjustmentValue: number }>();

  // Função para obter as informações de ajuste, usando o cache para performance
  const getAdjustmentInfoCached = (client: ClientWithReview) => {
    if (!clientAdjustmentCache.has(client.id)) {
      // Análise dos dados de orçamento e necessidade de ajuste
      const needsAdjustment = client.lastReview?.needs_budget_adjustment === true;
      
      // Valor absoluto da diferença para ordenação
      let adjustmentValue = 0;
      if (client.lastReview && client.lastReview.budget_difference) {
        adjustmentValue = Math.abs(client.lastReview.budget_difference);
      }
      
      // Log detalhado para diagnóstico
      console.log(`[Ordenação Cache] Cliente ${client.company_name}:`, {
        id: client.id,
        orçamentoPersonalizado: client.lastReview?.using_custom_budget || false,
        precisaAjuste: needsAdjustment,
        valorAjuste: adjustmentValue,
        dadosRevisão: client.lastReview ? {
          needs_budget_adjustment: client.lastReview.needs_budget_adjustment,
          budget_difference: client.lastReview.budget_difference
        } : 'Sem revisão'
      });
      
      clientAdjustmentCache.set(client.id, { 
        needsAdjustment, 
        adjustmentValue 
      });
    }
    
    return clientAdjustmentCache.get(client.id)!;
  };

  // Ordena os clientes com base no critério selecionado
  const sortedClients = [...filteredByAdjustment].sort((a, b) => {
    // Primeiro separa clientes com e sem conta Meta
    if (!a.meta_account_id && b.meta_account_id) return 1;
    if (a.meta_account_id && !b.meta_account_id) return -1;
    
    // Se ambos não têm conta Meta, ordena por nome
    if (!a.meta_account_id && !b.meta_account_id) {
      return a.company_name.localeCompare(b.company_name);
    }
    
    // Agora aplica a lógica de ordenação específica
    if (sortBy === "adjustments") {
      // Obter informações de ajuste dos clientes
      const aInfo = getAdjustmentInfoCached(a);
      const bInfo = getAdjustmentInfoCached(b);

      // Logs para diagnóstico de ordenação
      console.log(`[Ordenação Comparação] ${a.company_name} vs ${b.company_name}:`, {
        a_precisa: aInfo.needsAdjustment,
        b_precisa: bInfo.needsAdjustment,
        a_valor: aInfo.adjustmentValue,
        b_valor: bInfo.adjustmentValue
      });
      
      // Clientes que precisam de ajuste vêm primeiro
      if (aInfo.needsAdjustment && !bInfo.needsAdjustment) return -1;
      if (!aInfo.needsAdjustment && bInfo.needsAdjustment) return 1;
      
      // Se ambos precisam de ajuste, ordena pelo tamanho do ajuste (decrescente)
      if (aInfo.needsAdjustment && bInfo.needsAdjustment) {
        return bInfo.adjustmentValue - aInfo.adjustmentValue;
      }
      
      // Se nenhum precisa de ajuste, ordena por nome
      return a.company_name.localeCompare(b.company_name);
    } else if (sortBy === "name") {
      return a.company_name.localeCompare(b.company_name);
    } else if (sortBy === "budget") {
      // Para orçamento, considerar o personalizado se estiver ativo
      const budgetA = a.lastReview?.using_custom_budget ? 
        (a.lastReview.custom_budget_amount || 0) : (a.meta_ads_budget || 0);
      
      const budgetB = b.lastReview?.using_custom_budget ? 
        (b.lastReview.custom_budget_amount || 0) : (b.meta_ads_budget || 0);
      
      return budgetB - budgetA;
    } else if (sortBy === "lastReview") {
      const dateA = a.lastReview?.updated_at ? new Date(a.lastReview.updated_at).getTime() : 0;
      const dateB = b.lastReview?.updated_at ? new Date(b.lastReview.updated_at).getTime() : 0;
      return dateB - dateA;
    }
    
    return 0;
  });
  
  // Dividir clientes com e sem Meta ID para exibição
  const clientsWithMetaId = sortedClients.filter(client => client.meta_account_id);
  const clientsWithoutMetaId = sortedClients.filter(client => !client.meta_account_id);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão para cliente:", clientId);
    reviewSingleClient(clientId);
    
    // Limpar o cache de ajustes quando um cliente é revisado
    clientAdjustmentCache.clear();
  }, [reviewSingleClient]);

  const handleRefresh = useCallback(() => {
    refetchClients();
    
    // Limpar o cache de ajustes quando os dados são atualizados
    clientAdjustmentCache.clear();
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
        
        <div className="flex flex-col md:flex-row items-center gap-4 mb-3">
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
            
            <Select value={sortBy} onValueChange={(value) => {
              setSortBy(value);
              clientAdjustmentCache.clear(); // Limpar cache ao mudar ordenação
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adjustments">Ajustes Necessários</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="budget">Orçamento</SelectItem>
                <SelectItem value="lastReview">Última Revisão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pl-2">
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-adjustments" 
              checked={showOnlyAdjustments}
              onCheckedChange={(value) => {
                setShowOnlyAdjustments(value);
                clientAdjustmentCache.clear(); // Limpar cache ao mudar filtro
              }}
            />
            <Label htmlFor="show-adjustments" className="text-sm font-medium flex items-center">
              <Filter size={16} className="mr-1 text-gray-500" />
              Mostrar apenas clientes com ajustes necessários
            </Label>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center items-center">
          <Loader className="animate-spin w-8 h-8 text-muran-primary" />
          <span className="ml-3 text-gray-500">Carregando clientes...</span>
        </div>
      ) : sortedClients.length === 0 ? (
        <Card className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="text-gray-500">Nenhum cliente encontrado com os filtros atuais.</p>
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
