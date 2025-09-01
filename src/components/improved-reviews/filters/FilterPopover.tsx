import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Filter, X } from "lucide-react";

interface FilterPopoverProps {
  showOnlyAdjustments: boolean;
  showWithoutAccount: boolean;
  showOnlyPrepaid: boolean;
  showCampaignProblems: boolean;
  sortByBalance: boolean;
  onAdjustmentFilterChange: (value: boolean) => void;
  onAccountFilterChange: (value: boolean) => void;
  onPrepaidFilterChange: (value: boolean) => void;
  onCampaignProblemsFilterChange: (value: boolean) => void;
  onSortByBalanceChange: (value: boolean) => void;
  onClearAllFilters: () => void;
}

export function FilterPopover({
  showOnlyAdjustments,
  showWithoutAccount,
  showOnlyPrepaid,
  showCampaignProblems,
  sortByBalance,
  onAdjustmentFilterChange,
  onAccountFilterChange,
  onPrepaidFilterChange,
  onCampaignProblemsFilterChange,
  onSortByBalanceChange,
  onClearAllFilters
}: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Contar filtros ativos
  const activeFiltersCount = [
    showOnlyAdjustments,
    showWithoutAccount,
    showOnlyPrepaid,
    showCampaignProblems,
    sortByBalance
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtros Avançados</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAllFilters}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar tudo
              </Button>
            )}
          </div>

          <Separator />

          {/* Estado das Contas */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Estado das Contas</h5>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="adjustment-filter"
                checked={showOnlyAdjustments}
                onCheckedChange={onAdjustmentFilterChange}
              />
              <Label htmlFor="adjustment-filter" className="text-sm">
                Necessitam ajustes de orçamento
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="account-filter"
                checked={showWithoutAccount}
                onCheckedChange={onAccountFilterChange}
              />
              <Label htmlFor="account-filter" className="text-sm">
                Sem conta cadastrada
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="prepaid-filter"
                checked={showOnlyPrepaid}
                onCheckedChange={onPrepaidFilterChange}
              />
              <Label htmlFor="prepaid-filter" className="text-sm">
                Apenas contas pré-pagas
              </Label>
            </div>
          </div>

          <Separator />

          {/* Problemas de Campanhas */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Campanhas</h5>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="campaign-problems-filter"
                checked={showCampaignProblems}
                onCheckedChange={onCampaignProblemsFilterChange}
              />
              <Label htmlFor="campaign-problems-filter" className="text-sm">
                Com problemas de veiculação
              </Label>
            </div>
          </div>

          <Separator />

          {/* Ordenação */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Ordenação</h5>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="balance-sort"
                checked={sortByBalance}
                onCheckedChange={onSortByBalanceChange}
              />
              <Label htmlFor="balance-sort" className="text-sm">
                Pré-pagas com menor saldo primeiro
              </Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}