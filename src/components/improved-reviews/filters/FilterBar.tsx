import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, LayoutGrid, List, Table2, Filter, RefreshCcw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
interface FilterBarProps {
  searchQuery: string;
  viewMode: string;
  showOnlyAdjustments: boolean;
  showWithoutAccount: boolean;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: "cards" | "table" | "list") => void;
  onAdjustmentFilterChange: (showAdjustments: boolean) => void;
  onAccountFilterChange: (showWithoutAccount: boolean) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  platform?: "meta" | "google";
}
export function FilterBar({
  searchQuery,
  viewMode,
  showOnlyAdjustments,
  showWithoutAccount,
  onSearchChange,
  onViewModeChange,
  onAdjustmentFilterChange,
  onAccountFilterChange,
  onRefresh,
  isRefreshing = false,
  platform = "meta"
}: FilterBarProps) {
  return <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input type="text" placeholder={`Buscar clientes ${platform === "meta" ? "Meta" : "Google"} Ads...`} className="pl-8" value={searchQuery} onChange={e => onSearchChange(e.target.value)} />
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Switch id="show-adjustments" checked={showOnlyAdjustments} onCheckedChange={onAdjustmentFilterChange} />
              <Label htmlFor="show-adjustments" className="text-sm">
                Necessitam ajustes
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="show-without-account" checked={showWithoutAccount} onCheckedChange={onAccountFilterChange} />
              <Label htmlFor="show-without-account" className="text-sm">
                Sem conta cadastrada
              </Label>
            </div>
            
            <ToggleGroup type="single" value={viewMode} onValueChange={value => value && onViewModeChange(value as any)}>
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
            
            {onRefresh}
          </div>
        </div>
      </CardContent>
    </Card>;
}