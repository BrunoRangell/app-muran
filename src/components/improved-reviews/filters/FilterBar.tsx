import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Calculator, Settings, Users, AlertTriangle, DollarSign } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface FilterBarProps {
  searchQuery: string;
  showOnlyAdjustments: boolean;
  showWithoutAccount: boolean;
  showCampaignProblems?: boolean;
  sortByBalance?: boolean;
  budgetCalculationMode?: "weighted" | "current";
  onSearchChange: (query: string) => void;
  onAdjustmentFilterChange: (showAdjustments: boolean) => void;
  onAccountFilterChange: (showWithoutAccount: boolean) => void;
  onCampaignProblemsFilterChange?: (showCampaignProblems: boolean) => void;
  onSortByBalanceChange?: (sortByBalance: boolean) => void;
  onBudgetCalculationModeChange?: (mode: "weighted" | "current") => void;
  platform?: "meta" | "google";
}

export function FilterBar({
  searchQuery,
  showOnlyAdjustments,
  showWithoutAccount,
  showCampaignProblems = false,
  sortByBalance = false,
  budgetCalculationMode,
  onSearchChange,
  onAdjustmentFilterChange,
  onAccountFilterChange,
  onCampaignProblemsFilterChange,
  onSortByBalanceChange,
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
                <Button
                  variant={showOnlyAdjustments ? "default" : "outline"}
                  size="sm"
                  onClick={() => onAdjustmentFilterChange(!showOnlyAdjustments)}
                  className="h-8 px-3 text-xs gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Necessitam ajustes
                  {showOnlyAdjustments && (
                    <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">✓</Badge>
                  )}
                </Button>
                
                <Button
                  variant={showWithoutAccount ? "default" : "outline"}
                  size="sm"
                  onClick={() => onAccountFilterChange(!showWithoutAccount)}
                  className="h-8 px-3 text-xs gap-1"
                >
                  <Users className="h-3 w-3" />
                  Sem conta
                  {showWithoutAccount && (
                    <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">✓</Badge>
                  )}
                </Button>

                {onCampaignProblemsFilterChange && (
                  <Button
                    variant={showCampaignProblems ? "default" : "outline"}
                    size="sm"
                    onClick={() => onCampaignProblemsFilterChange(!showCampaignProblems)}
                    className="h-8 px-3 text-xs gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Com problemas de veiculação
                    {showCampaignProblems && (
                      <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">✓</Badge>
                    )}
                  </Button>
                )}

                {onSortByBalanceChange && (
                  <Button
                    variant={sortByBalance ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSortByBalanceChange(!sortByBalance)}
                    className="h-8 px-3 text-xs gap-1"
                  >
                    <DollarSign className="h-3 w-3" />
                    Ordenar pré-pagas por saldo
                    {sortByBalance && (
                      <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">✓</Badge>
                    )}
                  </Button>
                )}
              </>
            )}

            {/* Filtros para Google Ads */}
            {platform === "google" && (
              <>
                <Button
                  variant={showOnlyAdjustments ? "default" : "outline"}
                  size="sm"
                  onClick={() => onAdjustmentFilterChange(!showOnlyAdjustments)}
                  className="h-8 px-3 text-xs gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Necessitam ajustes
                  {showOnlyAdjustments && (
                    <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">✓</Badge>
                  )}
                </Button>
                
                <Button
                  variant={showWithoutAccount ? "default" : "outline"}
                  size="sm"
                  onClick={() => onAccountFilterChange(!showWithoutAccount)}
                  className="h-8 px-3 text-xs gap-1"
                >
                  <Users className="h-3 w-3" />
                  Sem conta
                  {showWithoutAccount && (
                    <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">✓</Badge>
                  )}
                </Button>

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