import { useMemo } from "react";
import { InsightsOverview } from "./InsightsOverview";
import { CampaignsInsightsTable } from "./CampaignsInsightsTable";
import { InsightsConversionFunnel } from "./InsightsConversionFunnel";
import { TrendCharts } from "./TrendCharts";
import { DemographicsCharts } from "./DemographicsCharts";
import { TopCreativesSection } from "./TopCreativesSection";
import { PlatformViewSelector } from "./PlatformViewSelector";
import { CombinedOverview } from "./CombinedOverview";
import { ComparativeTrendCharts } from "./ComparativeTrendCharts";
import { ReportTemplate } from "@/hooks/useReportTemplates";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Configuração padrão de seções
export const DEFAULT_SECTIONS = {
  overview: { enabled: true, order: 1 },
  demographics: { enabled: true, order: 2 },
  topCreatives: { enabled: true, order: 3, limit: 10 },
  conversionFunnel: { enabled: true, order: 4 },
  trendCharts: { enabled: true, order: 5 },
  campaignTable: { enabled: true, order: 6 }
};

export type SectionKey = keyof typeof DEFAULT_SECTIONS;

export interface SectionConfig {
  enabled: boolean;
  order: number;
  limit?: number;
}

export type ViewMode = 'combined' | 'meta' | 'google';

interface ReportContentProps {
  insightsData: any;
  platform: 'meta' | 'google' | 'both';
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  template: ReportTemplate | null;
  accountId?: string;
  isLoading?: boolean;
  error?: Error | null;
  hideViewSelector?: boolean;
}

export function ReportContent({
  insightsData,
  platform,
  viewMode,
  onViewModeChange,
  template,
  accountId,
  isLoading,
  error,
  hideViewSelector = false
}: ReportContentProps) {
  // Determinar quais dados usar baseado no viewMode
  const activeData = useMemo(() => {
    if (!insightsData) return null;
    
    if (platform !== 'both') {
      return insightsData;
    }

    // Para platform='both', escolher dados baseado no viewMode
    switch (viewMode) {
      case 'meta':
        // Verificar se metaData existe e tem overview
        if (insightsData.metaData?.overview) {
          return {
            ...insightsData.metaData,
            platform: 'meta' as const
          };
        }
        return null;
      case 'google':
        // Verificar se googleData existe e tem overview
        if (insightsData.googleData?.overview) {
          return {
            ...insightsData.googleData,
            platform: 'google' as const
          };
        }
        return null;
      case 'combined':
      default:
        return insightsData;
    }
  }, [insightsData, viewMode, platform]);

  // Calcular seções ordenadas baseado no template
  // Suporte para formato legado (sections) e novo formato (widgets)
  const sortedSections = useMemo(() => {
    const templateSections = template?.sections;
    
    // Se não tem template, usa padrão
    if (!templateSections) {
      return getDefaultSectionList();
    }
    
    // Detectar se é formato widgets (novo) ou sections (legado)
    const isWidgetFormat = Array.isArray((templateSections as any).widgets) || 
                           (templateSections as any).version;
    
    if (!isWidgetFormat) {
      // Formato legado - usar diretamente
      return Object.entries(templateSections)
        .filter(([key]) => ['overview', 'demographics', 'topCreatives', 'conversionFunnel', 'trendCharts', 'campaignTable'].includes(key))
        .map(([key, config]) => ({
          key: key as SectionKey,
          config: config as SectionConfig
        }))
        .filter(s => s.config.enabled !== false)
        .sort((a, b) => (a.config.order || 999) - (b.config.order || 999));
    }
    
    // NOVO: Formato widgets - converter para seções baseadas nos widgets presentes
    const widgets = (templateSections as any).widgets || [];
    
    if (widgets.length === 0) {
      return getDefaultSectionList();
    }
    
    const sections: { key: SectionKey; config: SectionConfig }[] = [];
    let order = 1;
    
    // Detectar metric-cards -> ativa 'overview'
    if (widgets.some((w: any) => w.type === 'metric-card')) {
      sections.push({ key: 'overview', config: { enabled: true, order: order++ } });
    }
    
    // Detectar charts com demographics -> ativa 'demographics'
    if (widgets.some((w: any) => w.config?.dataSource === 'demographics' || w.type === 'pie-chart')) {
      sections.push({ key: 'demographics', config: { enabled: true, order: order++ } });
    }
    
    // Detectar top-creatives -> ativa 'topCreatives'
    const creativesWidget = widgets.find((w: any) => w.type === 'top-creatives');
    if (creativesWidget) {
      sections.push({ 
        key: 'topCreatives', 
        config: { enabled: true, order: order++, limit: creativesWidget.config?.limit || 10 } 
      });
    }
    
    // Detectar line/area/bar charts (não demographics) -> ativa 'trendCharts'
    if (widgets.some((w: any) => 
      ['line-chart', 'area-chart', 'bar-chart'].includes(w.type) && 
      w.config?.dataSource !== 'demographics'
    )) {
      sections.push({ key: 'trendCharts', config: { enabled: true, order: order++ } });
    }
    
    // Detectar campaigns-table -> ativa 'campaignTable'
    if (widgets.some((w: any) => w.type === 'campaigns-table' || w.type === 'table')) {
      sections.push({ key: 'campaignTable', config: { enabled: true, order: order++ } });
    }
    
    // Se não encontrou nenhuma seção, usa padrão
    return sections.length > 0 ? sections : getDefaultSectionList();
  }, [template]);

  // Helper para obter lista de seções padrão
  function getDefaultSectionList(): { key: SectionKey; config: SectionConfig }[] {
    return Object.entries(DEFAULT_SECTIONS)
      .map(([key, config]) => ({
        key: key as SectionKey,
        config: config as SectionConfig
      }))
      .filter(s => s.config.enabled !== false)
      .sort((a, b) => (a.config.order || 999) - (b.config.order || 999));
  }

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
            accountId={accountId}
            showPlatformFilter={platform === 'both' && viewMode === 'combined'}
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
          accountId={accountId}
          showPlatformFilter={true}
        />
      </div>
    );
  };

  // Renderizar conteúdo para plataforma específica (Meta ou Google)
  const renderPlatformView = () => {
    if (!activeData) {
      const platformName = viewMode === 'meta' ? 'Meta Ads' : 'Google Ads';
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Sem dados disponíveis para {platformName} no período selecionado.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-fade-in">
        {sortedSections.map(({ key, config }) => renderSection(key, config))}
      </div>
    );
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muran-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Carregando dados das campanhas...
          </p>
        </div>
      </div>
    );
  }

  // Erro
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Sem dados
  if (!insightsData) {
    return null;
  }

  return (
    <>
      {/* Seletor de View para platform='both' (esconder quando já tem no header) */}
      {platform === 'both' && !hideViewSelector && (
        <div className="flex justify-center">
          <PlatformViewSelector
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            hasMetaData={!!insightsData.metaData}
            hasGoogleData={!!insightsData.googleData}
          />
        </div>
      )}

      {/* Dados - Renderizar baseado no viewMode */}
      {platform === 'both' && viewMode === 'combined' 
        ? renderCombinedView()
        : renderPlatformView()
      }
    </>
  );
}
