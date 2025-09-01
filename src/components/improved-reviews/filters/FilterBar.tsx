
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, LayoutGrid, List, Table2, RefreshCcw, TrendingUp, Calculator } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FilterPopover } from "./FilterPopover";

interface FilterBarProps {
  searchQuery: string;
  viewMode: string;
  showOnlyAdjustments: boolean;
  showWithoutAccount: boolean;
  showOnlyPrepaid?: boolean;
  showCampaignProblems?: boolean;
  sortByBalance?: boolean;
  budgetCalculationMode?: "weighted" | "current";
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: "cards" | "table" | "list") => void;
  onAdjustmentFilterChange: (showAdjustments: boolean) => void;
  onAccountFilterChange: (showWithoutAccount: boolean) => void;
  onPrepaidFilterChange?: (showOnlyPrepaid: boolean) => void;
  onCampaignProblemsFilterChange?: (showCampaignProblems: boolean) => void;
  onSortByBalanceChange?: (sortByBalance: boolean) => void;
  onClearAllFilters?: () => void;
  onBudgetCalculationModeChange?: (mode: "weighted" | "current") => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  platform?: "meta" | "google";
}

export function FilterBar({
  searchQuery,
  viewMode,
  showOnlyAdjustments,
  showWithoutAccount,
  showOnlyPrepaid = false,
  showCampaignProblems = false,
  sortByBalance = false,
  budgetCalculationMode,
  onSearchChange,
  onViewModeChange,
  onAdjustmentFilterChange,
  onAccountFilterChange,
  onPrepaidFilterChange,
  onCampaignProblemsFilterChange,
  onSortByBalanceChange,
  onClearAllFilters,
  onBudgetCalculationModeChange,
  onRefresh,
  isRefreshing = false,
  platform = "meta"
}: FilterBarProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              type="text" 
              placeholder={`Buscar clientes ${platform === "meta" ? "Meta" : "Google"} Ads...`} 
              className="pl-8" 
              value={searchQuery} 
              onChange={e => onSearchChange(e.target.value)} 
            />
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            {/* Filtros Avançados para Meta Ads */}
            {platform === "meta" && onPrepaidFilterChange && onCampaignProblemsFilterChange && onSortByBalanceChange && onClearAllFilters && (
              <FilterPopover
                showOnlyAdjustments={showOnlyAdjustments}
                showWithoutAccount={showWithoutAccount}
                showOnlyPrepaid={showOnlyPrepaid}
                showCampaignProblems={showCampaignProblems}
                sortByBalance={sortByBalance}
                onAdjustmentFilterChange={onAdjustmentFilterChange}
                onAccountFilterChange={onAccountFilterChange}
                onPrepaidFilterChange={onPrepaidFilterChange}
                onCampaignProblemsFilterChange={onCampaignProblemsFilterChange}
                onSortByBalanceChange={onSortByBalanceChange}
                onClearAllFilters={onClearAllFilters}
              />
            )}
            
            {/* Cálculo de Orçamento para Google Ads */}
            {platform === "google" && onBudgetCalculationModeChange && (
              <div className="flex items-center space-x-2">
                <Label className="text-sm text-muted-foreground">Base de cálculo:</Label>
                <ToggleGroup 
                  type="single" 
                  value={budgetCalculationMode || "weighted"} 
                  onValueChange={value => value && onBudgetCalculationModeChange(value as "weighted" | "current")}
                  className="h-8"
                >
                  <ToggleGroupItem value="weighted" className="h-8 px-3 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Média Pond
                  </ToggleGroupItem>
                  <ToggleGroupItem value="current" className="h-8 px-3 text-xs">
                    <Calculator className="h-3 w-3 mr-1" />
                    Orç. atual
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
            
            {/* Modos de Visualização */}
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={value => value && onViewModeChange(value as any)}
            >
              <ToggleGroupItem value="cards" aria-label="Ver como cards">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Ver como lista">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Ver como tabela">
                <Table2 className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            
            {/* Botão de Atualizar */}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
