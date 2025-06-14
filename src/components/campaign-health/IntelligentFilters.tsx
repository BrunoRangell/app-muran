
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import { CampaignStatus } from "./types";
import { AlertLevel } from "./types/enhanced-types";

interface IntelligentFiltersProps {
  filterValue: string;
  setFilterValue: (value: string) => void;
  statusFilter: CampaignStatus | "all";
  setStatusFilter: (value: CampaignStatus | "all") => void;
  platformFilter: 'meta' | 'google' | 'all';
  setPlatformFilter: (value: 'meta' | 'google' | 'all') => void;
  urgencyFilter: AlertLevel | "all";
  setUrgencyFilter: (value: AlertLevel | "all") => void;
  problemTypeFilter: string;
  setProblemTypeFilter: (value: string) => void;
  handleRefresh: () => void;
  isFetching: boolean;
  stats: {
    critical: number;
    high: number;
    medium: number;
    totalProblems: number;
  };
}

export function IntelligentFilters({
  filterValue,
  setFilterValue,
  urgencyFilter,
  setUrgencyFilter,
  handleRefresh,
  isFetching,
  stats
}: IntelligentFiltersProps) {
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(e.target.value);
  };

  const handleUrgencyChange = (value: string) => {
    setUrgencyFilter(value as AlertLevel | "all");
  };

  return (
    <div className="mb-8">
      {/* Filtros Simplificados */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        
        {/* Busca de Cliente */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-12 h-12 text-base border-gray-300 focus:border-[#ff6e00] focus:ring-[#ff6e00] rounded-lg"
            value={filterValue}
            onChange={handleSearchChange}
          />
        </div>

        {/* Filtros Centrais */}
        <div className="flex gap-4 items-center">
          {/* Filtro por Urgência */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Urgência</label>
            <Select value={urgencyFilter} onValueChange={handleUrgencyChange}>
              <SelectTrigger className="w-48 h-12 border-gray-300 focus:border-[#ff6e00] focus:ring-[#ff6e00] rounded-lg">
                <SelectValue placeholder="Todas as urgências" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="all" className="text-gray-700">
                  Todas ({stats.totalProblems})
                </SelectItem>
                <SelectItem value="critical" className="text-red-600 font-medium">
                  🚨 Crítico ({stats.critical})
                </SelectItem>
                <SelectItem value="high" className="text-orange-600 font-medium">
                  ⚠️ Alto ({stats.high})
                </SelectItem>
                <SelectItem value="medium" className="text-yellow-600 font-medium">
                  ⚡ Médio ({stats.medium})
                </SelectItem>
                <SelectItem value="ok" className="text-green-600 font-medium">
                  ✅ OK
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botão Atualizar */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1 opacity-0">Ação</label>
            <Button 
              onClick={handleRefresh}
              disabled={isFetching}
              className="h-12 px-6 bg-[#ff6e00] hover:bg-[#e55a00] text-white border-0 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
