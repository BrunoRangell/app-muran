import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { subDays } from "date-fns";
import { TrafficReportFilters } from "@/components/traffic-reports/TrafficReportFilters";
import { TemplateSelector } from "@/components/traffic-reports/TemplateSelector";
import { TemplateCustomizer } from "@/components/traffic-reports/TemplateCustomizer";
import { ClientPortalButton } from "@/components/traffic-reports/ClientPortalButton";
import { ReportContent, ViewMode } from "@/components/traffic-reports/ReportContent";
import { PortalHeader } from "@/components/traffic-reports/PortalHeader";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { useReportTemplates, ReportTemplate } from "@/hooks/useReportTemplates";
import { useClientPortalByToken, useManageClientPortal } from "@/hooks/useClientPortal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Lock, Eye, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '15', label: 'Últimos 15 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '60', label: 'Últimos 60 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

const TrafficReports = () => {
  // Detectar modo portal via rota
  const { accessToken } = useParams<{ accessToken?: string }>();
  const isPortalMode = !!accessToken;

  // Estado para modo interno
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

  // Estado para modo preview (visualizar como cliente)
  const [previewMode, setPreviewMode] = useState(false);

  // Estado para modo portal
  const [period, setPeriod] = useState<string>('30');
  const [hasTrackedAccess, setHasTrackedAccess] = useState(false);

  // Determinar se deve mostrar elementos do portal
  const showPortalElements = isPortalMode || previewMode;

  // Buscar dados do portal (apenas em modo portal)
  const { data: portal, isLoading: isLoadingPortal, error: portalError } = useClientPortalByToken(
    isPortalMode ? accessToken : undefined
  );
  const { trackAccess } = useManageClientPortal();

  // Rastrear acesso (apenas em modo portal)
  useEffect(() => {
    if (isPortalMode && portal && accessToken && !hasTrackedAccess) {
      trackAccess.mutate(accessToken);
      setHasTrackedAccess(true);
    }
  }, [isPortalMode, portal, accessToken, hasTrackedAccess, trackAccess]);

  // Determinar cliente e plataforma baseado no modo
  const effectiveClientId = isPortalMode ? portal?.client_id || '' : selectedClient;
  const effectivePlatform = isPortalMode 
    ? (portal?.default_platform as 'meta' | 'google' | 'both') || 'both'
    : selectedPlatform;

  // Calcular date range baseado no modo
  const effectiveDateRange = useMemo(() => {
    if (isPortalMode) {
      return {
        start: subDays(new Date(), parseInt(period)),
        end: new Date()
      };
    }
    return dateRange;
  }, [isPortalMode, period, dateRange]);

  // Buscar clientes (apenas modo interno)
  const { data: clientsData, isLoading: isLoadingClients } = useUnifiedData();

  // Buscar contas do cliente
  const { data: accountsData, isLoading: isLoadingAccounts } = useClientAccounts(
    effectiveClientId,
    effectivePlatform === 'both' ? undefined : effectivePlatform
  );

  // Auto-selecionar contas em modo portal
  const effectiveAccounts = useMemo(() => {
    if (isPortalMode) {
      if (!accountsData) return [];
      if (effectivePlatform === 'both') {
        const metaPrimary = accountsData.find(a => a.platform === 'meta' && a.is_primary);
        const googlePrimary = accountsData.find(a => a.platform === 'google' && a.is_primary);
        return [metaPrimary?.id, googlePrimary?.id].filter(Boolean) as string[];
      }
      const primary = accountsData.find(a => a.platform === effectivePlatform && a.is_primary);
      return primary ? [primary.id] : [];
    }
    return selectedAccounts;
  }, [isPortalMode, accountsData, effectivePlatform, selectedAccounts]);

  // Buscar templates
  const { templates } = useReportTemplates(effectiveClientId || undefined);

  // Estado para template selecionado no portal
  const [portalSelectedTemplateId, setPortalSelectedTemplateId] = useState<string>('');

  // Template ativo (modo portal usa seleção local ou auto-seleciona, modo interno usa seleção do usuário)
  const effectiveTemplate = useMemo(() => {
    if (isPortalMode) {
      if (!templates.length) return null;
      // Se usuário selecionou um template no portal, usar esse
      if (portalSelectedTemplateId) {
        const selected = templates.find(t => t.id === portalSelectedTemplateId);
        if (selected) return selected;
      }
      // Auto-selecionar: template do cliente ou global
      const clientTemplate = templates.find(t => t.client_id === portal?.client_id);
      if (clientTemplate) return clientTemplate;
      return templates.find(t => t.is_global) || null;
    }
    return selectedTemplate;
  }, [isPortalMode, templates, portal?.client_id, selectedTemplate, portalSelectedTemplateId]);

  // Buscar insights de tráfego
  const { 
    data: insightsData, 
    isLoading: isLoadingInsights,
    error: insightsError,
    refetch
  } = useTrafficInsights({
    clientId: effectiveClientId,
    accountIds: effectiveAccounts,
    platform: effectivePlatform,
    dateRange: {
      start: effectiveDateRange.start.toISOString().split('T')[0],
      end: effectiveDateRange.end.toISOString().split('T')[0]
    },
    compareWithPrevious: true
  });

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    setSelectedAccounts([]);
  };

  const handlePlatformChange = (platform: 'meta' | 'google' | 'both') => {
    setSelectedPlatform(platform);
    setViewMode('combined');
    
    if (platform === 'both') {
      const metaPrimary = accountsData?.find(a => a.platform === 'meta' && a.is_primary);
      const googlePrimary = accountsData?.find(a => a.platform === 'google' && a.is_primary);
      const autoSelected = [];
      if (metaPrimary) autoSelected.push(metaPrimary.id);
      if (googlePrimary) autoSelected.push(googlePrimary.id);
      setSelectedAccounts(autoSelected);
    } else {
      const primaryAccount = accountsData?.find(a => a.platform === platform && a.is_primary);
      setSelectedAccounts(primaryAccount ? [primaryAccount.id] : []);
    }
  };

  const hasSelection = effectiveClientId && effectiveAccounts.length > 0;

  const accountId = useMemo(() => {
    return accountsData?.find(a => effectiveAccounts.includes(a.id))?.account_id;
  }, [accountsData, effectiveAccounts]);

  // Estados de loading/erro para modo portal
  if (isPortalMode && isLoadingPortal) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-muran-primary mx-auto" />
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (isPortalMode && (!portal || portalError)) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Banner de modo preview */}
      {previewMode && !isPortalMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-muran-primary text-white py-2 px-4 flex items-center justify-center gap-3 shadow-lg">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">Modo Preview - Visualizando como cliente</span>
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-7 px-3 text-xs"
            onClick={() => setPreviewMode(false)}
          >
            <X className="h-3 w-3 mr-1" />
            Sair
          </Button>
        </div>
      )}

      {/* Header integrado do portal - modo portal OU preview */}
      {showPortalElements && (
        <div className={previewMode && !isPortalMode ? 'mt-10' : ''}>
          <PortalHeader
            clientName={isPortalMode ? portal?.clients?.company_name : clientsData?.find(c => c.id === selectedClient)?.company_name}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            hasMetaData={!!insightsData?.metaData}
            hasGoogleData={!!insightsData?.googleData}
            showTabs={effectivePlatform === 'both'}
          />
        </div>
      )}

      <div className="flex-1 max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 w-full">
        {/* Header do modo interno */}
        {!showPortalElements && (
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
              {/* Botão de Preview */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(true)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Visualizar como Cliente
              </Button>
              
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
        )}

        {/* Seletores para modo portal */}
        {showPortalElements && isPortalMode && (
          <div className="flex items-center justify-end gap-4 flex-wrap">
            {/* Seletor de template */}
            {templates.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Modelo:</span>
                <Select 
                  value={portalSelectedTemplateId || '_auto'} 
                  onValueChange={(val) => setPortalSelectedTemplateId(val === '_auto' ? '' : val)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Automático" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_auto">Visualização Padrão</SelectItem>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Seletor de período (se permitido) */}
            {portal?.allow_period_change && (
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

        {/* Filtros apenas para modo interno (sem preview) */}
        {!isPortalMode && !previewMode && (
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
        )}

        {/* Estados de seleção apenas para modo interno (sem preview) */}
        {!isPortalMode && !previewMode && !selectedClient && (
          <Alert>
            <AlertDescription>
              Selecione um cliente para visualizar os relatórios de tráfego
            </AlertDescription>
          </Alert>
        )}

        {!isPortalMode && !previewMode && selectedClient && selectedAccounts.length === 0 && (
          <Alert>
            <AlertDescription>
              Selecione pelo menos uma conta de anúncios para visualizar as métricas
            </AlertDescription>
          </Alert>
        )}

        {/* Conteúdo do relatório (idêntico para ambos os modos) */}
        {hasSelection && (
          <ReportContent
            insightsData={insightsData}
            platform={effectivePlatform}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            template={effectiveTemplate}
            accountId={accountId}
            isLoading={isLoadingInsights}
            error={insightsError}
            hideViewSelector={showPortalElements}
          />
        )}

        {/* Template Customizer apenas para modo interno (sem preview) */}
        {!isPortalMode && !previewMode && (
          <TemplateCustomizer
            open={customizerOpen}
            onOpenChange={setCustomizerOpen}
            template={selectedTemplate}
            clientId={selectedClient}
          />
        )}
      </div>

      {/* Footer discreto - modo portal OU preview */}
      {showPortalElements && (
        <footer className="py-6 text-center border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="text-muran-primary font-semibold">Muran</span>
          </p>
        </footer>
      )}
    </div>
  );
};

export default TrafficReports;
