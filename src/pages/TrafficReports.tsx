import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { subDays } from "date-fns";
import { TrafficReportFilters } from "@/components/traffic-reports/TrafficReportFilters";
import { ClientPortalButton } from "@/components/traffic-reports/ClientPortalButton";
import { ReportContent, ViewMode } from "@/components/traffic-reports/ReportContent";
import { PortalHeader } from "@/components/traffic-reports/PortalHeader";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { useClientPortalByToken, useManageClientPortal } from "@/hooks/useClientPortal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Lock, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
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

  // Estado para modo preview (visualizar como cliente)
  const [previewMode, setPreviewMode] = useState(false);

  // Estado para modo portal
  const [period, setPeriod] = useState<string>('30');
  const [hasTrackedAccess, setHasTrackedAccess] = useState(false);

  const showPortalElements = isPortalMode || previewMode;

  // Buscar dados do portal (apenas em modo portal)
  const { data: portal, isLoading: isLoadingPortal, error: portalError } = useClientPortalByToken(
    isPortalMode ? accessToken : undefined
  );
  const { trackAccess } = useManageClientPortal();

  useEffect(() => {
    if (isPortalMode && portal && accessToken && !hasTrackedAccess) {
      trackAccess.mutate(accessToken);
      setHasTrackedAccess(true);
    }
  }, [isPortalMode, portal, accessToken, hasTrackedAccess, trackAccess]);

  const effectiveClientId = isPortalMode ? portal?.client_id || '' : selectedClient;
  const effectivePlatform = isPortalMode
    ? (portal?.default_platform as 'meta' | 'google' | 'both') || 'both'
    : selectedPlatform;

  const effectiveDateRange = useMemo(() => {
    if (isPortalMode) {
      return {
        start: subDays(new Date(), parseInt(period)),
        end: new Date()
      };
    }
    return dateRange;
  }, [isPortalMode, period, dateRange]);

  const { data: clientsData } = useUnifiedData();

  const { data: accountsData } = useClientAccounts(
    effectiveClientId,
    effectivePlatform === 'both' ? undefined : effectivePlatform,
    isPortalMode ? accessToken : undefined
  );

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
    compareWithPrevious: true,
    portalAccessToken: isPortalMode ? accessToken : undefined,
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
      const autoSelected: string[] = [];
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

  const clientName = isPortalMode
    ? portal?.clients?.company_name
    : clientsData?.find(c => c.id === selectedClient)?.company_name;

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

  const portalShellStyle = showPortalElements
    ? { background: "radial-gradient(ellipse at top, #1a1030 0%, #0B0F1A 50%)" }
    : undefined;

  return (
    <div
      className={cn("min-h-screen flex flex-col", !showPortalElements && "bg-muted/30")}
      style={portalShellStyle}
    >
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

      {/* Header do portal — modo portal OU preview */}
      {showPortalElements && (
        <div className={previewMode && !isPortalMode ? 'mt-10' : ''}>
          <PortalHeader
            clientName={clientName}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            hasMetaData={!!insightsData?.metaData}
            hasGoogleData={!!insightsData?.googleData}
            showTabs={effectivePlatform === 'both'}
          />
        </div>
      )}

      <div className={hasSelection ? "flex-1 w-full" : "flex-1 max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 w-full"}>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(true)}
                className="gap-2"
                disabled={!selectedClient}
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
            </div>
          </div>
        )}

        {/* Seletor de período para portal */}
        {showPortalElements && isPortalMode && portal?.allow_period_change && (
          <div className="flex items-center justify-end gap-4 flex-wrap p-4">
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
            accountId={accountId}
            isLoading={isLoadingInsights}
            error={insightsError}
            hideViewSelector={showPortalElements}
            clientName={clientName}
            dateRange={{
              start: effectiveDateRange.start.toISOString().split('T')[0],
              end: effectiveDateRange.end.toISOString().split('T')[0],
            }}
          />
        )}
      </div>

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
