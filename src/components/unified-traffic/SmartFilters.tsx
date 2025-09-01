import { Search, Filter, AlertTriangle, DollarSign, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface FilterState {
  urgency: "all" | "critical" | "high" | "medium" | "ok";
  platform: "all" | "meta" | "google" | "both";
  problemType: "all" | "balance" | "performance" | "configuration" | "spending";
  clientSearch: string;
}

interface SmartFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const SmartFilters = ({ filters, onFiltersChange }: SmartFiltersProps) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      urgency: "all",
      platform: "all", 
      problemType: "all",
      clientSearch: ""
    });
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value, index) => index === 3 ? value !== "" : value !== "all"
  ).length;

  return (
    <div className="bg-white rounded-xl border border-muran-secondary/20 shadow-sm p-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Busca de Cliente */}
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muran-dark/40" />
          <Input
            placeholder="Buscar cliente..."
            value={filters.clientSearch}
            onChange={(e) => updateFilter("clientSearch", e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro de Urgência */}
        <Select value={filters.urgency} onValueChange={(value) => updateFilter("urgency", value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Urgência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Crítico
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                Alto
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Médio
              </div>
            </SelectItem>
            <SelectItem value="ok">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Tudo OK
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de Plataforma */}
        <Select value={filters.platform} onValueChange={(value) => updateFilter("platform", value)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="meta">Meta Ads</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
            <SelectItem value="both">Ambas</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de Tipo de Problema */}
        <Select value={filters.problemType} onValueChange={(value) => updateFilter("problemType", value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="balance">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3" />
                Saldo
              </div>
            </SelectItem>
            <SelectItem value="performance">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3 h-3" />
                Performance
              </div>
            </SelectItem>
            <SelectItem value="configuration">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Configuração
              </div>
            </SelectItem>
            <SelectItem value="spending">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3 h-3" />
                Gastos
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Botão de Limpar Filtros */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <Filter className="w-3 h-3" />
            Limpar
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
};