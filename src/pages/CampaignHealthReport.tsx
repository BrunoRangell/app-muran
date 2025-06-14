
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, Filter, Download } from "lucide-react";
import { HealthTable } from "@/components/campaign-health/HealthTable";
import { HealthFilters } from "@/components/campaign-health/HealthFilters";
import { HealthMetrics } from "@/components/campaign-health/HealthMetrics";
import { useCampaignHealthData } from "@/components/campaign-health/hooks/useCampaignHealthData";

export default function CampaignHealthReport() {
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "meta" | "google">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "problems" | "normal">("all");
  
  const { 
    data, 
    isLoading, 
    error, 
    metrics,
    refreshData,
    lastUpdated 
  } = useCampaignHealthData();

  const handleRefresh = () => {
    refreshData();
  };

  const handleExport = () => {
    // Implementar exportação CSV
    console.log("Exportando dados para CSV...");
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#321e32]">
            Relatório de Saúde das Campanhas
          </h1>
          <p className="text-gray-600 mt-1">
            Visão geral do status de execução das campanhas de hoje
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Resumo */}
      <HealthMetrics metrics={metrics} isLoading={isLoading} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <HealthFilters
              platformFilter={platformFilter}
              statusFilter={statusFilter}
              onPlatformChange={setPlatformFilter}
              onStatusChange={setStatusFilter}
            />
          </div>
          
          {lastUpdated && (
            <div className="mt-3 text-sm text-gray-500">
              Última atualização: {new Date(lastUpdated).toLocaleString('pt-BR')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Status */}
      <HealthTable
        data={data}
        isLoading={isLoading}
        error={error}
        searchQuery={searchQuery}
        platformFilter={platformFilter}
        statusFilter={statusFilter}
      />
    </div>
  );
}
