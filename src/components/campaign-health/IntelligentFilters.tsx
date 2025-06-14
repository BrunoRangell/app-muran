
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Filter, AlertTriangle, TrendingUp } from "lucide-react";
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
  statusFilter,
  setStatusFilter,
  platformFilter,
  setPlatformFilter,
  urgencyFilter,
  setUrgencyFilter,
  problemTypeFilter,
  setProblemTypeFilter,
  handleRefresh,
  isFetching,
  stats
}: IntelligentFiltersProps) {
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as CampaignStatus | "all");
  };

  const handlePlatformChange = (value: string) => {
    setPlatformFilter(value as 'meta' | 'google' | 'all');
  };

  const handleUrgencyChange = (value: string) => {
    setUrgencyFilter(value as AlertLevel | "all");
  };

  const handleProblemTypeChange = (value: string) => {
    setProblemTypeFilter(value);
  };

  const clearAllFilters = () => {
    setFilterValue("");
    setStatusFilter("all");
    setPlatformFilter("all");
    setUrgencyFilter("all");
    setProblemTypeFilter("all");
  };

  const hasActiveFilters = filterValue !== "" || 
                          statusFilter !== "all" || 
                          platformFilter !== "all" || 
                          urgencyFilter !== "all" || 
                          problemTypeFilter !== "all";

  return (
    <div className="space-y-4 mb-6">
      {/* Filtros Rápidos por Urgência */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={urgencyFilter === "critical" ? "destructive" : "outline"}
          size="sm"
          onClick={() => setUrgencyFilter(urgencyFilter === "critical" ? "all" : "critical")}
          className="h-8"
        >
          🚨 Crítico ({stats.critical})
        </Button>
        <Button
          variant={urgencyFilter === "high" ? "default" : "outline"}
          size="sm"
          onClick={() => setUrgencyFilter(urgencyFilter === "high" ? "all" : "high")}
          className="h-8 bg-orange-500 hover:bg-orange-600"
        >
          ⚠️ Alto ({stats.high})
        </Button>
        <Button
          variant={urgencyFilter === "medium" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setUrgencyFilter(urgencyFilter === "medium" ? "all" : "medium")}
          className="h-8"
        >
          ⚡ Médio ({stats.medium})
        </Button>
        <Button
          variant={urgencyFilter === "ok" ? "default" : "outline"}
          size="sm"
          onClick={() => setUrgencyFilter(urgencyFilter === "ok" ? "all" : "ok")}
          className="h-8 bg-green-500 hover:bg-green-600"
        >
          ✅ OK
        </Button>
      </div>

      {/* Filtros Detalhados */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            {/* Busca */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-9 h-9"
                value={filterValue}
                onChange={handleSearchChange}
              />
            </div>

            {/* Filtro por Tipo de Problema */}
            <Select value={problemTypeFilter} onValueChange={handleProblemTypeChange}>
              <SelectTrigger className="w-48 h-9">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo de Problema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="budget">💰 Orçamento</SelectItem>
                <SelectItem value="performance">📊 Performance</SelectItem>
                <SelectItem value="technical">🔧 Técnico</SelectItem>
                <SelectItem value="configuration">⚙️ Configuração</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Filtro de Status */}
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-44 h-9">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="funcionando">✅ Funcionando</SelectItem>
                <SelectItem value="sem-veiculacao">❌ Sem veiculação</SelectItem>
                <SelectItem value="sem-campanhas">⚠️ Sem campanhas</SelectItem>
                <SelectItem value="nao-configurado">➖ Não configurado</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Plataforma */}
            <Select value={platformFilter} onValueChange={handlePlatformChange}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="meta">Meta Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
              </SelectContent>
            </Select>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="h-9 px-3"
                >
                  Limpar
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isFetching}
                className="h-9 px-3"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </div>

          {/* Indicadores de Filtros Ativos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 mr-2">Filtros ativos:</span>
              {filterValue && <Badge variant="secondary" className="text-xs">🔍 "{filterValue}"</Badge>}
              {statusFilter !== "all" && <Badge variant="secondary" className="text-xs">Status: {statusFilter}</Badge>}
              {platformFilter !== "all" && <Badge variant="secondary" className="text-xs">Plataforma: {platformFilter}</Badge>}
              {urgencyFilter !== "all" && <Badge variant="secondary" className="text-xs">Urgência: {urgencyFilter}</Badge>}
              {problemTypeFilter !== "all" && <Badge variant="secondary" className="text-xs">Problema: {problemTypeFilter}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
