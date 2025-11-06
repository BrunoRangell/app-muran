import { useState } from "react";
import { subDays } from "date-fns";
import { TrafficReportFilters } from "@/components/traffic-reports/TrafficReportFilters";
import { InsightsOverview } from "@/components/traffic-reports/InsightsOverview";
import { CampaignsInsightsTable } from "@/components/traffic-reports/CampaignsInsightsTable";
import { InsightsConversionFunnel } from "@/components/traffic-reports/InsightsConversionFunnel";
import { TrendCharts } from "@/components/traffic-reports/TrendCharts";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TrafficReports = () => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<'meta' | 'google' | 'both'>('both');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });

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
    accountId: selectedAccount,
    platform: selectedPlatform,
    dateRange: {
      start: dateRange.start.toISOString().split('T')[0],
      end: dateRange.end.toISOString().split('T')[0]
    },
    compareWithPrevious: true
  });

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    setSelectedAccount(""); // Reset account when client changes
  };

  const handlePlatformChange = (platform: 'meta' | 'google' | 'both') => {
    setSelectedPlatform(platform);
    setSelectedAccount(""); // Reset account when platform changes
  };

  const isLoading = isLoadingClients || isLoadingAccounts || isLoadingInsights;
  const hasSelection = selectedClient && selectedAccount;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Relatórios de Tráfego</h1>
          <p className="text-muted-foreground">
            Análise detalhada de performance de Meta Ads e Google Ads com dados em tempo real
          </p>
        </div>

        {/* Filtros */}
        <TrafficReportFilters
          clients={clientsData || []}
          accounts={accountsData || []}
          selectedClient={selectedClient}
          selectedAccount={selectedAccount}
          selectedPlatform={selectedPlatform}
          dateRange={dateRange}
          onClientChange={handleClientChange}
          onAccountChange={setSelectedAccount}
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
        {selectedClient && !selectedAccount && (
          <Alert>
            <AlertDescription>
              Selecione uma conta de anúncios para visualizar as métricas
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

        {/* Dados */}
        {insightsData && !isLoadingInsights && hasSelection && (
          <div className="space-y-8">
            {/* Overview Cards */}
            <InsightsOverview 
              overview={insightsData.overview}
              platform={insightsData.platform}
            />

            {/* Funil de Conversão */}
            <InsightsConversionFunnel
              data={{
                impressions: insightsData.overview.impressions.current,
                clicks: insightsData.overview.clicks.current,
                conversions: insightsData.overview.conversions.current,
                spend: insightsData.overview.spend.current,
                cpc: insightsData.overview.cpc.current,
                cpa: insightsData.overview.cpa.current,
              }}
              platform={insightsData.platform}
            />

            {/* Gráficos de Tendência */}
            {insightsData.timeSeries && insightsData.timeSeries.length > 0 && (
              <TrendCharts
                timeSeries={insightsData.timeSeries}
                overview={insightsData.overview}
                platform={insightsData.platform}
              />
            )}

            {/* Tabela de Campanhas */}
            <CampaignsInsightsTable 
              campaigns={insightsData.campaigns}
              accountId={accountsData?.find(a => a.id === selectedAccount)?.account_id}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficReports;
