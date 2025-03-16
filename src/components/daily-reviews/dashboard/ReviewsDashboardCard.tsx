
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

  // Calcula o ajuste de orçamento necessário para cada cliente
  const calculateBudgetAdjustment = (client: ClientWithReview): number => {
    // Se não tem revisão ou ID de conta Meta, retorna 0
    if (!client.lastReview || !client.meta_account_id) return 0;
    
    // Obtem valores da revisão
    const currentDailyBudget = client.lastReview?.meta_daily_budget_current || 0;
    
    // Se estiver usando orçamento personalizado, usa os valores do orçamento personalizado
    if (client.lastReview?.using_custom_budget) {
      // Valida se há orçamento diário ideal
      if (!client.lastReview || currentDailyBudget === 0) return 0;
      
      // Calcula dias restantes no período do orçamento personalizado
      const monthlyBudget = client.lastReview.custom_budget_amount || 0;
      const totalSpent = client.lastReview.meta_total_spent || 0;
      
      // Este valor seria calculado no hook useClientBudgetCalculation
      const idealDailyBudget = client.lastReview.idealDailyBudget || 0;
      
      // Retorna a diferença absoluta
      return Math.abs(idealDailyBudget - currentDailyBudget);
    } else {
      // Para orçamento regular
      const today = new Date();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const dayOfMonth = today.getDate();
      const daysRemaining = daysInMonth - dayOfMonth + 1;
      
      const monthlyBudget = client.meta_ads_budget || 0;
      const totalSpent = client.lastReview.meta_total_spent || 0;
      const remaining = monthlyBudget - totalSpent;
      const idealDailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
      
      return Math.abs(idealDailyBudget - currentDailyBudget);
    }
  };
  
  // Verifica se um cliente precisa de ajuste (diferença >= 5)
  const clientNeedsAdjustment = (client: ClientWithReview): boolean => {
    // Se não tem revisão, não precisa de ajuste
    if (!client.lastReview) return false;
    
    // Calcular o ajuste necessário
    const adjustment = calculateBudgetAdjustment(client);
    
    // Adicionar log para diagnóstico
    console.log(`Cliente ${client.company_name} - Verificando necessidade de ajuste:`, {
      usandoOrcamentoPersonalizado: client.lastReview?.using_custom_budget,
      ajusteCalculado: adjustment,
      precisaAjuste: adjustment >= 5
    });
    
    return adjustment >= 5;
  };
  
  // Filtra apenas clientes que precisam de ajuste se a opção estiver marcada
  const filteredByAdjustment = showOnlyAdjustments 
    ? filteredByName.filter(client => clientNeedsAdjustment(client))
    : filteredByName;

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
      // Verificar se os clientes precisam de ajuste
      const aNeedsAdjustment = clientNeedsAdjustment(a);
      const bNeedsAdjustment = clientNeedsAdjustment(b);
      
      // Logs para diagnóstico de ordenação
      console.log(`Ordenação - Cliente A (${a.company_name}):`, {
        orçamentoPersonalizado: a.lastReview?.using_custom_budget || false,
        precisaAjuste: aNeedsAdjustment,
        ajuste: calculateBudgetAdjustment(a)
      });
      console.log(`Ordenação - Cliente B (${b.company_name}):`, {
        orçamentoPersonalizado: b.lastReview?.using_custom_budget || false,
        precisaAjuste: bNeedsAdjustment,
        ajuste: calculateBudgetAdjustment(b)
      });
      
      // Clientes que precisam de ajuste vêm primeiro
      if (aNeedsAdjustment && !bNeedsAdjustment) return -1;
      if (!aNeedsAdjustment && bNeedsAdjustment) return 1;
      
      // Se ambos precisam de ajuste, ordena pelo tamanho do ajuste (decrescente)
      if (aNeedsAdjustment && bNeedsAdjustment) {
        const adjustmentA = calculateBudgetAdjustment(a);
        const adjustmentB = calculateBudgetAdjustment(b);
        return adjustmentB - adjustmentA;
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
            
            <Select value={sortBy} onValueChange={setSortBy}>
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
              onCheckedChange={setShowOnlyAdjustments}
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
