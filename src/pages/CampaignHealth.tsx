
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveCampaignHealth } from "@/components/campaign-health/hooks/useActiveCampaignHealth";
import { useIntelligentAnalysis } from "@/components/campaign-health/hooks/useIntelligentAnalysis";
import { AlertsDashboard } from "@/components/campaign-health/AlertsDashboard";
import { IntelligentFilters } from "@/components/campaign-health/IntelligentFilters";
import { EnhancedHealthTable } from "@/components/campaign-health/EnhancedHealthTable";
import { HealthProgressBar } from "@/components/campaign-health/HealthProgressBar";
import { TeamMemberCheck } from "@/components/auth/TeamMemberCheck";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import { CampaignStatus } from "@/components/campaign-health/types";
import { AlertLevel, HealthAlert } from "@/components/campaign-health/types/enhanced-types";
import { formatDateForDisplay } from "@/utils/brazilTimezone";
import { buildPlatformUrl } from "@/utils/platformUrls";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CampaignHealth() {
  const navigate = useNavigate();
  const [urgencyFilter, setUrgencyFilter] = useState<AlertLevel | "all">("all");
  const [problemTypeFilter, setProblemTypeFilter] = useState<string>("all");
  const [isGeneralUpdating, setIsGeneralUpdating] = useState(false);

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
    handleRefresh,
    lastRefreshTimestamp,
    stats,
    isManualRefreshing,
    refreshProgress,
    todayDate
  } = useActiveCampaignHealth();

  const { enhancedData, alerts, dashboardStats } = useIntelligentAnalysis(data || []);

  console.log("🔍 CampaignHealth - Estado atual:", {
    dataLength: data?.length || 0,
    enhancedDataLength: enhancedData?.length || 0,
    isLoading,
    error: error,
    stats,
    timestamp: new Date().toISOString()
  });

  const handlePlatformAction = (action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') => {
    if (action === 'configure') {
      navigate('/revisao-diaria-avancada#budgets');
      return;
    }

    const client = enhancedData.find(c => c.clientId === clientId);
    if (!client) {
      console.error("Cliente não encontrado para a ação:", clientId);
      return;
    }

    const platformData = platform === 'meta' ? client.metaAds : client.googleAds;
    const firstAccount = platformData && platformData.length > 0 ? platformData[0] : null;
    const accountId = firstAccount?.accountId;

    const url = buildPlatformUrl(platform, accountId);
    
    if (url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      console.error(`Não foi possível gerar URL para ${platform} com ID ${accountId}`);
    }
  };

  // Aplicar filtros APENAS aos dados da tabela
  const filteredEnhancedData = enhancedData?.filter(client => {
    const matchesName = filterValue === "" || 
      client.clientName.toLowerCase().includes(filterValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || client.overallStatus === statusFilter;
    
    let matchesPlatform = true;
    if (platformFilter !== "all") {
      if (platformFilter === "meta") {
        matchesPlatform = !!client.metaAds && client.metaAds.length > 0;
      } else if (platformFilter === "google") {
        matchesPlatform = !!client.googleAds && client.googleAds.length > 0;
      }
    }

    let matchesUrgency = true;
    if (urgencyFilter !== "all") {
      const metaMatch = client.metaAds?.some(account => account.alertLevel === urgencyFilter);
      const googleMatch = client.googleAds?.some(account => account.alertLevel === urgencyFilter);
      matchesUrgency = metaMatch || googleMatch;
    }

    let matchesProblemType = true;
    if (problemTypeFilter !== "all") {
      const metaProblems = client.metaAds?.flatMap(account => account.problems) || [];
      const googleProblems = client.googleAds?.flatMap(account => account.problems) || [];
      const allProblems = [...metaProblems, ...googleProblems];
      matchesProblemType = allProblems.some(problem => problem.type === problemTypeFilter);
    }
    
    return matchesName && matchesStatus && matchesPlatform && matchesUrgency && matchesProblemType;
  }) || [];

  const handleAlertClick = (alert: HealthAlert) => {
    console.log("🚨 Clique no alerta:", alert);
    handlePlatformAction('review', alert.clientId, alert.platform);
  };

  const handleGeneralUpdate = async () => {
    setIsGeneralUpdating(true);
    try {
      console.log('🚀 Iniciando atualização geral...');
      toast.info('Iniciando atualização geral de campanhas...');
      
      const { data, error } = await supabase.functions.invoke('trigger-campaign-health-update');
      
      if (error) {
        console.error('❌ Erro na atualização geral:', error);
        toast.error('Erro na atualização geral: ' + error.message);
      } else {
        console.log('✅ Atualização geral concluída:', data);
        toast.success('Atualização geral concluída com sucesso!');
        
        // Atualizar os dados locais
        await handleRefresh();
      }
    } catch (error) {
      console.error('❌ Erro crítico:', error);
      toast.error('Erro crítico na atualização geral');
    } finally {
      setIsGeneralUpdating(false);
    }
  };

  // Mapear dashboardStats para o formato esperado pelo IntelligentFilters
  const totalFilterStats = {
    critical: dashboardStats.criticalAlerts,
    high: dashboardStats.highAlerts,
    medium: dashboardStats.mediumAlerts,
    totalProblems: dashboardStats.criticalAlerts + dashboardStats.highAlerts + dashboardStats.mediumAlerts
  };

  // Criar objeto de progresso adequado para HealthProgressBar
  const progressData = {
    current: 0,
    total: 0,
    currentAccount: '',
    platform: '',
    percentage: typeof refreshProgress === 'number' ? refreshProgress : 0,
    estimatedTime: 0
  };

  return (
    <TeamMemberCheck>
      <AuthErrorHandler />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header limpo */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#321e32] mb-2">
              Monitoramento de Campanhas
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                📅 {formatDateForDisplay(todayDate)}
              </div>
              <span className="text-gray-600">
                • Última atualização: {lastRefreshTimestamp 
                  ? new Date(lastRefreshTimestamp).toLocaleString('pt-BR', { 
                      timeZone: 'America/Sao_Paulo',
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Nunca atualizado manualmente'}
              </span>
              {isManualRefreshing && (
                <span className="text-blue-600 font-medium">• Atualizando...</span>
              )}
              {isGeneralUpdating && (
                <span className="text-orange-600 font-medium">• Atualização geral em andamento...</span>
              )}
            </div>
            
            {/* Botão de Atualização Geral */}
            <div className="mt-3">
              <button
                onClick={handleGeneralUpdate}
                disabled={isGeneralUpdating || isManualRefreshing}
                className="px-4 py-2 bg-[#ff6e00] text-white rounded-lg hover:bg-[#e55a00] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isGeneralUpdating ? "Executando..." : "🚀 Atualização Geral"}
              </button>
            </div>
          </div>
          
          {/* Barra de progresso durante atualização */}
          <HealthProgressBar 
            isRefreshing={isManualRefreshing}
            progress={progressData}
            onCancel={() => {
              console.log("🛑 Cancelamento solicitado pelo usuário");
            }}
          />
          
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
            statusFilter={statusFilter as CampaignStatus | "all"}
            setStatusFilter={setStatusFilter}
            platformFilter={platformFilter as "meta" | "google" | "all"}
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
            handleAction={handlePlatformAction}
          />

          {/* Footer discreto */}
          {filteredEnhancedData.length > 0 && (
            <div className="mt-6 text-center text-xs text-gray-500">
              Mostrando {filteredEnhancedData.length} de {enhancedData.length} clientes • 
              {dashboardStats.criticalAlerts + dashboardStats.highAlerts + dashboardStats.mediumAlerts} problemas detectados
              {isFetching && " • Atualizando..."}
            </div>
          )}
          
          {/* Mensagem quando não há dados */}
          {!isLoading && (!data || data.length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <span className="text-4xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma revisão disponível para hoje
              </h3>
              <p className="text-gray-500 mb-4">
                Os dados de hoje ainda não foram processados. Clique em atualizar para buscar os dados mais recentes.
              </p>
              <button
                onClick={handleRefresh}
                disabled={isManualRefreshing}
                className="px-4 py-2 bg-[#ff6e00] text-white rounded-lg hover:bg-[#e55a00] disabled:opacity-50"
              >
                {isManualRefreshing ? "Atualizando..." : "Atualizar dados"}
              </button>
            </div>
          )}
        </div>
      </div>
    </TeamMemberCheck>
  );
}
