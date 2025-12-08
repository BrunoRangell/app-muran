import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { subDays } from "date-fns";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { EditorToolbar } from "@/components/traffic-reports/EditorToolbar";
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
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Calendar, AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = 'combined' | 'meta' | 'google';

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

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '15', label: 'Últimos 15 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '60', label: 'Últimos 60 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

const ClientPortal = () => {
  const { accessToken } = useParams<{ accessToken: string }>();
  
  // Auth - verificar se usuário logado é team member
  const { user, isAuthenticated } = useUnifiedAuth();
  const { data: roleData } = useUserRole();
  const canEdit = isAuthenticated && roleData?.isTeamMember;
  
  // Estado de edição
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados do portal (para cliente)
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [period, setPeriod] = useState<string>('30');
  const [hasTrackedAccess, setHasTrackedAccess] = useState(false);
  
  // Estados do editor (para team member)
  const [editorClient, setEditorClient] = useState<string>("");
  const [editorAccounts, setEditorAccounts] = useState<string[]>([]);
  const [editorPlatform, setEditorPlatform] = useState<'meta' | 'google' | 'both'>('both');
  const [editorDateRange, setEditorDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [editorTemplate, setEditorTemplate] = useState<ReportTemplate | null>(null);
  
  // Buscar dados do portal
  const { data: portal, isLoading: isLoadingPortal, error: portalError } = useClientPortalByToken(accessToken);
  const { trackAccess } = useManageClientPortal();
  
  // Buscar lista de clientes (para editor)
  const { data: clientsData } = useUnifiedData();

  // Rastrear acesso uma vez (apenas se não estiver editando)
  useEffect(() => {
    if (portal && accessToken && !hasTrackedAccess && !canEdit) {
      trackAccess.mutate(accessToken);
      setHasTrackedAccess(true);
    }
  }, [portal, accessToken, hasTrackedAccess, trackAccess, canEdit]);

  // Sincronizar estado do editor com o portal quando ativa edição
  useEffect(() => {
    if (portal && isEditing && !editorClient) {
      setEditorClient(portal.client_id);
    }
  }, [portal, isEditing, editorClient]);

  // Determinar qual cliente/config usar
  const activeClientId = isEditing && editorClient ? editorClient : portal?.client_id;
  const activePlatform = isEditing ? editorPlatform : (portal?.default_platform as 'meta' | 'google' | 'both') || 'both';

  // Calcular date range
  const dateRange = useMemo(() => {
    if (isEditing) {
      return editorDateRange;
    }
    return {
      start: subDays(new Date(), parseInt(period)),
      end: new Date()
    };
  }, [isEditing, editorDateRange, period]);

  // Buscar contas do cliente
  const { data: accountsData } = useClientAccounts(
    activeClientId,
    activePlatform === 'both' ? undefined : activePlatform
  );

  // Auto-selecionar contas quando mudar cliente/plataforma (modo edição)
  useEffect(() => {
    if (isEditing && accountsData && editorClient) {
      if (editorPlatform === 'both') {
        const metaPrimary = accountsData.find(a => a.platform === 'meta' && a.is_primary);
        const googlePrimary = accountsData.find(a => a.platform === 'google' && a.is_primary);
        const autoSelected = [metaPrimary?.id, googlePrimary?.id].filter(Boolean) as string[];
        if (editorAccounts.length === 0 || editorAccounts.every(id => !accountsData.some(a => a.id === id))) {
          setEditorAccounts(autoSelected);
        }
      } else {
        const primary = accountsData.find(a => a.platform === editorPlatform && a.is_primary);
        if (editorAccounts.length === 0 || editorAccounts.every(id => !accountsData.some(a => a.id === id))) {
          setEditorAccounts(primary ? [primary.id] : []);
        }
      }
    }
  }, [isEditing, accountsData, editorClient, editorPlatform]);

  // Buscar templates
  const { templates } = useReportTemplates(activeClientId);
  
  // Selecionar template ativo
  const activeTemplate = useMemo(() => {
    if (isEditing && editorTemplate) return editorTemplate;
    
    if (!templates.length) return null;
    const clientTemplate = templates.find(t => t.client_id === activeClientId);
    if (clientTemplate) return clientTemplate;
    return templates.find(t => t.is_global) || null;
  }, [templates, activeClientId, isEditing, editorTemplate]);

  // Determinar contas selecionadas
  const selectedAccounts = useMemo(() => {
    if (isEditing) return editorAccounts;
    
    if (!accountsData) return [];
    
    if (activePlatform === 'both') {
      const metaPrimary = accountsData.find(a => a.platform === 'meta' && a.is_primary);
      const googlePrimary = accountsData.find(a => a.platform === 'google' && a.is_primary);
      return [metaPrimary?.id, googlePrimary?.id].filter(Boolean) as string[];
    }
    
    const primary = accountsData.find(a => a.platform === activePlatform && a.is_primary);
    return primary ? [primary.id] : [];
  }, [accountsData, activePlatform, isEditing, editorAccounts]);

  // Buscar insights
  const { 
    data: insightsData, 
    isLoading: isLoadingInsights,
    error: insightsError
  } = useTrafficInsights({
    clientId: activeClientId || '',
    accountIds: selectedAccounts,
    platform: activePlatform,
    dateRange: {
      start: dateRange.start.toISOString().split('T')[0],
      end: dateRange.end.toISOString().split('T')[0]
    },
    compareWithPrevious: true
  });

  // Determinar dados ativos baseado no viewMode
  const activeData = useMemo(() => {
    if (!insightsData) return null;
    
    if (activePlatform !== 'both') {
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
  }, [insightsData, viewMode, activePlatform]);

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

  // Handler para mudança de cliente no editor
  const handleEditorClientChange = (clientId: string) => {
    setEditorClient(clientId);
    setEditorAccounts([]);
  };

  // Handler para mudança de plataforma no editor
  const handleEditorPlatformChange = (platform: 'meta' | 'google' | 'both') => {
    setEditorPlatform(platform);
    setViewMode('combined');
  };

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
            showPlatformFilter={activePlatform === 'both' && viewMode === 'combined'}
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

  // Determinar nome do cliente
  const displayClientName = isEditing && editorClient
    ? clientsData?.find(c => c.id === editorClient)?.company_name
    : portal.clients?.company_name;

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

  // Renderizar visão de plataforma específica
  const renderPlatformView = () => {
    if (!activeData) return null;

    return (
      <div className="space-y-8 animate-fade-in">
        {sortedSections.map(({ key, config }) => renderSection(key, config))}
      </div>
    );
  };

  return (
    <ClientPortalLayout 
      clientName={displayClientName}
      showEditButton={canEdit}
      isEditing={isEditing}
      onEditClick={() => setIsEditing(!isEditing)}
    >
      {/* Editor Toolbar */}
      {isEditing && canEdit && (
        <EditorToolbar
          clients={clientsData || []}
          selectedClient={editorClient}
          onClientChange={handleEditorClientChange}
          clientName={displayClientName}
          accounts={accountsData || []}
          selectedAccounts={editorAccounts}
          onAccountsChange={setEditorAccounts}
          selectedPlatform={editorPlatform}
          onPlatformChange={handleEditorPlatformChange}
          dateRange={editorDateRange}
          onDateRangeChange={setEditorDateRange}
          selectedTemplate={editorTemplate}
          onTemplateSelect={setEditorTemplate}
          onClose={() => setIsEditing(false)}
          isLoading={isLoadingInsights}
        />
      )}

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Header com seletor de período (apenas para cliente) */}
        {!isEditing && (
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
        )}

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
        {insightsData && !isLoadingInsights && activePlatform === 'both' && (
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
            {activePlatform === 'both' && viewMode === 'combined' 
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
