import { useState } from "react";
import { ExternalLink, Search, ArrowUpDown, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  status: string;
  impressions: number;
  reach?: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  spend: number;
}

interface CampaignsInsightsTableProps {
  campaigns: Campaign[];
  accountId?: string;
  showPlatformFilter?: boolean;
}

export function CampaignsInsightsTable({ campaigns, accountId, showPlatformFilter = false }: CampaignsInsightsTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Campaign>("spend");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'meta' | 'google'>('all');

  const filteredCampaigns = campaigns
    .filter(campaign =>
      campaign.name.toLowerCase().includes(search.toLowerCase()) &&
      (platformFilter === 'all' || campaign.platform === platformFilter)
    )
    .sort((a, b) => {
      const aVal = a[sortField] as number;
      const bVal = b[sortField] as number;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const handleSort = (field: keyof Campaign) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(Math.round(value));

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active' || s === 'enabled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
          Ativa
        </span>
      );
    }
    if (s === 'paused') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-500/15 text-amber-300 border-amber-500/30">
          Pausada
        </span>
      );
    }
    if (s === 'archived') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-white/[0.06] text-white/55 border-white/10">
          Arquivada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-white/[0.06] text-white/70 border-white/10">
        {status}
      </span>
    );
  };

  const openInPlatform = (campaign: Campaign) => {
    if (campaign.platform === 'meta' && accountId) {
      window.open(`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${accountId}`, '_blank');
    } else if (campaign.platform === 'google') {
      window.open('https://ads.google.com/aw/campaigns', '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {showPlatformFilter && (
            <div className="inline-flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <button
                onClick={() => setPlatformFilter('all')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  platformFilter === 'all'
                    ? "bg-[#ff6e00] text-white shadow-[0_4px_12px_-4px_rgba(255,110,0,0.5)]"
                    : "text-white/55 hover:text-white/85 hover:bg-white/[0.04]"
                )}
              >
                Todas
              </button>
              <button
                onClick={() => setPlatformFilter('meta')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5",
                  platformFilter === 'meta'
                    ? "bg-[#1877f2] text-white shadow-[0_4px_12px_-4px_rgba(24,119,242,0.5)]"
                    : "text-white/55 hover:text-white/85 hover:bg-white/[0.04]"
                )}
              >
                <Facebook className="h-3 w-3" /> Meta
              </button>
              <button
                onClick={() => setPlatformFilter('google')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5",
                  platformFilter === 'google'
                    ? "bg-[#34a853] text-white shadow-[0_4px_12px_-4px_rgba(52,168,83,0.5)]"
                    : "text-white/55 hover:text-white/85 hover:bg-white/[0.04]"
                )}
              >
                <Search className="h-3 w-3" /> Google
              </button>
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar campanha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6e00]/50 focus:bg-white/[0.06] transition-colors"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.01]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-white/55 px-4 py-3">Campanha</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-white/55 px-4 py-3">Status</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-white/55 px-4 py-3">Plataforma</th>
                {[
                  ['impressions', 'Impressões'],
                  ['clicks', 'Cliques'],
                  ['ctr', 'CTR'],
                  ['conversions', 'Conversões'],
                  ['cpa', 'CPA'],
                  ['spend', 'Investimento'],
                ].map(([field, label]) => (
                  <th
                    key={field}
                    className="text-right text-[10px] font-semibold uppercase tracking-wider text-white/55 px-4 py-3 cursor-pointer hover:text-white/85 select-none"
                    onClick={() => handleSort(field as keyof Campaign)}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {label}
                      <ArrowUpDown className={cn("h-3 w-3 transition-opacity", sortField === field ? "opacity-100 text-[#ff6e00]" : "opacity-40")} />
                    </div>
                  </th>
                ))}
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-white/55 px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-white/45 py-10 text-sm">
                    Nenhuma campanha encontrada
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <tr
                    key={`${campaign.platform}-${campaign.id}`}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-sm text-white/90 truncate" title={campaign.name}>
                        {campaign.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(campaign.status)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          campaign.platform === 'meta'
                            ? "bg-[#1877f2]/15 text-blue-300 border-[#1877f2]/30"
                            : "bg-[#34a853]/15 text-emerald-300 border-[#34a853]/30"
                        )}
                      >
                        {campaign.platform === 'meta' ? (
                          <><Facebook className="h-2.5 w-2.5" /> Meta</>
                        ) : (
                          <><Search className="h-2.5 w-2.5" /> Google</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white/85 tabular-nums">{formatNumber(campaign.impressions)}</td>
                    <td className="px-4 py-3 text-right text-sm text-white/85 tabular-nums">{formatNumber(campaign.clicks)}</td>
                    <td className="px-4 py-3 text-right text-sm text-blue-300 tabular-nums font-medium">{campaign.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right text-sm text-emerald-300 tabular-nums font-medium">{formatNumber(campaign.conversions)}</td>
                    <td className="px-4 py-3 text-right text-sm text-white/85 tabular-nums">{formatCurrency(campaign.cpa)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-[#ff8c33] tabular-nums">{formatCurrency(campaign.spend)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openInPlatform(campaign)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-white/55 hover:text-[#ff6e00] hover:bg-white/[0.05] transition-colors"
                        title="Abrir na plataforma"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-white/45">
        Exibindo {filteredCampaigns.length} de {campaigns.length} campanhas
      </p>
    </div>
  );
}
