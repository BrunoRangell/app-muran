import { Activity, Eye, Play, Pause, BarChart3, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FilterState } from "./SmartFilters";

interface RealTimeMonitoringProps {
  filters: FilterState;
}

// Mock data - em produção viria da API
const mockMonitoringData = [
  {
    id: 1,
    client: "Cliente ABC",
    platform: "meta" as const,
    campaigns: [
      {
        name: "Campanha Verão 2024",
        status: "active" as const,
        dailyBudget: 200,
        spentToday: 145,
        spentPercent: 72.5,
        impressions: 15420,
        clicks: 324,
        conversions: 12,
        ctr: 2.1,
        cpc: 4.47,
        lastUpdate: "2024-01-20T14:30:00"
      }
    ]
  },
  {
    id: 2,
    client: "Cliente XYZ",
    platform: "google" as const,
    campaigns: [
      {
        name: "Shopping - Produtos Casa",
        status: "paused" as const,
        dailyBudget: 180,
        spentToday: 0,
        spentPercent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        lastUpdate: "2024-01-20T08:15:00"
      },
      {
        name: "Search - Marca",
        status: "active" as const,
        dailyBudget: 120,
        spentToday: 89,
        spentPercent: 74.2,
        impressions: 8750,
        clicks: 156,
        conversions: 8,
        ctr: 1.8,
        cpc: 5.71,
        lastUpdate: "2024-01-20T14:25:00"
      }
    ]
  }
];

const statusConfig = {
  active: {
    icon: Play,
    color: "text-green-600",
    bg: "bg-green-100 text-green-800",
    label: "Ativa"
  },
  paused: {
    icon: Pause,
    color: "text-orange-600",
    bg: "bg-orange-100 text-orange-800", 
    label: "Pausada"
  },
  ended: {
    icon: Clock,
    color: "text-gray-600",
    bg: "bg-gray-100 text-gray-800",
    label: "Finalizada"
  }
};

const getSpentColor = (percent: number) => {
  if (percent >= 90) return "text-red-600";
  if (percent >= 75) return "text-orange-600";
  return "text-green-600";
};

const getTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}min atrás`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d atrás`;
};

export const RealTimeMonitoring = ({ filters }: RealTimeMonitoringProps) => {
  // Filtrar dados baseado nos filtros
  const filteredData = mockMonitoringData.filter(item => {
    if (filters.clientSearch && !item.client.toLowerCase().includes(filters.clientSearch.toLowerCase())) {
      return false;
    }
    if (filters.platform !== "all" && item.platform !== filters.platform) {
      return false;
    }
    return true;
  });

  // Calcular totais
  const totalCampaigns = filteredData.reduce((acc, client) => acc + client.campaigns.length, 0);
  const activeCampaigns = filteredData.reduce((acc, client) => 
    acc + client.campaigns.filter(c => c.status === "active").length, 0);
  
  let totalSpentToday = 0;
  let totalBudgetToday = 0;
  
  filteredData.forEach(client => {
    client.campaigns.forEach(campaign => {
      totalSpentToday += campaign.spentToday;
      totalBudgetToday += campaign.dailyBudget;
    });
  });

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-muran-primary" />
          <h2 className="text-2xl font-semibold text-muran-dark">Monitoramento em Tempo Real</h2>
        </div>
        <div className="text-sm text-muran-dark/60">
          Última atualização: {getTimeAgo(new Date().toISOString())}
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muran-primary" />
              <div>
                <div className="font-semibold text-muran-dark">{totalCampaigns}</div>
                <div className="text-xs text-muran-dark/60">Total Campanhas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-600">{activeCampaigns}</div>
                <div className="text-xs text-muran-dark/60">Campanhas Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-muran-primary" />
              <div>
                <div className="font-semibold text-muran-dark">
                  R$ {totalSpentToday.toLocaleString()}
                </div>
                <div className="text-xs text-muran-dark/60">Gasto Hoje</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muran-primary" />
              <div>
                <div className="font-semibold text-muran-dark">
                  {totalBudgetToday > 0 ? Math.round((totalSpentToday / totalBudgetToday) * 100) : 0}%
                </div>
                <div className="text-xs text-muran-dark/60">Orçamento Usado</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clientes e Campanhas */}
      <div className="space-y-6">
        {filteredData.map((client) => (
          <Card key={client.id} className="border-muran-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded ${
                    client.platform === "meta" ? "bg-[#4267B2]" : "bg-[#34A853]"
                  }`}></div>
                  <span className="text-lg font-semibold text-muran-dark">
                    {client.client}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {client.platform === "meta" ? "Meta Ads" : "Google Ads"}
                  </Badge>
                </div>
                <div className="text-sm text-muran-dark/60">
                  {client.campaigns.length} campanha{client.campaigns.length !== 1 ? 's' : ''}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {client.campaigns.map((campaign, index) => {
                  const statusStyle = statusConfig[campaign.status];
                  const StatusIcon = statusStyle.icon;
                  const spentPercent = (campaign.spentToday / campaign.dailyBudget) * 100;

                  return (
                    <div key={index} className="border border-muran-secondary/20 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-muran-dark">{campaign.name}</h4>
                            <Badge className={statusStyle.bg} variant="secondary">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusStyle.label}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muran-dark/70">Orçamento diário</span>
                              <span className={`font-semibold ${getSpentColor(spentPercent)}`}>
                                R$ {campaign.spentToday} / R$ {campaign.dailyBudget}
                              </span>
                            </div>
                            <Progress value={spentPercent} className="h-2" />
                            <div className="flex justify-between text-xs text-muran-dark/60">
                              <span>{spentPercent.toFixed(1)}% usado</span>
                              <span>Última atualização: {getTimeAgo(campaign.lastUpdate)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-muran-dark/60">Impressões</div>
                              <div className="font-semibold text-muran-dark">
                                {campaign.impressions.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muran-dark/60">Cliques</div>
                              <div className="font-semibold text-muran-dark">
                                {campaign.clicks.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-muran-dark/60">CTR</div>
                              <div className="font-semibold text-muran-dark">
                                {campaign.ctr.toFixed(2)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muran-dark/60">CPC</div>
                              <div className="font-semibold text-muran-dark">
                                R$ {campaign.cpc.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};