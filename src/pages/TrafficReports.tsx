import { useState, useMemo } from "react";
import { subDays } from "date-fns";
import { TrafficReportFilters } from "@/components/traffic-reports/TrafficReportFilters";
import { InsightsOverview } from "@/components/traffic-reports/InsightsOverview";
import { CampaignsInsightsTable } from "@/components/traffic-reports/CampaignsInsightsTable";
import { InsightsConversionFunnel } from "@/components/traffic-reports/InsightsConversionFunnel";
import { TrendCharts } from "@/components/traffic-reports/TrendCharts";
import { DemographicsCharts } from "@/components/traffic-reports/DemographicsCharts";
import { TopCreativesSection } from "@/components/traffic-reports/TopCreativesSection";
import { TemplateSelector } from "@/components/traffic-reports/TemplateSelector";
import { TemplateCustomizer } from "@/components/traffic-reports/TemplateCustomizer";
import { PlatformViewSelector } from "@/components/traffic-reports/PlatformViewSelector";
import { ClientPortalButton } from "@/components/traffic-reports/ClientPortalButton";
import { CombinedOverview } from "@/components/traffic-reports/CombinedOverview";
import { ComparativeTrendCharts } from "@/components/traffic-reports/ComparativeTrendCharts";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { ReportTemplate } from "@/hooks/useReportTemplates";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Configuração padrão de seções
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

type ViewMode = 'combined' | 'meta' | 'google';

