
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { useActiveCampaignHealth } from "./hooks/useActiveCampaignHealth";

export function NewHealthFilters() {
  const {
    filterValue,
    setFilterValue,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    stats
  } = useActiveCampaignHealth();

  // Wrapper functions para fazer cast correto dos tipos
  const handleStatusChange = (value: string) => {
    setStatusFilter(value as typeof statusFilter);
  };

  const handlePlatformChange = (value: string) => {
    setPlatformFilter(value as typeof platformFilter);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Estatísticas rápidas */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="px-3 py-1">
          Total: {stats.totalClients} clientes
        </Badge>
        <Badge variant="default" className="px-3 py-1 bg-green-500">
          🟢 Funcionando: {stats.functioning}
        </Badge>
        <Badge variant="destructive" className="px-3 py-1">
          🔴 Sem veiculação: {stats.noSpend}
        </Badge>
        <Badge variant="secondary" className="px-3 py-1">
          ⚪ Sem campanhas: {stats.noCampaigns}
        </Badge>
        <Badge variant="outline" className="px-3 py-1">
          ⚫ Não configurado: {stats.notConfigured}
        </Badge>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar cliente..."
            className="pl-10"
            value={filterValue}
            onChange={e => setFilterValue(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-48">
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

        <Select value={platformFilter} onValueChange={handlePlatformChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="meta">Meta Ads</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
