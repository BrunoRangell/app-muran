
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaignHealthData } from "@/components/campaign-health/hooks/useCampaignHealthData";
import { useIntelligentAnalysis } from "@/components/campaign-health/hooks/useIntelligentAnalysis";
import { AlertsDashboard } from "@/components/campaign-health/AlertsDashboard";
import { IntelligentFilters } from "@/components/campaign-health/IntelligentFilters";
import { EnhancedHealthTable } from "@/components/campaign-health/EnhancedHealthTable";
import { TeamMemberCheck } from "@/components/auth/TeamMemberCheck";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import { AlertLevel, HealthAlert } from "@/components/campaign-health/types/enhanced-types";
import { formatDateForDisplay, getTodayInBrazil } from "@/utils/brazilTimezone";
import { buildPlatformUrl } from "@/utils/platformUrls";

export default function CampaignHealth() {
  const navigate = useNavigate();
  const [urgencyFilter, setUrgencyFilter] = useState<AlertLevel | "all">("all");
  const [problemTypeFilter, setProblemTypeFilter] = useState<string>("all");

  const {
    data,
    isLoading,
    error,
    filterValue,
    setFilterValue,
    handleAction,
    isRefreshing,
    refetch
  } = useCampaignHealthData();

  const { enhancedData, alerts, dashboardStats } = useIntelligentAnalysis(data || []);

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

  // Aplicar filtros aos dados da tabela
  const filteredEnhancedData = enhancedData?.filter(client => {
    const matchesName = filterValue === "" || 
      client.clientName.toLowerCase().includes(filterValue.toLowerCase());
    
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
    
    return matchesName && matchesUrgency && matchesProblemType;
  }) || [];

  const handleAlertClick = (alert: HealthAlert) => {
    console.log("🚨 Clique no alerta:", alert);
    handlePlatformAction('review', alert.clientId, alert.platform);
  };

  // Mapear dashboardStats para o formato esperado pelo IntelligentFilters
  const totalFilterStats = {
    critical: dashboardStats.criticalAlerts,
    high: dashboardStats.highAlerts,
    medium: dashboardStats.mediumAlerts,
    totalProblems: dashboardStats.criticalAlerts + dashboardStats.highAlerts + dashboardStats.mediumAlerts
  };

  const todayDate = getTodayInBrazil();

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
                • Última atualização: {new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </span>
              {isRefreshing && (
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
          
          {/* Filtros Inteligentes - Versão simplificada */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6e00] focus:border-transparent"
                  />
                </div>
                
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value as AlertLevel | "all")}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6e00] focus:border-transparent"
                >
                  <option value="all">Todos os alertas</option>
                  <option value="critical">Crítico</option>
                  <option value="high">Alto</option>
                  <option value="medium">Médio</option>
                  <option value="ok">OK</option>
                </select>

                <select
                  value={problemTypeFilter}
                  onChange={(e) => setProblemTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6e00] focus:border-transparent"
                >
                  <option value="all">Todos os problemas</option>
                  <option value="no-spend">Sem veiculação</option>
                  <option value="unserved-campaigns">Campanhas não servidas</option>
                  <option value="low-impressions">Baixas impressões</option>
                </select>
              </div>
              
              <button
                onClick={() => {
                  console.log("🔄 Iniciando atualização manual...");
                  handleAction('mass-review');
                  refetch();
                }}
                disabled={isRefreshing}
                className="px-4 py-2 bg-[#ff6e00] text-white rounded-md hover:bg-[#e55a00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Atualizando...
                  </>
                ) : (
                  <>
                    🔄 Atualizar Dados
                  </>
                )}
              </button>
            </div>
          </div>
          
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
              {isRefreshing && " • Atualizando..."}
            </div>
          )}
        </div>
      </div>
    </TeamMemberCheck>
  );
}