const TrafficReports = () => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<'meta' | 'google' | 'both'>('both');
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Buscar clientes
  const { data: clientsData, isLoading: isLoadingClients } = useUnifiedData();

  // Buscar contas do cliente selecionado
  const { data: accountsData, isLoading: isLoadingAccounts } = useClientAccounts(
    selectedClient,
    selectedPlatform === 'both' ? undefined : selectedPlatform
  );

  // Buscar insights de tráfego
  const { 
    data: insightsData, 
    isLoading: isLoadingInsights,
    error: insightsError,
    refetch
  } = useTrafficInsights({
    clientId: selectedClient,
    accountIds: selectedAccounts,
    platform: selectedPlatform,
    dateRange: {
      start: dateRange.start.toISOString().split('T')[0],
      end: dateRange.end.toISOString().split('T')[0]
    },
    compareWithPrevious: true
  });

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    setSelectedAccounts([]); // Reset accounts when client changes
  };

  const handlePlatformChange = (platform: 'meta' | 'google' | 'both') => {
    setSelectedPlatform(platform);
    
    // Reset view mode quando mudar plataforma
    if (platform !== 'both') {
      setViewMode('combined'); // Não usado para plataforma única
    } else {
      setViewMode('combined');
    }
    
    // Auto-selecionar contas principais
    if (platform === 'both') {
      const metaPrimary = accountsData?.find(a => a.platform === 'meta' && a.is_primary);
      const googlePrimary = accountsData?.find(a => a.platform === 'google' && a.is_primary);
      
      const autoSelected = [];
      if (metaPrimary) autoSelected.push(metaPrimary.id);
      if (googlePrimary) autoSelected.push(googlePrimary.id);
      
      setSelectedAccounts(autoSelected);
    } else {
      const primaryAccount = accountsData?.find(
        a => a.platform === platform && a.is_primary
      );
      setSelectedAccounts(primaryAccount ? [primaryAccount.id] : []);
    }
  };

  // Determinar quais dados usar baseado no viewMode
  const activeData = useMemo(() => {
    if (!insightsData) return null;
    
    if (selectedPlatform !== 'both') {
      return insightsData;
    }

    // Para platform='both', escolher dados baseado no viewMode
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
    const sections = selectedTemplate?.sections || DEFAULT_SECTIONS;
    
    const sectionList: { key: SectionKey; config: SectionConfig }[] = Object.entries(sections)
      .map(([key, config]) => ({
        key: key as SectionKey,
        config: config as SectionConfig
      }))
      .filter(s => s.config.enabled !== false)
      .sort((a, b) => (a.config.order || 999) - (b.config.order || 999));

    return sectionList;
  }, [selectedTemplate]);

  const isLoading = isLoadingClients || isLoadingAccounts || isLoadingInsights;
  const hasSelection = selectedClient && selectedAccounts.length > 0;

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
            accountId={accountsData?.find(a => selectedAccounts.includes(a.id))?.account_id}
            showPlatformFilter={selectedPlatform === 'both' && viewMode === 'combined'}
          />
        );
      
      default:
        return null;
    }
  };

  // Renderizar conteúdo para "Visão Geral" (combinado)
  const renderCombinedView = () => {
    if (!insightsData) return null;

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Overview Combinado com breakdown */}
        <CombinedOverview
          combined={insightsData.overview}
          meta={insightsData.metaData?.overview}
          google={insightsData.googleData?.overview}
        />

        {/* Gráficos Comparativos */}
        <ComparativeTrendCharts
          metaTimeSeries={insightsData.metaData?.timeSeries || []}
          googleTimeSeries={insightsData.googleData?.timeSeries || []}
        />

        {/* Tabela de campanhas com filtro de plataforma */}
        <CampaignsInsightsTable
          campaigns={insightsData.campaigns}
          accountId={accountsData?.find(a => selectedAccounts.includes(a.id))?.account_id}
          showPlatformFilter={true}
        />
      </div>
    );
  };

  // Renderizar conteúdo para plataforma específica (Meta ou Google)
  const renderPlatformView = () => {
    if (!activeData) return null;

    return (
      <div className="space-y-8 animate-fade-in">
        {sortedSections.map(({ key, config }) => renderSection(key, config))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-muran-primary to-muran-primary-glow bg-clip-text text-transparent">
              Relatórios de Tráfego
            </h1>
            <p className="text-muted-foreground">
              Análise detalhada de performance de Meta Ads e Google Ads com dados em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedClient && (
              <ClientPortalButton 
                clientId={selectedClient} 
                clientName={clientsData?.find(c => c.id === selectedClient)?.company_name}
              />
            )}
            <TemplateSelector
              selectedTemplateId={selectedTemplate?.id}
              onTemplateSelect={setSelectedTemplate}
              onCustomize={() => setCustomizerOpen(true)}
              clientId={selectedClient}
            />
          </div>
        </div>

        {/* Filtros */}
        <TrafficReportFilters
          clients={clientsData || []}
          accounts={accountsData || []}
          selectedClient={selectedClient}
          selectedAccounts={selectedAccounts}
          selectedPlatform={selectedPlatform}
          dateRange={dateRange}
          onClientChange={handleClientChange}
          onAccountsChange={setSelectedAccounts}
          onPlatformChange={handlePlatformChange}
          onDateRangeChange={setDateRange}
          onRefresh={() => refetch()}
          isLoading={isLoadingInsights}
        />

        {/* Estado: Nenhum cliente selecionado */}
        {!selectedClient && (
          <Alert>
            <AlertDescription>
              Selecione um cliente para visualizar os relatórios de tráfego
            </AlertDescription>
          </Alert>
        )}

        {/* Estado: Cliente selecionado mas sem conta */}
        {selectedClient && selectedAccounts.length === 0 && (
          <Alert>
            <AlertDescription>
              Selecione pelo menos uma conta de anúncios para visualizar as métricas
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoadingInsights && hasSelection && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muran-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Carregando dados das APIs...
              </p>
            </div>
          </div>
        )}

        {/* Erro */}
        {insightsError && hasSelection && (
          <Alert variant="destructive">
            <AlertDescription>
              Erro ao carregar dados: {insightsError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Seletor de View para platform='both' */}
        {insightsData && !isLoadingInsights && hasSelection && selectedPlatform === 'both' && (
          <div className="flex justify-center">
            <PlatformViewSelector
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              hasMetaData={!!insightsData.metaData}
              hasGoogleData={!!insightsData.googleData}
            />
          </div>
        )}

        {/* Dados - Renderizar baseado no viewMode */}
        {insightsData && !isLoadingInsights && hasSelection && (
          <>
            {selectedPlatform === 'both' && viewMode === 'combined' 
              ? renderCombinedView()
              : renderPlatformView()
            }
          </>
        )}

        <TemplateCustomizer
          open={customizerOpen}
          onOpenChange={setCustomizerOpen}
          template={selectedTemplate}
          clientId={selectedClient}
        />
      </div>
    </div>
  );
};

export default TrafficReports;
