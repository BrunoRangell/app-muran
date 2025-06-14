
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
    stats,
    isManualRefreshing,
    todayDate
  } = useActiveCampaignHealth();

  const { enhancedData, alerts, dashboardStats } = useIntelligentAnalysis(data || []);

  // Aplicar filtros APENAS aos dados da tabela
  const filteredEnhancedData = enhancedData?.filter(client => {
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

    let matchesUrgency = true;
    if (urgencyFilter !== "all") {
      const metaMatch = client.metaAds?.alertLevel === urgencyFilter;
      const googleMatch = client.googleAds?.alertLevel === urgencyFilter;
      matchesUrgency = metaMatch || googleMatch;
    }

    let matchesProblemType = true;
    if (problemTypeFilter !== "all") {
      const metaProblems = client.metaAds?.problems || [];
      const googleProblems = client.googleAds?.problems || [];
      const allProblems = [...metaProblems, ...googleProblems];
      matchesProblemType = allProblems.some(problem => problem.type === problemTypeFilter);
    }
    
    return matchesName && matchesStatus && matchesPlatform && matchesUrgency && matchesProblemType;
  }) || [];

  const handleAlertClick = (alert: HealthAlert) => {
    console.log("🚨 Clique no alerta:", alert);
    handleAction('review', alert.clientId, alert.platform);
  };

  // Formatar data para exibição em português
  const formatTodayDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  // Mapear dashboardStats para o formato esperado pelo IntelligentFilters
  const totalFilterStats = {
    critical: dashboardStats.criticalAlerts,
    high: dashboardStats.highAlerts,
    medium: dashboardStats.mediumAlerts,
    totalProblems: dashboardStats.criticalAlerts + dashboardStats.highAlerts + dashboardStats.mediumAlerts
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header limpo */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#321e32] mb-2">
            Monitoramento de Campanhas
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
              📅 {formatTodayDate(todayDate)}
            </div>
            <span className="text-gray-600">
              • Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
            </span>
            {isManualRefreshing && (
              <span className="text-blue-600 font-medium">• Atualizando...</span>
            )}
          </div>
        </div>
        
        {/* Dashboard de Alertas */}
        <AlertsDashboard 
          stats={dashboardStats}
          topAlerts={alerts.slice(0, 5)}
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
          stats={totalFilterStats}
        />
        
        {/* Tabela */}
        <EnhancedHealthTable 
          data={filteredEnhancedData}
          isLoading={isLoading}
          error={error}
          handleAction={handleAction}
        />

        {/* Footer discreto */}
        {filteredEnhancedData.length > 0 && (
          <div className="mt-6 text-center text-xs text-gray-500">
            Mostrando {filteredEnhancedData.length} de {enhancedData.length} clientes • 
            {dashboardStats.criticalAlerts + dashboardStats.highAlerts + dashboardStats.mediumAlerts} problemas detectados
            {isFetching && " • Atualizando..."}
          </div>
        )}
      </div>
    </div>
  );
}
