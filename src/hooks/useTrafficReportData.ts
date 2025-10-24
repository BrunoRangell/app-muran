import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRangeFilter, TrafficReportData, MetricVariation } from "@/types/traffic-report";
import { subDays, format, eachDayOfInterval, parseISO } from "date-fns";

const calculateVariation = (current: number, previous: number): MetricVariation => {
  const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const absoluteChange = current - previous;
  
  return {
    current,
    previous,
    percentChange,
    absoluteChange,
  };
};

const fetchTrafficReportData = async (
  clientId: string,
  dateRange: DateRangeFilter
): Promise<TrafficReportData> => {
  // Calcular período anterior para comparação
  const currentStart = parseISO(dateRange.startDate);
  const currentEnd = parseISO(dateRange.endDate);
  const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
  
  const previousStart = subDays(currentStart, daysDiff);
  const previousEnd = subDays(currentEnd, daysDiff);

  // Buscar dados do cliente
  const { data: client } = await supabase
    .from('clients')
    .select('company_name')
    .eq('id', clientId)
    .single();

  // Buscar campaign_health para o período atual
  const { data: currentCampaigns } = await supabase
    .from('campaign_health')
    .select('*')
    .eq('client_id', clientId)
    .gte('snapshot_date', dateRange.startDate)
    .lte('snapshot_date', dateRange.endDate);

  // Buscar campaign_health para o período anterior
  const { data: previousCampaigns } = await supabase
    .from('campaign_health')
    .select('*')
    .eq('client_id', clientId)
    .gte('snapshot_date', format(previousStart, 'yyyy-MM-dd'))
    .lte('snapshot_date', format(previousEnd, 'yyyy-MM-dd'));

  // Buscar budget_reviews para investimento
  const { data: currentBudgets } = await supabase
    .from('budget_reviews')
    .select('*')
    .eq('client_id', clientId)
    .gte('review_date', dateRange.startDate)
    .lte('review_date', dateRange.endDate);

  const { data: previousBudgets } = await supabase
    .from('budget_reviews')
    .select('*')
    .eq('client_id', clientId)
    .gte('review_date', format(previousStart, 'yyyy-MM-dd'))
    .lte('review_date', format(previousEnd, 'yyyy-MM-dd'));

  // Processar métricas gerais
  const currentImpressions = currentCampaigns?.reduce((sum, c) => sum + (c.impressions_today || 0), 0) || 0;
  const previousImpressions = previousCampaigns?.reduce((sum, c) => sum + (c.impressions_today || 0), 0) || 0;
  
  const currentInvestment = currentBudgets?.reduce((sum, b) => sum + Number(b.total_spent || 0), 0) || 0;
  const previousInvestment = previousBudgets?.reduce((sum, b) => sum + Number(b.total_spent || 0), 0) || 0;

  // Extrair leads das campanhas detalhadas
  const extractLeads = (campaigns: any[]) => {
    return campaigns?.reduce((sum, campaign) => {
      const details = campaign.campaigns_detailed || [];
      const campaignLeads = details.reduce((cSum: number, detail: any) => {
        return cSum + (detail.conversions || detail.leads || 0);
      }, 0);
      return sum + campaignLeads;
    }, 0) || 0;
  };

  const currentLeads = extractLeads(currentCampaigns || []);
  const previousLeads = extractLeads(previousCampaigns || []);

  // Gerar série temporal de leads por dia
  const dateInterval = eachDayOfInterval({ start: currentStart, end: currentEnd });
  const leadsTimeSeries = dateInterval.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayCampaigns = currentCampaigns?.filter(c => c.snapshot_date === dateStr) || [];
    const dayBudgets = currentBudgets?.filter(b => b.review_date === dateStr) || [];
    
    const dayLeads = extractLeads(dayCampaigns);
    const metaLeads = extractLeads(dayCampaigns.filter(c => c.platform === 'meta'));
    const googleLeads = extractLeads(dayCampaigns.filter(c => c.platform === 'google'));
    const dayInvestment = dayBudgets.reduce((sum, b) => sum + Number(b.total_spent || 0), 0);
    
    return {
      date: dateStr,
      metaLeads,
      googleLeads,
      totalLeads: dayLeads,
      investment: dayInvestment,
      costPerLead: dayLeads > 0 ? dayInvestment / dayLeads : 0,
    };
  });

  // Processar campanhas Meta
  const metaCampaignsData = currentCampaigns
    ?.filter(c => c.platform === 'meta')
    .flatMap(c => {
      const details = Array.isArray(c.campaigns_detailed) ? c.campaigns_detailed : [];
      return details.map((detail: any) => ({
        name: detail.name || 'Sem nome',
        investment: Number(detail.spend || 0),
        reach: detail.reach || 0,
        frequency: detail.frequency || 0,
        cpm: detail.cpm || 0,
        clicks: detail.clicks || 0,
        ctr: detail.ctr || 0,
        cpc: detail.cpc || 0,
        conversions: detail.conversions || detail.leads || 0,
        costPerConversion: detail.cost_per_conversion || 0,
      }));
    }) || [];

  // Processar campanhas Google
  const googleCampaignsData = currentCampaigns
    ?.filter(c => c.platform === 'google')
    .flatMap(c => {
      const details = Array.isArray(c.campaigns_detailed) ? c.campaigns_detailed : [];
      return details.map((detail: any) => ({
        name: detail.name || 'Sem nome',
        investment: Number(detail.cost || 0),
        reach: 0,
        impressions: detail.impressions || 0,
        clicks: detail.clicks || 0,
        ctr: detail.ctr || 0,
        cpc: detail.cpc || 0,
        conversions: detail.conversions || 0,
        costPerConversion: detail.cost_per_conversion || 0,
      }));
    }) || [];

  // Calcular funis
  const metaTotalImpressions = currentCampaigns
    ?.filter(c => c.platform === 'meta')
    .reduce((sum, c) => sum + (c.impressions_today || 0), 0) || 0;
  
  const metaTotalClicks = metaCampaignsData.reduce((sum, c) => sum + c.clicks, 0);
  const metaTotalConversions = metaCampaignsData.reduce((sum, c) => sum + c.conversions, 0);

  const googleTotalImpressions = currentCampaigns
    ?.filter(c => c.platform === 'google')
    .reduce((sum, c) => sum + (c.impressions_today || 0), 0) || 0;
  
  const googleTotalClicks = googleCampaignsData.reduce((sum, c) => sum + c.clicks, 0);
  const googleTotalConversions = googleCampaignsData.reduce((sum, c) => sum + c.conversions, 0);

  return {
    clientId,
    clientName: client?.company_name || 'Cliente',
    dateRange,
    overview: {
      reach: calculateVariation(currentImpressions, previousImpressions),
      boosted: calculateVariation(
        currentCampaigns?.filter(c => c.active_campaigns_count > 0).length || 0,
        previousCampaigns?.filter(c => c.active_campaigns_count > 0).length || 0
      ),
      videoViews: calculateVariation(0, 0), // Implementar quando disponível
      leads: calculateVariation(currentLeads, previousLeads),
      investment: calculateVariation(currentInvestment, previousInvestment),
    },
    leadsTimeSeries,
    metaCampaigns: metaCampaignsData,
    googleCampaigns: googleCampaignsData,
    metaFunnel: {
      impressions: metaTotalImpressions,
      clicks: metaTotalClicks,
      conversions: metaTotalConversions,
      clickRate: metaTotalImpressions > 0 ? (metaTotalClicks / metaTotalImpressions) * 100 : 0,
      conversionRate: metaTotalClicks > 0 ? (metaTotalConversions / metaTotalClicks) * 100 : 0,
    },
    googleFunnel: {
      impressions: googleTotalImpressions,
      clicks: googleTotalClicks,
      conversions: googleTotalConversions,
      clickRate: googleTotalImpressions > 0 ? (googleTotalClicks / googleTotalImpressions) * 100 : 0,
      conversionRate: googleTotalClicks > 0 ? (googleTotalConversions / googleTotalClicks) * 100 : 0,
    },
    demographics: {
      byAge: [], // Implementar quando disponível
      byGender: [], // Implementar quando disponível
    },
  };
};

export const useTrafficReportData = (clientId: string, dateRange: DateRangeFilter) => {
  return useQuery({
    queryKey: ['traffic-report', clientId, dateRange],
    queryFn: () => fetchTrafficReportData(clientId, dateRange),
    enabled: !!clientId && !!dateRange.startDate && !!dateRange.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
