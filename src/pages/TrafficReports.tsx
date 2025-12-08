import { useState, useMemo } from "react";
import { subDays } from "date-fns";
import { TrafficReportFilters } from "@/components/traffic-reports/TrafficReportFilters";
import { TemplateSelector } from "@/components/traffic-reports/TemplateSelector";
import { TemplateCustomizer } from "@/components/traffic-reports/TemplateCustomizer";
import { ClientPortalButton } from "@/components/traffic-reports/ClientPortalButton";
import { ReportContent, ViewMode } from "@/components/traffic-reports/ReportContent";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { ReportTemplate } from "@/hooks/useReportTemplates";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    setViewMode('combined');
    
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

  const hasSelection = selectedClient && selectedAccounts.length > 0;

  // Pegar accountId da conta selecionada para a tabela de campanhas
  const accountId = useMemo(() => {
    return accountsData?.find(a => selectedAccounts.includes(a.id))?.account_id;
  }, [accountsData, selectedAccounts]);

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

        {/* Conteúdo do relatório (componente compartilhado) */}
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
