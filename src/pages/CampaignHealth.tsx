
import { useState } from "react";
import { useActiveCampaignHealth } from "@/components/campaign-health/hooks/useActiveCampaignHealth";
import { useIntelligentAnalysis } from "@/components/campaign-health/hooks/useIntelligentAnalysis";
import { AlertsDashboard } from "@/components/campaign-health/AlertsDashboard";
import { IntelligentFilters } from "@/components/campaign-health/IntelligentFilters";
import { EnhancedHealthTable } from "@/components/campaign-health/EnhancedHealthTable";
import { CampaignStatus } from "@/components/campaign-health/types";
import { AlertLevel, HealthAlert } from "@/components/campaign-health/types/enhanced-types";

export default function CampaignHealth() {
  const [urgencyFilter, setUrgencyFilter] = useState<AlertLevel | "all">("all");
  const [problemTypeFilter, setProblemTypeFilter] = useState<string>("all");

  const {
    data,
    isLoading,
    isFetching,
    error,
    filterValue,
    setFilterValue,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    handleAction,
    handleRefresh,
    lastRefresh,
    stats
  } = useActiveCampaignHealth();

  const { enhancedData, alerts, dashboardStats } = useIntelligentAnalysis(data || []);

  // Aplicar filtros adicionais aos dados analisados
  const filteredEnhancedData = enhancedData?.filter(client => {
    // Filtros existentes (já aplicados no hook)
    const matchesName = filterValue === "" || 
      client.clientName.toLowerCase().includes(filterValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || client.overallStatus === statusFilter;
    
    let matchesPlatform = true;
    if (platformFilter !== "all") {
      if (platformFilter === "meta") {
        matchesPlatform = !!client.metaAds;
      } else if (platformFilter === "google") {
        matchesPlatform = !!client.googleAds;
      }
    }

    // Novos filtros de urgência
    let matchesUrgency = true;
    if (urgencyFilter !== "all") {
      const metaMatch = client.metaAds?.alertLevel === urgencyFilter;
      const googleMatch = client.googleAds?.alertLevel === urgencyFilter;
      matchesUrgency = metaMatch || googleMatch;
    }

    // Filtro por tipo de problema
    let matchesProblemType = true;
    if (problemTypeFilter !== "all") {
      const metaProblems = client.metaAds?.problems || [];
      const googleProblems = client.googleAds?.problems || [];
      const allProblems = [...metaProblems, ...googleProblems];
      matchesProblemType = allProblems.some(problem => problem.type === problemTypeFilter);
    }
    
    return matchesName && matchesStatus && matchesPlatform && matchesUrgency && matchesProblemType;
  }) || [];

  // Filtrar alertas com base nos filtros ativos
  const filteredAlerts = alerts.filter(alert => {
    if (urgencyFilter !== "all" && alert.severity !== urgencyFilter) return false;
    if (problemTypeFilter !== "all") {
      // Buscar o cliente correspondente para verificar o tipo de problema
      const client = enhancedData.find(c => c.clientId === alert.clientId);
      const platform = alert.platform === 'meta' ? client?.metaAds : client?.googleAds;
      const hasMatchingProblem = platform?.problems.some(p => p.type === problemTypeFilter);
      if (!hasMatchingProblem) return false;
    }
    return true;
  });

  const handleAlertClick = (alert: HealthAlert) => {
    console.log("🚨 Clique no alerta:", alert);
    // Redirecionar para o cliente específico com foco no problema
    handleAction('review', alert.clientId, alert.platform);
  };

  // Estatísticas para filtros
  const filterStats = {
    critical: alerts.filter(a => a.severity === "critical").length,
    high: alerts.filter(a => a.severity === "high").length,
    medium: alerts.filter(a => a.severity === "medium").length,
    totalProblems: alerts.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Simplificado */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#321e32] mb-2">
            Monitoramento Inteligente de Campanhas
          </h1>
          <p className="text-gray-600 text-sm">
            Diagnóstico em tempo real com ações prioritárias • Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        {/* Dashboard de Alertas */}
        <AlertsDashboard 
          stats={dashboardStats}
          topAlerts={filteredAlerts.slice(0, 5)}
          onAlertClick={handleAlertClick}
        />
        
        {/* Filtros Inteligentes */}
        <IntelligentFilters 
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
          urgencyFilter={urgencyFilter}
          setUrgencyFilter={setUrgencyFilter}
          problemTypeFilter={problemTypeFilter}
          setProblemTypeFilter={setProblemTypeFilter}
          handleRefresh={handleRefresh}
          isFetching={isFetching}
          stats={filterStats}
        />
        
        {/* Tabela Melhorada */}
        <EnhancedHealthTable 
          data={filteredEnhancedData}
          isLoading={isLoading}
          error={error}
          handleAction={handleAction}
        />

        {/* Informações de Debug */}
        {filteredEnhancedData.length > 0 && (
          <div className="mt-6 text-center text-xs text-gray-500">
            Mostrando {filteredEnhancedData.length} de {enhancedData.length} clientes • 
            {filterStats.totalProblems} problemas detectados • 
            Dados atualizados automaticamente a cada 10 minutos
            {isFetching && " • Atualizando..."}
          </div>
        )}
      </div>
    </div>
  );
}
