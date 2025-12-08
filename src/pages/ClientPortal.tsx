import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { subDays } from "date-fns";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { ReportContent, ViewMode } from "@/components/traffic-reports/ReportContent";
import { useClientPortalByToken, useManageClientPortal } from "@/hooks/useClientPortal";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { useTrafficInsights } from "@/hooks/useTrafficInsights";
import { useReportTemplates } from "@/hooks/useReportTemplates";
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

const ClientPortal = () => {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [period, setPeriod] = useState<string>('30');
  const [hasTrackedAccess, setHasTrackedAccess] = useState(false);
  
  // Buscar dados do portal
  const { data: portal, isLoading: isLoadingPortal, error: portalError } = useClientPortalByToken(accessToken);
  const { trackAccess } = useManageClientPortal();

  // Rastrear acesso uma vez
  useEffect(() => {
    if (portal && accessToken && !hasTrackedAccess) {
      trackAccess.mutate(accessToken);
      setHasTrackedAccess(true);
    }
  }, [portal, accessToken, hasTrackedAccess, trackAccess]);

  // Calcular date range baseado no período
  const dateRange = useMemo(() => ({
    start: subDays(new Date(), parseInt(period)),
    end: new Date()
  }), [period]);

  // Determinar plataforma
  const selectedPlatform = (portal?.default_platform as 'meta' | 'google' | 'both') || 'both';

  // Buscar contas do cliente
  const { data: accountsData } = useClientAccounts(
    portal?.client_id,
    selectedPlatform === 'both' ? undefined : selectedPlatform
  );

  // Buscar templates (usa o template do cliente se existir)
  const { templates } = useReportTemplates(portal?.client_id);
  
  // Selecionar template do cliente ou global padrão
  const activeTemplate = useMemo(() => {
    if (!templates.length) return null;
    // Primeiro tenta encontrar um template específico do cliente
    const clientTemplate = templates.find(t => t.client_id === portal?.client_id);
    if (clientTemplate) return clientTemplate;
    // Senão, usa o primeiro template global
    return templates.find(t => t.is_global) || null;
  }, [templates, portal?.client_id]);

  // Auto-selecionar contas primárias
  const selectedAccounts = useMemo(() => {
    if (!accountsData) return [];
    
    if (selectedPlatform === 'both') {
      const metaPrimary = accountsData.find(a => a.platform === 'meta' && a.is_primary);
      const googlePrimary = accountsData.find(a => a.platform === 'google' && a.is_primary);
      return [metaPrimary?.id, googlePrimary?.id].filter(Boolean) as string[];
    }
    
    const primary = accountsData.find(a => a.platform === selectedPlatform && a.is_primary);
    return primary ? [primary.id] : [];
  }, [accountsData, selectedPlatform]);

  // Pegar accountId da conta selecionada
  const accountId = useMemo(() => {
    return accountsData?.find(a => selectedAccounts.includes(a.id))?.account_id;
  }, [accountsData, selectedAccounts]);

  // Buscar insights
  const { 
    data: insightsData, 
    isLoading: isLoadingInsights,
    error: insightsError
  } = useTrafficInsights({
    clientId: portal?.client_id || '',
    accountIds: selectedAccounts,
    platform: selectedPlatform,
    dateRange: {
      start: dateRange.start.toISOString().split('T')[0],
      end: dateRange.end.toISOString().split('T')[0]
    },
    compareWithPrevious: true
  });

  // Estado de loading inicial
  if (isLoadingPortal) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-muran-primary mx-auto" />
            <p className="text-muted-foreground">Carregando relatório...</p>
          </div>
        </div>
      </ClientPortalLayout>
    );
  }

  // Portal não encontrado ou inativo
  if (!portal || portalError) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
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
      </ClientPortalLayout>
    );
  }

  const clientName = portal.clients?.company_name;

  return (
    <ClientPortalLayout clientName={clientName}>
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Header com seletor de período */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-muran-primary to-muran-primary-glow bg-clip-text text-transparent">
              Relatório de Performance
            </h2>
            <p className="text-muted-foreground text-sm">
              Dados atualizados em tempo real das suas campanhas
            </p>
          </div>

          {portal.allow_period_change && (
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

        {/* Conteúdo do relatório (componente compartilhado) */}
        <ReportContent
          insightsData={insightsData}
          platform={selectedPlatform}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          template={activeTemplate}
          accountId={accountId}
          isLoading={isLoadingInsights}
          error={insightsError}
        />
      </div>
    </ClientPortalLayout>
  );
};

export default ClientPortal;
