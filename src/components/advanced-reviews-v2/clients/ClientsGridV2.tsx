
import { useState, useEffect, useMemo } from "react";
import { ClientCardV2 } from "./ClientCardV2";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { useUnifiedBudgetCalculation } from "../hooks/useUnifiedBudgetCalculation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw } from "lucide-react";

interface ClientsGridProps {
  clients: ClientWithReview[];
  platform: "meta" | "google";
  processingIds: string[];
  isLoadingClients: boolean;
  onReviewClient: (clientId: string, accountId?: string) => void;
  onReviewAll?: () => void;
  onViewDetails?: (clientId: string) => void;
  isProcessingAll?: boolean;
}

export function ClientsGridV2({
  clients,
  platform,
  processingIds,
  isLoadingClients,
  onReviewClient,
  onReviewAll,
  onViewDetails,
  isProcessingAll = false,
}: ClientsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState("all");
  const [sortOption, setSortOption] = useState("name");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Filtrar clientes com base na pesquisa e filtros
  const filteredClients = useMemo(() => {
    if (!clients || clients.length === 0) return [];

    return clients
      .filter((client) => {
        // Filtrar por pesquisa (nome da empresa)
        const matchesSearch =
          searchQuery === "" ||
          client.company_name.toLowerCase().includes(searchQuery.toLowerCase());

        // Filtrar por opção de filtro
        switch (filterOption) {
          case "needs-adjustment":
            return (
              matchesSearch &&
              (client.needsBudgetAdjustment || false)
            );
          case "has-review":
            return matchesSearch && client.lastReview !== null;
          case "no-review":
            return matchesSearch && client.lastReview === null;
          case "custom-budget":
            return (
              matchesSearch &&
              client.lastReview?.using_custom_budget === true
            );
          default:
            return matchesSearch;
        }
      })
      .sort((a, b) => {
        // Ordenação dos clientes
        switch (sortOption) {
          case "name":
            return a.company_name.localeCompare(b.company_name);
          case "budget-high":
            return (
              (b[`${platform}_ads_budget`] || 0) -
              (a[`${platform}_ads_budget`] || 0)
            );
          case "budget-low":
            return (
              (a[`${platform}_ads_budget`] || 0) -
              (b[`${platform}_ads_budget`] || 0)
            );
          default:
            return 0;
        }
      });
  }, [clients, searchQuery, filterOption, sortOption, platform]);

  // Limpar seleções quando a lista de clientes mudar
  useEffect(() => {
    setSelectedClients([]);
  }, [clients, searchQuery, filterOption]);

  // Função para alternar a seleção de um cliente
  const toggleClientSelection = (clientId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedClients((prev) => [...prev, clientId]);
    } else {
      setSelectedClients((prev) => prev.filter((id) => id !== clientId));
    }
  };

  // Função para selecionar ou desselecionar todos os clientes
  const toggleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((client) => client.id));
    }
  };

  // Revisar apenas os clientes selecionados
  const reviewSelected = () => {
    if (onReviewAll) {
      const selectedClientsList = filteredClients.filter((client) =>
        selectedClients.includes(client.id)
      );
      onReviewAll(selectedClientsList);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar clientes..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filterOption} onValueChange={setFilterOption}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              <SelectItem value="needs-adjustment">Precisa de ajuste</SelectItem>
              <SelectItem value="has-review">Com revisão</SelectItem>
              <SelectItem value="no-review">Sem revisão</SelectItem>
              <SelectItem value="custom-budget">Orçamento personalizado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="budget-high">Orçamento (maior primeiro)</SelectItem>
              <SelectItem value="budget-low">Orçamento (menor primeiro)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Barra de ações para itens selecionados */}
      {selectedClients.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
          <span className="text-sm">
            {selectedClients.length} {selectedClients.length === 1 ? "cliente selecionado" : "clientes selecionados"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedClients([])}
            >
              Limpar seleção
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-[#ff6e00] hover:bg-[#e66200]"
              onClick={reviewSelected}
              disabled={isProcessingAll}
            >
              {isProcessingAll ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Revisar selecionados"
              )}
            </Button>
          </div>
        </div>
      )}

      {filteredClients.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <p className="text-gray-500">
            {isLoadingClients
              ? "Carregando clientes..."
              : "Nenhum cliente encontrado para os filtros selecionados."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            // Renderizar cada cliente como um card
            const ClientBudgetCalculation = () => {
              const budgetData = useUnifiedBudgetCalculation({
                client,
                platform,
              });

              const isProcessing = processingIds.includes(client.id);
              const isSelected = selectedClients.includes(client.id);

              return (
                <ClientCardV2
                  key={client.id}
                  clientId={client.id}
                  clientName={client.company_name}
                  accountName={client[`${platform}_account_id`] ? `${platform.charAt(0).toUpperCase() + platform.slice(1)} Ads` : undefined}
                  accountId={client[`${platform}_account_id`]}
                  budgetData={budgetData.hasReview ? {
                    monthlyBudget: budgetData.monthlyBudget,
                    totalSpent: budgetData.totalSpent,
                    currentDailyBudget: budgetData.currentDailyBudget,
                    idealDailyBudget: budgetData.idealDailyBudget,
                    remainingBudget: budgetData.remainingBudget,
                    remainingDays: budgetData.remainingDays,
                    needsAdjustment: budgetData.needsAdjustment,
                    isCustomBudget: budgetData.isCustomBudget,
                    customBudgetEndDate: budgetData.customBudgetEndDate,
                  } : undefined}
                  hasReview={budgetData.hasReview}
                  isProcessing={isProcessing}
                  isSelected={isSelected}
                  onProcess={onReviewClient}
                  onViewDetails={onViewDetails}
                  onSelect={toggleClientSelection}
                />
              );
            };

            return <ClientBudgetCalculation key={client.id} />;
          })}
        </div>
      )}
    </div>
  );
}
