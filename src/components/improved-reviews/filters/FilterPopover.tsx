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
  showOnlyPrepaid: boolean;
  showCampaignProblems: boolean;
  sortByBalance: boolean;
  onPrepaidFilterChange: (value: boolean) => void;
  onCampaignProblemsFilterChange: (value: boolean) => void;
  onSortByBalanceChange: (value: boolean) => void;
  onClearAllFilters: () => void;
}

export function FilterPopover({
  showOnlyPrepaid,
  showCampaignProblems,
  sortByBalance,
  onPrepaidFilterChange,
  onCampaignProblemsFilterChange,
  onSortByBalanceChange,
  onClearAllFilters
}: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Contar filtros secundários ativos
  const activeFiltersCount = [
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
          className="relative flex items-center gap-1 h-8 px-3 text-xs"
        >
          <Filter className="h-3 w-3" />
          Mais filtros
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtros Adicionais</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAllFilters}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <Separator />

          {/* Filtros Secundários */}
          <div className="space-y-2">
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

            <div className="flex items-center space-x-2">
              <Switch 
                id="campaign-problems-filter"
                checked={showCampaignProblems}
                onCheckedChange={onCampaignProblemsFilterChange}
              />
              <Label htmlFor="campaign-problems-filter" className="text-sm">
                Com problemas de campanhas
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="balance-sort"
                checked={sortByBalance}
                onCheckedChange={onSortByBalanceChange}
              />
              <Label htmlFor="balance-sort" className="text-sm">
                Ordenar pré-pagas por saldo
              </Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}