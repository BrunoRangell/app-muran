import { useState } from "react";
import { format, subDays } from "date-fns";
import { TrafficReportHeader } from "@/components/traffic-reports/TrafficReportHeader";
import { OverviewCards } from "@/components/traffic-reports/OverviewCards";
import { LeadsChart } from "@/components/traffic-reports/LeadsChart";
import { DetailedTabs } from "@/components/traffic-reports/DetailedTabs";
import { useTrafficReportData } from "@/hooks/useTrafficReportData";
import { DateRangeFilter } from "@/types/traffic-report";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TrafficReports = () => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: reportData, isLoading, error, refetch } = useTrafficReportData(
    selectedClient,
    dateRange
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        <TrafficReportHeader
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={() => refetch()}
        />

        {!selectedClient && (
          <Alert>
            <AlertDescription>
              Selecione um cliente para visualizar o relatório de tráfego
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muran-primary" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Erro ao carregar dados: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {reportData && !isLoading && (
          <div className="space-y-6">
            {/* Cards de Overview */}
            <OverviewCards metrics={reportData.overview} />

            {/* Gráfico de Leads */}
            <LeadsChart data={reportData.leadsTimeSeries} />

            {/* Abas Detalhadas */}
            <DetailedTabs
              metaCampaigns={reportData.metaCampaigns}
              googleCampaigns={reportData.googleCampaigns}
              metaFunnel={reportData.metaFunnel}
              googleFunnel={reportData.googleFunnel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficReports;
