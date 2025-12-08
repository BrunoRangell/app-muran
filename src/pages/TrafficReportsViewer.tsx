import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subDays } from "date-fns";
import { ReportContent, ViewMode } from "@/components/traffic-reports/ReportContent";
import { PortalHeader } from "@/components/traffic-reports/PortalHeader";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { useReportTemplates, ReportTemplate } from "@/hooks/useReportTemplates";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, RefreshCw, Loader2 } from "lucide-react";
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

const TrafficReportsViewer = () => {
  const navigate = useNavigate();

  // Estados dos seletores
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<'meta' | 'google' | 'both'>('both');
  const [period, setPeriod] = useState<string>('30');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>('combined');

  // Buscar clientes
  const { data: clientsData, isLoading: isLoadingClients } = useUnifiedData();
  const activeClients = useMemo(() => 
    clientsData?.filter(c => c.status === 'active') || [], 
    [clientsData]
  );

  // Buscar contas do cliente
  const { data: accountsData, isLoading: isLoadingAccounts } = useClientAccounts(
    selectedClient,
    selectedPlatform === 'both' ? undefined : selectedPlatform
  );

  // Buscar templates
  const { templates } = useReportTemplates(selectedClient || undefined);
  
  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return templates.find(t => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  // Auto-selecionar contas primárias quando muda cliente/plataforma
  useEffect(() => {
    if (!accountsData || accountsData.length === 0) {
      setSelectedAccounts([]);
      return;
    }

    if (selectedPlatform === 'both') {
      const metaPrimary = accountsData.find(a => a.platform === 'meta' && a.is_primary);
      const googlePrimary = accountsData.find(a => a.platform === 'google' && a.is_primary);
      const autoSelected = [];
      if (metaPrimary) autoSelected.push(metaPrimary.id);
      if (googlePrimary) autoSelected.push(googlePrimary.id);
      setSelectedAccounts(autoSelected);
    } else {
      const primary = accountsData.find(a => a.platform === selectedPlatform && a.is_primary);
      setSelectedAccounts(primary ? [primary.id] : []);
    }
  }, [accountsData, selectedPlatform]);

  // Calcular date range
  const dateRange = useMemo(() => ({
    start: subDays(new Date(), parseInt(period)),
    end: new Date()
  }), [period]);

  // Buscar insights
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
    setSelectedAccounts([]);
    setViewMode('combined');
  };

  const handlePlatformChange = (platform: 'meta' | 'google' | 'both') => {
    setSelectedPlatform(platform);
    setViewMode('combined');
  };

  const hasSelection = selectedClient && selectedAccounts.length > 0;

  const accountId = useMemo(() => {
    return accountsData?.find(a => selectedAccounts.includes(a.id))?.account_id;
  }, [accountsData, selectedAccounts]);

  const selectedClientData = useMemo(() => 
    clientsData?.find(c => c.id === selectedClient),
    [clientsData, selectedClient]
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Barra de controles fixa */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/relatorios-trafego")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Cliente */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Cliente:</Label>
              <Select value={selectedClient} onValueChange={handleClientChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {activeClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plataforma */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Plataforma:</Label>
              <Select value={selectedPlatform} onValueChange={handlePlatformChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Meta + Google</SelectItem>
                  <SelectItem value="meta">Meta Ads</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conta */}
            {selectedClient && accountsData && accountsData.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Conta:</Label>
                <Select 
                  value={selectedAccounts[0] || ""} 
                  onValueChange={(val) => setSelectedAccounts([val])}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accountsData
                      .filter(a => selectedPlatform === 'both' || a.platform === selectedPlatform)
                      .map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Período */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[160px]">
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

            {/* Template */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Template:</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Padrão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Visualização Padrão</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Atualizar */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={!hasSelection || isLoadingInsights}
              className="gap-2 ml-auto"
            >
              {isLoadingInsights ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Header do Portal (visão do cliente) */}
      {hasSelection && (
        <PortalHeader
          clientName={selectedClientData?.company_name}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasMetaData={!!insightsData?.metaData}
          hasGoogleData={!!insightsData?.googleData}
          showTabs={selectedPlatform === 'both'}
        />
      )}

      {/* Conteúdo */}
      <div className="flex-1 max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 w-full">
        {!selectedClient ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Selecione um cliente para visualizar o relatório
            </p>
          </div>
        ) : !hasSelection ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Nenhuma conta de anúncios encontrada para este cliente
            </p>
          </div>
        ) : (
          <ReportContent
            insightsData={insightsData}
            platform={selectedPlatform}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            template={selectedTemplate}
            accountId={accountId}
            isLoading={isLoadingInsights}
            error={insightsError}
            hideViewSelector={true}
          />
        )}
      </div>

      {/* Footer */}
      {hasSelection && (
        <footer className="py-6 text-center border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="text-muran-primary font-semibold">Muran</span>
          </p>
        </footer>
      )}
    </div>
  );
};

export default TrafficReportsViewer;
