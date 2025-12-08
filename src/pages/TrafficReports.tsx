import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { subDays } from "date-fns";
import { TrafficReportFilters } from "@/components/traffic-reports/TrafficReportFilters";
import { TemplateSelector } from "@/components/traffic-reports/TemplateSelector";
import { TemplateCustomizer } from "@/components/traffic-reports/TemplateCustomizer";
import { ClientPortalButton } from "@/components/traffic-reports/ClientPortalButton";
import { ReportContent, ViewMode } from "@/components/traffic-reports/ReportContent";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { useReportTemplates, ReportTemplate } from "@/hooks/useReportTemplates";
import { useClientPortalByToken, useManageClientPortal } from "@/hooks/useClientPortal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Lock } from "lucide-react";
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

  // Estado para modo portal
  const [period, setPeriod] = useState<string>('30');
  const [hasTrackedAccess, setHasTrackedAccess] = useState(false);

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

  // Template ativo (modo portal auto-seleciona, modo interno usa seleção do usuário)
  const effectiveTemplate = useMemo(() => {
    if (isPortalMode) {
      if (!templates.length) return null;
      const clientTemplate = templates.find(t => t.client_id === portal?.client_id);
      if (clientTemplate) return clientTemplate;
      return templates.find(t => t.is_global) || null;
    }
    return selectedTemplate;
  }, [isPortalMode, templates, portal?.client_id, selectedTemplate]);

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
      {/* Header com logo Muran - apenas modo portal */}
      {isPortalMode && (
        <header className="bg-gradient-to-r from-[#321e32] to-[#4a2d4a] py-5 px-4 md:px-8 shadow-lg">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <img 
              src="/images/muran-logo-portal.png" 
              alt="Muran - Soluções em Marketing Digital" 
              className="h-8 md:h-10"
            />
            
            {/* Badge "Dados em tempo real" */}
            <div className="flex items-center gap-2 text-white/90 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs md:text-sm font-medium">Dados em tempo real</span>
            </div>
          </div>
        </header>
      )}

      <div className="flex-1 max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 w-full">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-muran-primary to-muran-primary-glow bg-clip-text text-transparent">
              Relatórios de Tráfego
            </h1>
            <p className="text-muted-foreground">
              Análise detalhada de performance de Meta Ads e Google Ads com dados em tempo real
            </p>
          </div>
          
          {/* Botões apenas para modo interno */}
          {!isPortalMode && (
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
          )}

          {/* Seletor de período para modo portal (se permitido) */}
          {isPortalMode && portal?.allow_period_change && (
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

        {/* Filtros apenas para modo interno */}
        {!isPortalMode && (
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

        {/* Estados de seleção apenas para modo interno */}
        {!isPortalMode && !selectedClient && (
          <Alert>
            <AlertDescription>
              Selecione um cliente para visualizar os relatórios de tráfego
            </AlertDescription>
          </Alert>
        )}

        {!isPortalMode && selectedClient && selectedAccounts.length === 0 && (
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
          />
        )}

        {/* Template Customizer apenas para modo interno */}
        {!isPortalMode && (
          <TemplateCustomizer
            open={customizerOpen}
            onOpenChange={setCustomizerOpen}
            template={selectedTemplate}
            clientId={selectedClient}
          />
        )}
      </div>

      {/* Footer discreto - apenas modo portal */}
      {isPortalMode && (
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
