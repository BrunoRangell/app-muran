import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { subDays } from "date-fns";
import { TrafficReportFilters } from "@/components/traffic-reports/TrafficReportFilters";
import { TemplateSelector } from "@/components/traffic-reports/TemplateSelector";
import { TemplateCustomizer } from "@/components/traffic-reports/TemplateCustomizer";
import { ClientPortalButton } from "@/components/traffic-reports/ClientPortalButton";
import { ReportContent, ViewMode } from "@/components/traffic-reports/ReportContent";
import { PortalHeader } from "@/components/traffic-reports/PortalHeader";
import { ClientLogoUpload } from "@/components/traffic-reports/ClientLogoUpload";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { useReportTemplates, ReportTemplate } from "@/hooks/useReportTemplates";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Eye, X, Image } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TrafficReportsEditor = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  // Estados do editor
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<'meta' | 'google' | 'both'>('both');
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'logo'>('editor');

  // Buscar dados do cliente
  const { data: clientsData, isLoading: isLoadingClients } = useUnifiedData();
  const client = useMemo(() => 
    clientsData?.find(c => c.id === clientId),
    [clientsData, clientId]
  );

  // Buscar contas do cliente
  const { data: accountsData, isLoading: isLoadingAccounts } = useClientAccounts(
    clientId || '',
    selectedPlatform === 'both' ? undefined : selectedPlatform
  );

  // Auto-selecionar contas primárias quando carrega
  useEffect(() => {
    if (accountsData && selectedAccounts.length === 0) {
      if (selectedPlatform === 'both') {
        const metaPrimary = accountsData.find(a => a.platform === 'meta' && a.is_primary);
        const googlePrimary = accountsData.find(a => a.platform === 'google' && a.is_primary);
        const autoSelected = [];
        if (metaPrimary) autoSelected.push(metaPrimary.id);
        if (googlePrimary) autoSelected.push(googlePrimary.id);
        setSelectedAccounts(autoSelected);
      } else {
        const primaryAccount = accountsData.find(a => a.platform === selectedPlatform && a.is_primary);
        if (primaryAccount) setSelectedAccounts([primaryAccount.id]);
      }
    }
  }, [accountsData, selectedPlatform]);

  // Buscar templates
  const { templates } = useReportTemplates(clientId || undefined);

  // Buscar insights de tráfego
  const { 
    data: insightsData, 
    isLoading: isLoadingInsights,
    error: insightsError,
    refetch
  } = useTrafficInsights({
    clientId: clientId || '',
    accountIds: selectedAccounts,
    platform: selectedPlatform,
    dateRange: {
      start: dateRange.start.toISOString().split('T')[0],
      end: dateRange.end.toISOString().split('T')[0]
    },
    compareWithPrevious: true
  });

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

  const hasSelection = clientId && selectedAccounts.length > 0;

  const accountId = useMemo(() => {
    return accountsData?.find(a => selectedAccounts.includes(a.id))?.account_id;
  }, [accountsData, selectedAccounts]);

  if (isLoadingClients) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muran-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Cliente não encontrado</p>
          <Button onClick={() => navigate('/relatorios-trafego')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Banner de modo preview */}
      {previewMode && (
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

      {/* Header do portal em modo preview */}
      {previewMode && (
        <div className="mt-10">
          <PortalHeader
            clientName={client.company_name}
            clientLogoUrl={(client as any).logo_url}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            hasMetaData={!!insightsData?.metaData}
            hasGoogleData={!!insightsData?.googleData}
            showTabs={selectedPlatform === 'both'}
          />
        </div>
      )}

      <div className="flex-1 max-w-[1600px] mx-auto p-4 md:p-8 space-y-6 w-full">
        {/* Header do modo editor */}
        {!previewMode && (
          <>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/relatorios-trafego')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {/* Logo do cliente */}
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 flex items-center justify-center overflow-hidden border border-border/50">
                    {(client as any).logo_url ? (
                      <img 
                        src={(client as any).logo_url} 
                        alt={client.company_name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xl font-bold text-muran-primary">
                        {client.company_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{client.company_name}</h1>
                    <p className="text-sm text-muted-foreground">Editor de Relatório</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(true)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Visualizar como Cliente
                </Button>
                
                <ClientPortalButton 
                  clientId={clientId!} 
                  clientName={client.company_name}
                />
                
                <TemplateSelector
                  selectedTemplateId={selectedTemplate?.id}
                  onTemplateSelect={setSelectedTemplate}
                  onCustomize={() => setCustomizerOpen(true)}
                  clientId={clientId}
                />
              </div>
            </div>

            {/* Tabs: Editor / Logo */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'logo')}>
              <TabsList>
                <TabsTrigger value="editor">Relatório</TabsTrigger>
                <TabsTrigger value="logo" className="gap-2">
                  <Image className="h-4 w-4" />
                  Logo do Cliente
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-6 mt-6">
                {/* Filtros */}
                <TrafficReportFilters
                  clients={[]}
                  accounts={accountsData || []}
                  selectedClient={clientId || ''}
                  selectedAccounts={selectedAccounts}
                  selectedPlatform={selectedPlatform}
                  dateRange={dateRange}
                  onClientChange={() => {}}
                  onAccountsChange={setSelectedAccounts}
                  onPlatformChange={handlePlatformChange}
                  onDateRangeChange={setDateRange}
                  onRefresh={() => refetch()}
                  isLoading={isLoadingInsights}
                  hideClientSelector
                />

                {/* Alert se não houver contas */}
                {selectedAccounts.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Selecione pelo menos uma conta de anúncios para visualizar as métricas
                    </AlertDescription>
                  </Alert>
                )}

                {/* Conteúdo do relatório */}
                {hasSelection && (
                  <ReportContent
                    insightsData={insightsData}
                    platform={selectedPlatform}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    template={selectedTemplate}
                    accountId={accountId}
                    isLoading={isLoadingInsights}
                    error={insightsError}
                  />
                )}
              </TabsContent>

              <TabsContent value="logo" className="mt-6">
                <ClientLogoUpload 
                  clientId={clientId!}
                  clientName={client.company_name}
                  currentLogoUrl={(client as any).logo_url}
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Conteúdo em modo preview (sem controles) */}
        {previewMode && hasSelection && (
          <ReportContent
            insightsData={insightsData}
            platform={selectedPlatform}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            template={selectedTemplate}
            accountId={accountId}
            isLoading={isLoadingInsights}
            error={insightsError}
            hideViewSelector
          />
        )}

        {/* Template Customizer */}
        <TemplateCustomizer
          open={customizerOpen}
          onOpenChange={setCustomizerOpen}
          template={selectedTemplate}
          clientId={clientId}
        />
      </div>

      {/* Footer em modo preview */}
      {previewMode && (
        <footer className="py-6 text-center border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="text-muran-primary font-semibold">Muran</span>
          </p>
        </footer>
      )}
    </div>
  );
};

export default TrafficReportsEditor;
