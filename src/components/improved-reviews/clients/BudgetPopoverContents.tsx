import { useMemo } from "react";
import { formatCurrency } from "@/utils/formatters";
import { Layers, Wallet, Eye, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampaignDetail {
  name: string;
  cost?: number;
  impressions?: number;
  status?: string;
}

interface CampaignsDetailContentProps {
  campaigns?: CampaignDetail[];
  platform: "meta" | "google";
}

export function CampaignsDetailContent({ campaigns, platform }: CampaignsDetailContentProps) {
  // Problema = ativa mas sem entrega (0 custo E 0 impressões)
  const isProblem = (c: CampaignDetail) =>
    (!c.cost || c.cost === 0) && (!c.impressions || c.impressions === 0);

  const sorted = useMemo(() => {
    const list = [...(campaigns || [])];
    // Problemas primeiro, depois maior gasto
    return list.sort((a, b) => {
      const pa = isProblem(a) ? 1 : 0;
      const pb = isProblem(b) ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return (b.cost || 0) - (a.cost || 0);
    });
  }, [campaigns]);

  const problemCount = useMemo(() => sorted.filter(isProblem).length, [sorted]);

  const totals = useMemo(() => {
    return sorted.reduce(
      (acc, c) => ({
        cost: acc.cost + (c.cost || 0),
        impressions: acc.impressions + (c.impressions || 0),
      }),
      { cost: 0, impressions: 0 }
    );
  }, [sorted]);

  const platformColor = platform === "meta" ? "#1877f2" : "#34a853";
  const platformLabel = platform === "meta" ? "Meta Ads" : "Google Ads";

  if (!sorted.length) {
    return (
      <div className="p-6 text-center">
        <Layers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Nenhuma campanha encontrada.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-gray-100"
        style={{
          background: `linear-gradient(135deg, ${platformColor}10, transparent)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${platformColor}20` }}
            >
              <Layers className="h-4 w-4" style={{ color: platformColor }} />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 leading-tight">Detalhes das Campanhas</h4>
              <p className="text-[11px] text-gray-500">{platformLabel} · {sorted.length} ativa{sorted.length > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
            <DollarSign className="h-3 w-3" />
            Custo (hoje)
          </div>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(totals.cost)}</p>
        </div>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
            <Eye className="h-3 w-3" />
            Impressões
          </div>
          <p className="text-sm font-bold text-gray-900">{totals.impressions.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto">
        {sorted.map((c, i) => {
          const pct = totals.cost > 0 ? ((c.cost || 0) / totals.cost) * 100 : 0;
          return (
            <div
              key={i}
              className="px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <p className="text-xs font-medium text-gray-900 line-clamp-2 flex-1">{c.name}</p>
                <span className="text-xs font-bold text-gray-900 whitespace-nowrap tabular-nums">
                  {formatCurrency(c.cost || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: platformColor }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums whitespace-nowrap">
                  {(c.impressions || 0).toLocaleString("pt-BR")} impr.
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BudgetItem {
  name: string;
  budget: number;
  source?: "campaign" | "adset";
  campaign_name?: string;
}

interface BudgetCompositionContentProps {
  items: BudgetItem[];
  total: number;
  platform: "meta" | "google";
}

export function BudgetCompositionContent({ items, total, platform }: BudgetCompositionContentProps) {
  const sorted = useMemo(
    () => [...(items || [])].sort((a, b) => (b.budget || 0) - (a.budget || 0)),
    [items]
  );

  const sum = useMemo(() => sorted.reduce((acc, i) => acc + (i.budget || 0), 0), [sorted]);
  const platformColor = platform === "meta" ? "#1877f2" : "#34a853";

  if (!sorted.length) {
    return (
      <div className="p-6 text-center">
        <Wallet className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Detalhamento não disponível. Analise o cliente para ver a composição.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-[#ff6e00]/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#ff6e00]/20">
              <Wallet className="h-4 w-4 text-[#ff6e00]" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 leading-tight">Composição do orçamento diário</h4>
              <p className="text-[11px] text-gray-500">{sorted.length} {sorted.length > 1 ? "itens" : "item"} ativo{sorted.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Total</p>
            <p className="text-sm font-bold text-[#ff6e00]">{formatCurrency(total || sum)}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
        {sorted.map((item, i) => {
          const pct = sum > 0 ? ((item.budget || 0) / sum) * 100 : 0;
          const isAdset = item.source === "adset";
          return (
            <div key={i} className="px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1 min-w-0">
                  {isAdset && item.campaign_name && (
                    <p className="text-[10px] text-gray-400 truncate uppercase tracking-wide">
                      {item.campaign_name}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5">
                    {isAdset && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-gray-200 text-gray-500">
                        Adset
                      </Badge>
                    )}
                    <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-900 whitespace-nowrap tabular-nums">
                  {formatCurrency(item.budget || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: platformColor }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums whitespace-nowrap w-10 text-right">
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer total */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <TrendingUp className="h-3.5 w-3.5" />
          Soma diária
        </div>
        <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(total || sum)}</span>
      </div>
    </div>
  );
}
