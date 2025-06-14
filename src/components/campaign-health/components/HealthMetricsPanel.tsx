
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Target, Eye } from "lucide-react";
import { useCampaignHealthMetrics } from "../hooks/useCampaignHealthMetrics";
import { ClientHealthData } from "../types";

interface HealthMetricsPanelProps {
  data: ClientHealthData[];
}

export function HealthMetricsPanel({ data }: HealthMetricsPanelProps) {
  const { 
    stats, 
    totalSpendToday, 
    totalImpressionsToday, 
    totalActiveCampaigns,
    platformStats,
    healthPercentage 
  } = useCampaignHealthMetrics(data);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Saúde Geral */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saúde Geral</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#ff6e00]">
            {healthPercentage}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.functioning} de {stats.totalClients} funcionando
          </p>
          <div className="flex gap-1 mt-2">
            <Badge variant="default" className="text-xs bg-green-500">
              🟢 {stats.functioning}
            </Badge>
            <Badge variant="destructive" className="text-xs">
              🔴 {stats.noSpend}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Investimento Hoje */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investimento Hoje</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#321e32]">
            R$ {totalSpendToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalActiveCampaigns} campanhas ativas
          </p>
          <div className="flex gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              📘 R$ {platformStats.meta.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🔍 R$ {platformStats.google.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Impressões Hoje */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Impressões Hoje</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#0f0f0f]">
            {totalImpressionsToday.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground">
            Alcance total do dia
          </p>
          <div className="flex gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              📘 {platformStats.meta.impressions.toLocaleString('pt-BR')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🔍 {platformStats.google.impressions.toLocaleString('pt-BR')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Clientes Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#ebebf0]">
            {stats.totalClients}
          </div>
          <p className="text-xs text-muted-foreground">
            Total de clientes
          </p>
          <div className="flex gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              📘 {platformStats.meta.clients} Meta
            </Badge>
            <Badge variant="outline" className="text-xs">
              🔍 {platformStats.google.clients} Google
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
