import { useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MasterTrafficReport } from "./MasterTrafficReport";

export type ViewMode = 'combined' | 'meta' | 'google';

interface ReportContentProps {
  insightsData: any;
  platform: 'meta' | 'google' | 'both';
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  accountId?: string;
  isLoading?: boolean;
  error?: Error | null;
  hideViewSelector?: boolean;
  clientName?: string;
  dateRange?: { start: string; end: string };
}

export function ReportContent({
  insightsData,
  platform,
  viewMode,
  isLoading,
  error,
  accountId,
  clientName,
  dateRange,
}: ReportContentProps) {
  // Determinar quais dados usar baseado no viewMode (apenas relevante quando platform='both')
  const activeData = useMemo(() => {
    if (!insightsData) return null;
    if (platform !== 'both') return insightsData;

    switch (viewMode) {
      case 'meta':
        return insightsData.metaData?.overview
          ? { ...insightsData.metaData, platform: 'meta' as const }
          : insightsData;
      case 'google':
        return insightsData.googleData?.overview
          ? { ...insightsData.googleData, platform: 'google' as const }
          : insightsData;
      case 'combined':
      default:
        return insightsData;
    }
  }, [insightsData, viewMode, platform]);

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

  if (!insightsData) return null;

  // Master Report — respeita viewMode (combined/meta/google) quando platform='both'
  const dataForReport = activeData || insightsData;
  const effectivePlatform: 'meta' | 'google' | 'both' =
    platform === 'both' && viewMode !== 'combined' ? viewMode : platform;

  return (
    <MasterTrafficReport
      data={dataForReport}
      platform={effectivePlatform}
      viewMode={viewMode}
      clientName={clientName}
      dateRange={dateRange}
      accountId={accountId}
    />
  );
}
