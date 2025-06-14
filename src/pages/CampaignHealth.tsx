
import { useState, useEffect } from "react";
import { useActiveCampaignHealth } from "@/components/campaign-health/hooks/useActiveCampaignHealth";
import { useIntelligentAnalysis } from "@/components/campaign-health/hooks/useIntelligentAnalysis";
import { AlertsDashboard } from "@/components/campaign-health/AlertsDashboard";
import { IntelligentFilters } from "@/components/campaign-health/IntelligentFilters";
import { EnhancedHealthTable } from "@/components/campaign-health/EnhancedHealthTable";
import { CampaignStatus } from "@/components/campaign-health/types";
import { AlertLevel, HealthAlert } from "@/components/campaign-health/types/enhanced-types";
import { CampaignHealthService } from "@/components/campaign-health/services/campaignHealthService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function CampaignHealth() {
  const [urgencyFilter, setUrgencyFilter] = useState<AlertLevel | "all">("all");
  const [problemTypeFilter, setProblemTypeFilter] = useState<string>("all");
  const [systemStatus, setSystemStatus] = useState<any>(null);

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

  // Verificar status do sistema automatizado
  useEffect(() => {
    const checkSystemStatus = async () => {
      const status = await CampaignHealthService.checkAutomatedSystemStatus();
      setSystemStatus(status);
    };

    checkSystemStatus();
    // Verificar a cada 2 minutos
    const interval = setInterval(checkSystemStatus, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

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

  // Mapear dashboardStats para o formato esperado pelo IntelligentFilters (SEMPRE TOTAIS)
  const totalFilterStats = {
    critical: dashboardStats.criticalAlerts,
    high: dashboardStats.highAlerts,
    medium: dashboardStats.mediumAlerts,
    totalProblems: dashboardStats.criticalAlerts + dashboardStats.highAlerts + dashboardStats.mediumAlerts
  };

  // Renderizar status do sistema automatizado
  const renderSystemStatus = () => {
    if (!systemStatus) return null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'healthy': return 'bg-green-100 text-green-800 border-green-300';
        case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'critical': return 'bg-red-100 text-red-800 border-red-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'healthy': return '🟢';
        case 'warning': return '🟡';
        case 'critical': return '🔴';
        default: return '⚫';
      }
    };

    return (
      <Alert className={`mb-4 ${getStatusColor(systemStatus.systemStatus)}`}>
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getStatusIcon(systemStatus.systemStatus)}</span>
              <div>
                <div className="font-medium">
                  Sistema de Renovação Automática do Google Ads
                </div>
                <div className="text-sm">
                  {systemStatus.systemStatus === 'healthy' && (
                    `✅ Funcionando perfeitamente • Próxima renovação em ${systemStatus.nextRenewalIn} min`
                  )}
                  {systemStatus.systemStatus === 'warning' && (
                    `⚠️ Token não renovado há ${systemStatus.minutesSinceUpdate} min • Próxima tentativa em ${systemStatus.nextRenewalIn} min`
                  )}
                  {systemStatus.systemStatus === 'critical' && (
                    `🚨 Token não renovado há ${systemStatus.minutesSinceUpdate} min • Sistema pode estar com problemas`
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white">
                Renovação: 30min
              </Badge>
              <Badge variant="outline" className="bg-white">
                Verificação: 15min
              </Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header com indicação clara da data */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#321e32] mb-2">
            Monitoramento Inteligente de Campanhas
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
              📅 Dados de hoje: {formatTodayDate(todayDate)}
            </div>
            <span className="text-gray-600">
              • Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
            </span>
            {isManualRefreshing && (
              <span className="text-blue-600 font-medium">• Atualizando...</span>
            )}
          </div>
        </div>

        {/* Status do Sistema Automatizado */}
        {renderSystemStatus()}
        
        {/* Dashboard de Alertas - SEMPRE com dados completos (sem filtros) */}
        <AlertsDashboard 
          stats={dashboardStats}
          topAlerts={alerts.slice(0, 5)}
          onAlertClick={handleAlertClick}
        />
        
        {/* Filtros Inteligentes - Mostra SEMPRE os totais */}
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
        
        {/* Tabela Melhorada - APENAS esta seção é afetada pelos filtros */}
        <EnhancedHealthTable 
          data={filteredEnhancedData}
          isLoading={isLoading}
          error={error}
          handleAction={handleAction}
        />

        {/* Informações de Debug atualizadas */}
        {filteredEnhancedData.length > 0 && (
          <div className="mt-6 text-center text-xs text-gray-500">
            Mostrando {filteredEnhancedData.length} de {enhancedData.length} clientes • 
            {dashboardStats.criticalAlerts + dashboardStats.highAlerts + dashboardStats.mediumAlerts} problemas detectados • 
            <span className="font-medium text-green-600">
              Dados exclusivamente de hoje ({formatTodayDate(todayDate)}) • SISTEMA 100% AUTOMATIZADO
            </span>
            {isFetching && " • Atualizando..."}
          </div>
        )}
      </div>
    </div>
  );
}
