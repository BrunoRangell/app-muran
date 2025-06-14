
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, RefreshCw, Filter } from "lucide-react";
import { useActiveCampaignHealth } from "./hooks/useActiveCampaignHealth";
import { CampaignStatus } from "./types";

export function CompactHealthFilters() {
  const {
    filterValue,
    setFilterValue,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    handleRefresh,
    isFetching
  } = useActiveCampaignHealth();

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as CampaignStatus | "all");
  };

  const handlePlatformChange = (value: string) => {
    setPlatformFilter(value as 'meta' | 'google' | 'all');
  };

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          {/* Busca */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-9 h-9"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          </div>
          
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

          {/* Botão Atualizar */}
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
      </CardContent>
    </Card>
  );
}
