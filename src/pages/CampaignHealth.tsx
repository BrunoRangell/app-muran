
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

  // Aplicar filtros APENAS aos dados da tabela
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

    // Novos filtros de urgência - APENAS para a tabela
    let matchesUrgency = true;
    if (urgencyFilter !== "all") {
      const metaMatch = client.metaAds?.alertLevel === urgencyFilter;
      const googleMatch = client.googleAds?.alertLevel === urgencyFilter;
      matchesUrgency = metaMatch || googleMatch;
    }

    // Filtro por tipo de problema - APENAS para a tabela
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
    // Redirecionar para o cliente específico com foco no problema
    handleAction('review', alert.clientId, alert.platform);
  };

  // Estatísticas para os filtros da tabela (apenas informativa nos filtros)
  const filteredStats = {
    critical: filteredEnhancedData.reduce((acc, client) => {
      const metaCritical = client.metaAds?.alertLevel === "critical" ? 1 : 0;
      const googleCritical = client.googleAds?.alertLevel === "critical" ? 1 : 0;
      return acc + metaCritical + googleCritical;
    }, 0),
    high: filteredEnhancedData.reduce((acc, client) => {
      const metaHigh = client.metaAds?.alertLevel === "high" ? 1 : 0;
      const googleHigh = client.googleAds?.alertLevel === "high" ? 1 : 0;
      return acc + metaHigh + googleHigh;
    }, 0),
    medium: filteredEnhancedData.reduce((acc, client) => {
      const metaMedium = client.metaAds?.alertLevel === "medium" ? 1 : 0;
      const googleMedium = client.googleAds?.alertLevel === "medium" ? 1 : 0;
      return acc + metaMedium + googleMedium;
    }, 0),
    totalProblems: 0 // Calculado abaixo
  };
  
  filteredStats.totalProblems = filteredStats.critical + filteredStats.high + filteredStats.medium;

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
        
        {/* Dashboard de Alertas - SEMPRE com dados completos (sem filtros) */}
        <AlertsDashboard 
          stats={dashboardStats}
          topAlerts={alerts.slice(0, 5)}
          onAlertClick={handleAlertClick}
        />
        
        {/* Filtros Inteligentes - Mostra estatísticas filtradas apenas como informação */}
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
          stats={filteredStats}
        />
        
        {/* Tabela Melhorada - APENAS esta seção é afetada pelos filtros */}
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
            {dashboardStats.criticalAlerts + dashboardStats.highAlerts + dashboardStats.mediumAlerts} problemas detectados no total • 
            Dados atualizados automaticamente a cada 10 minutos
            {isFetching && " • Atualizando..."}
          </div>
        )}
      </div>
    </div>
  );
}
