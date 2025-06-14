
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, RefreshCw, Filter, ChevronDown, X, Settings, AlertTriangle } from "lucide-react";
import { useState } from "react";
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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

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

  const activeFiltersCount = [
    filterValue !== "",
    statusFilter !== "all",
    platformFilter !== "all",
    urgencyFilter !== "all",
    problemTypeFilter !== "all"
  ].filter(Boolean).length;

  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case 'search':
        setFilterValue("");
        break;
      case 'status':
        setStatusFilter("all");
        break;
      case 'platform':
        setPlatformFilter("all");
        break;
      case 'urgency':
        setUrgencyFilter("all");
        break;
      case 'problemType':
        setProblemTypeFilter("all");
        break;
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Métricas de Urgência - Cards Informativos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
            urgencyFilter === "critical" 
              ? "border-red-200 bg-red-50 shadow-sm" 
              : "border-gray-200 hover:border-red-200"
          }`}
          onClick={() => setUrgencyFilter(urgencyFilter === "critical" ? "all" : "critical")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">Crítico</span>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
            urgencyFilter === "high" 
              ? "border-orange-200 bg-orange-50 shadow-sm" 
              : "border-gray-200 hover:border-orange-200"
          }`}
          onClick={() => setUrgencyFilter(urgencyFilter === "high" ? "all" : "high")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-gray-700">Alto</span>
                </div>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.high}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
            urgencyFilter === "medium" 
              ? "border-yellow-200 bg-yellow-50 shadow-sm" 
              : "border-gray-200 hover:border-yellow-200"
          }`}
          onClick={() => setUrgencyFilter(urgencyFilter === "medium" ? "all" : "medium")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-gray-700">Médio</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.medium}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
            urgencyFilter === "ok" 
              ? "border-green-200 bg-green-50 shadow-sm" 
              : "border-gray-200 hover:border-green-200"
          }`}
          onClick={() => setUrgencyFilter(urgencyFilter === "ok" ? "all" : "ok")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">Funcionando</span>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {/* Calcular OK dinamicamente se necessário */}
                  -
                </p>
              </div>
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção Principal - Busca e Ações */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Barra de Busca Principal */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nome do cliente..."
                className="pl-12 h-12 text-base border-gray-300 focus:border-[#ff6e00] focus:ring-[#ff6e00]"
                value={filterValue}
                onChange={handleSearchChange}
              />
            </div>

            {/* Ações e Filtros Rápidos */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-auto min-w-32 h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="funcionando">✅ Funcionando</SelectItem>
                    <SelectItem value="sem-veiculacao">❌ Sem veiculação</SelectItem>
                    <SelectItem value="sem-campanhas">⚠️ Sem campanhas</SelectItem>
                    <SelectItem value="nao-configurado">➖ Não configurado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={platformFilter} onValueChange={handlePlatformChange}>
                  <SelectTrigger className="w-auto min-w-32 h-10">
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="meta">Meta Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                  </SelectContent>
                </Select>

                <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="h-10">
                      <Settings className="w-4 h-4 mr-2" />
                      Filtros Avançados
                      <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              </div>

              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    onClick={clearAllFilters}
                    className="h-10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar Filtros
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isFetching}
                  className="h-10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  {isFetching ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </div>

            {/* Filtros Avançados Colapsáveis */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleContent className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros Avançados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select value={problemTypeFilter} onValueChange={handleProblemTypeChange}>
                      <SelectTrigger className="h-10">
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
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Filtros Ativos */}
      {hasActiveFilters && (
        <Card className="border-0 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}:
              </span>
              
              {filterValue && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="w-3 h-3" />
                  "{filterValue}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-gray-300"
                    onClick={() => removeFilter('search')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="w-3 h-3" />
                  Status: {statusFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-gray-300"
                    onClick={() => removeFilter('status')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              
              {platformFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Plataforma: {platformFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-gray-300"
                    onClick={() => removeFilter('platform')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              
              {urgencyFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Urgência: {urgencyFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-gray-300"
                    onClick={() => removeFilter('urgency')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              
              {problemTypeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Problema: {problemTypeFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-gray-300"
                    onClick={() => removeFilter('problemType')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo dos Resultados */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {stats.totalProblems > 0 ? (
            <>
              <span className="font-medium text-[#ff6e00]">{stats.totalProblems} problemas</span>
              {" encontrados • "}
              <span className="font-medium">{stats.critical}</span> críticos, {" "}
              <span className="font-medium">{stats.high}</span> altos, {" "}
              <span className="font-medium">{stats.medium}</span> médios
            </>
          ) : (
            "Nenhum problema encontrado com os filtros aplicados"
          )}
        </p>
      </div>
    </div>
  );
}
