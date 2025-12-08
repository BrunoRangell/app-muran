import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { subDays } from "date-fns";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { InsightsOverview } from "@/components/traffic-reports/InsightsOverview";
import { CampaignsInsightsTable } from "@/components/traffic-reports/CampaignsInsightsTable";
import { InsightsConversionFunnel } from "@/components/traffic-reports/InsightsConversionFunnel";
import { TrendCharts } from "@/components/traffic-reports/TrendCharts";
import { DemographicsCharts } from "@/components/traffic-reports/DemographicsCharts";
import { TopCreativesSection } from "@/components/traffic-reports/TopCreativesSection";
import { PlatformViewSelector } from "@/components/traffic-reports/PlatformViewSelector";
import { CombinedOverview } from "@/components/traffic-reports/CombinedOverview";
import { ComparativeTrendCharts } from "@/components/traffic-reports/ComparativeTrendCharts";
import { useClientPortalByToken, useManageClientPortal } from "@/hooks/useClientPortal";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { useReportTemplates, ReportTemplate } from "@/hooks/useReportTemplates";
import { Loader2, Calendar, AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = 'combined' | 'meta' | 'google';

// Configuração padrão de seções (igual ao TrafficReports)
const DEFAULT_SECTIONS = {
  overview: { enabled: true, order: 1 },
  demographics: { enabled: true, order: 2 },
  topCreatives: { enabled: true, order: 3, limit: 10 },
  conversionFunnel: { enabled: true, order: 4 },
  trendCharts: { enabled: true, order: 5 },
  campaignTable: { enabled: true, order: 6 }
};

type SectionKey = keyof typeof DEFAULT_SECTIONS;

interface SectionConfig {
  enabled: boolean;
  order: number;
  limit?: number;
}

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '15', label: 'Últimos 15 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '60', label: 'Últimos 60 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

const ClientPortal = () => {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [period, setPeriod] = useState<string>('30');
  const [hasTrackedAccess, setHasTrackedAccess] = useState(false);
  
  // Buscar dados do portal
  const { data: portal, isLoading: isLoadingPortal, error: portalError } = useClientPortalByToken(accessToken);
  const { trackAccess } = useManageClientPortal();

  // Rastrear acesso uma vez
  useEffect(() => {
    if (portal && accessToken && !hasTrackedAccess) {
      trackAccess.mutate(accessToken);
      setHasTrackedAccess(true);
    }
  }, [portal, accessToken, hasTrackedAccess, trackAccess]);

  // Calcular date range baseado no período
  const dateRange = useMemo(() => ({
    start: subDays(new Date(), parseInt(period)),
    end: new Date()
  }), [period]);

  // Determinar plataforma
  const selectedPlatform = (portal?.default_platform as 'meta' | 'google' | 'both') || 'both';

  // Buscar contas do cliente
  const { data: accountsData } = useClientAccounts(
    portal?.client_id,
    selectedPlatform === 'both' ? undefined : selectedPlatform
  );

  // Buscar templates (usa o template do cliente se existir)
  const { templates } = useReportTemplates(portal?.client_id);
  
  // Selecionar template do cliente ou global padrão
  const activeTemplate = useMemo(() => {
    if (!templates.length) return null;
    // Primeiro tenta encontrar um template específico do cliente
    const clientTemplate = templates.find(t => t.client_id === portal?.client_id);
    if (clientTemplate) return clientTemplate;
    // Senão, usa o primeiro template global
    return templates.find(t => t.is_global) || null;
  }, [templates, portal?.client_id]);

  // Auto-selecionar contas primárias
  const selectedAccounts = useMemo(() => {
    if (!accountsData) return [];
    
    if (selectedPlatform === 'both') {
      const metaPrimary = accountsData.find(a => a.platform === 'meta' && a.is_primary);
      const googlePrimary = accountsData.find(a => a.platform === 'google' && a.is_primary);
      return [metaPrimary?.id, googlePrimary?.id].filter(Boolean) as string[];
    }
    
    const primary = accountsData.find(a => a.platform === selectedPlatform && a.is_primary);
    return primary ? [primary.id] : [];
  }, [accountsData, selectedPlatform]);

  // Buscar insights
  const { 
    data: insightsData, 
    isLoading: isLoadingInsights,
    error: insightsError
  } = useTrafficInsights({
    clientId: portal?.client_id || '',
    accountIds: selectedAccounts,
    platform: selectedPlatform,
    dateRange: {
      start: dateRange.start.toISOString().split('T')[0],
      end: dateRange.end.toISOString().split('T')[0]
    },
    compareWithPrevious: true
  });

  // Determinar dados ativos baseado no viewMode
  const activeData = useMemo(() => {
    if (!insightsData) return null;
    
    if (selectedPlatform !== 'both') {
      return insightsData;
    }

    switch (viewMode) {
      case 'meta':
        return insightsData.metaData || null;
      case 'google':
        return insightsData.googleData || null;
      case 'combined':
      default:
        return insightsData;
    }
  }, [insightsData, viewMode, selectedPlatform]);

  // Calcular seções ordenadas baseado no template
  const sortedSections = useMemo(() => {
    const sections = activeTemplate?.sections || DEFAULT_SECTIONS;
    
    const sectionList: { key: SectionKey; config: SectionConfig }[] = Object.entries(sections)
      .map(([key, config]) => ({
        key: key as SectionKey,
        config: config as SectionConfig
      }))
      .filter(s => s.config.enabled !== false)
      .sort((a, b) => (a.config.order || 999) - (b.config.order || 999));

    return sectionList;
  }, [activeTemplate]);

  // Função para renderizar seção
  const renderSection = (key: SectionKey, config: SectionConfig) => {
    if (!activeData) return null;

    switch (key) {
      case 'overview':
        return (
          <InsightsOverview 
            key={key}
            overview={activeData.overview} 
            platform={activeData.platform} 
          />
        );
      
      case 'demographics':
        if (!activeData.demographics) return null;
        return (
          <DemographicsCharts 
            key={key}
            demographics={activeData.demographics} 
            platform={activeData.platform} 
          />
        );
      
      case 'topCreatives':
        if (!activeData.topAds || activeData.topAds.length === 0) return null;
        return (
          <TopCreativesSection 
            key={key}
            topAds={activeData.topAds} 
            limit={config.limit || 10} 
          />
        );
      
      case 'conversionFunnel':
        return (
          <InsightsConversionFunnel
            key={key}
            data={{
              impressions: activeData.overview.impressions.current,
              clicks: activeData.overview.clicks.current,
              conversions: activeData.overview.conversions.current,
              spend: activeData.overview.spend.current,
              cpc: activeData.overview.cpc.current,
              cpa: activeData.overview.cpa.current,
            }}
            platform={activeData.platform}
          />
        );
      
      case 'trendCharts':
        if (!activeData.timeSeries || activeData.timeSeries.length === 0) return null;
        return (
          <TrendCharts
            key={key}
            timeSeries={activeData.timeSeries}
            overview={activeData.overview}
            platform={activeData.platform}
          />
        );
      
      case 'campaignTable':
        return (
          <CampaignsInsightsTable 
            key={key}
            campaigns={activeData.campaigns}
            showPlatformFilter={selectedPlatform === 'both' && viewMode === 'combined'}
          />
        );
      
      default:
        return null;
    }
  };

  // Estado de loading inicial
  if (isLoadingPortal) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-muran-primary mx-auto" />
            <p className="text-muted-foreground">Carregando relatório...</p>
          </div>
        </div>
      </ClientPortalLayout>
    );
  }

  // Portal não encontrado ou inativo
  if (!portal || portalError) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 max-w-md">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">Acesso Indisponível</h2>
            <p className="text-muted-foreground">
              Este link de relatório não está mais disponível ou foi desativado.
              Entre em contato com a Muran para mais informações.
            </p>
          </div>
        </div>
      </ClientPortalLayout>
    );
  }

  const clientName = portal.clients?.company_name;

  // Renderizar visão combinada
  const renderCombinedView = () => {
    if (!insightsData) return null;

    return (
      <div className="space-y-8 animate-fade-in">
        <CombinedOverview
          combined={insightsData.overview}
          meta={insightsData.metaData?.overview}
          google={insightsData.googleData?.overview}
        />

        <ComparativeTrendCharts
          metaTimeSeries={insightsData.metaData?.timeSeries || []}
          googleTimeSeries={insightsData.googleData?.timeSeries || []}
        />

        <CampaignsInsightsTable
          campaigns={insightsData.campaigns}
          showPlatformFilter={true}
        />
      </div>
    );
  };

  // Renderizar visão de plataforma específica usando templates
  const renderPlatformView = () => {
    if (!activeData) return null;

    return (
      <div className="space-y-8 animate-fade-in">
        {sortedSections.map(({ key, config }) => renderSection(key, config))}
      </div>
    );
  };

  return (
    <ClientPortalLayout clientName={clientName}>
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Header com seletor de período */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-muran-primary to-muran-primary-glow bg-clip-text text-transparent">
              Relatório de Performance
            </h2>
            <p className="text-muted-foreground text-sm">
              Dados atualizados em tempo real das suas campanhas
            </p>
          </div>

          {portal.allow_period_change && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Loading insights */}
        {isLoadingInsights && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muran-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Carregando dados das campanhas...
              </p>
            </div>
          </div>
        )}

        {/* Erro */}
        {insightsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        {/* Seletor de View para platform='both' */}
        {insightsData && !isLoadingInsights && selectedPlatform === 'both' && (
          <div className="flex justify-center">
            <PlatformViewSelector
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              hasMetaData={!!insightsData.metaData}
              hasGoogleData={!!insightsData.googleData}
            />
          </div>
        )}

        {/* Conteúdo */}
        {insightsData && !isLoadingInsights && (
          <>
            {selectedPlatform === 'both' && viewMode === 'combined' 
              ? renderCombinedView()
              : renderPlatformView()
            }
          </>
        )}
      </div>
    </ClientPortalLayout>
  );
};

export default ClientPortal;
