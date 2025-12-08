import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Calculator, Settings, Users, AlertTriangle, DollarSign } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface FilterBarProps {
  searchQuery: string;
  activeFilter?: string;
  showWithoutAccount: boolean;
  budgetCalculationMode?: "weighted" | "current";
  onSearchChange: (query: string) => void;
  onActiveFilterChange?: (filter: string) => void;
  onAccountFilterChange: (showWithoutAccount: boolean) => void;
  onBudgetCalculationModeChange?: (mode: "weighted" | "current") => void;
  platform?: "meta" | "google";
}

export function FilterBar({
  searchQuery,
  activeFilter = "",
  showWithoutAccount,
  budgetCalculationMode,
  onSearchChange,
  onActiveFilterChange,
  onAccountFilterChange,
  onBudgetCalculationModeChange,
  platform = "meta"
}: FilterBarProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Primeira linha: Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder={`Buscar clientes ${platform === "meta" ? "Meta" : "Google"} Ads...`} 
              className="pl-8" 
              value={searchQuery} 
              onChange={e => onSearchChange(e.target.value)} 
            />
          </div>

          {/* Segunda linha: Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filtros para Meta Ads */}
            {platform === "meta" && (
              <>
                {onActiveFilterChange && (
                  <ToggleGroup 
                    type="single" 
                    value={activeFilter} 
                    onValueChange={value => onActiveFilterChange(value || "")}
                    className="h-8"
                  >
                    <ToggleGroupItem 
                      value="adjustments" 
                      className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
                    >
                      <Settings className="h-3 w-3" />
                      Ajuste de orçamento
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="campaigns" 
                      className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Campanhas com problemas
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="balance" 
                      className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
                    >
                      <DollarSign className="h-3 w-3" />
                      Saldo disponível baixo
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="without-account" 
                      className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
                    >
                      <Users className="h-3 w-3" />
                      Sem conta cadastrada
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              </>
            )}

            {/* Filtros para Google Ads */}
            {platform === "google" && (
              <>
                {onActiveFilterChange && (
                  <ToggleGroup 
                    type="single" 
                    value={activeFilter} 
                    onValueChange={value => onActiveFilterChange(value || "")}
                    className="h-8"
                  >
                    <ToggleGroupItem 
                      value="adjustments" 
                      className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
                    >
                      <Settings className="h-3 w-3" />
                      Ajuste de orçamento
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="campaigns" 
                      className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Campanhas com problemas
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="without-account" 
                      className="h-8 px-3 text-xs gap-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md"
                    >
                      <Users className="h-3 w-3" />
                      Sem conta cadastrada
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}

                {/* Cálculo de Orçamento */}
                {onBudgetCalculationModeChange && (
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
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}