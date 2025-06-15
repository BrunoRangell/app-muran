
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw, Loader2 } from "lucide-react";
import { useActiveCampaignHealth } from "./hooks/useActiveCampaignHealth";
import { CampaignStatus } from "./types";
import { HealthStatsOverview } from "./HealthStatsOverview";

export function ImprovedHealthFilters() {
  const {
    filterValue,
    setFilterValue,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    stats,
    handleRefresh,
    isFetching,
    lastRefreshTimestamp
  } = useActiveCampaignHealth();

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as CampaignStatus | "all");
  };

  const handlePlatformChange = (value: string) => {
    setPlatformFilter(value as 'meta' | 'google' | 'all');
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Estatísticas Overview */}
      <HealthStatsOverview stats={stats} />

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Busca */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar cliente..."
              className="pl-10 h-11"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          </div>
          
          {/* Filtro de Status */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full lg:w-48 h-11">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="funcionando">🟢 Funcionando</SelectItem>
              <SelectItem value="sem-veiculacao">🔴 Sem veiculação</SelectItem>
              <SelectItem value="sem-campanhas">⚪ Sem campanhas</SelectItem>
              <SelectItem value="nao-configurado">⚫ Não configurado</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Plataforma */}
          <Select value={platformFilter} onValueChange={handlePlatformChange}>
            <SelectTrigger className="w-full lg:w-40 h-11">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="meta">📘 Meta Ads</SelectItem>
              <SelectItem value="google">🔍 Google Ads</SelectItem>
            </SelectContent>
          </Select>

          {/* Botão Atualizar */}
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isFetching}
            className="w-full lg:w-auto h-11 px-6"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        {/* Informação da última atualização */}
        <div className="text-xs text-gray-500 mt-4 text-center">
          Dados atualizados automaticamente a cada 10 minutos • 
          Última atualização: {lastRefreshTimestamp > 0 ? new Date(lastRefreshTimestamp).toLocaleTimeString('pt-BR') : 'Carregando...'}
          {isFetching && " • Atualizando..."}
        </div>
      </div>
    </div>
  );
}
