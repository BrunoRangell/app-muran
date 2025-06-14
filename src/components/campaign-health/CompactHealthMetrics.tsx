
import { useActiveCampaignHealth } from "./hooks/useActiveCampaignHealth";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";

export function CompactHealthMetrics() {
  const { stats, data } = useActiveCampaignHealth();

  // Calcular investimento total do dia
  const totalInvestment = data?.reduce((acc, client) => {
    const metaCost = client.metaAds?.costToday || 0;
    const googleCost = client.googleAds?.costToday || 0;
    return acc + metaCost + googleCost;
  }, 0) || 0;

  const metrics = [
    {
      label: "Total de Clientes",
      value: stats.totalClients,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Funcionando",
      value: stats.functioning,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      label: "Com Problemas",
      value: stats.noSpend + stats.noCampaigns,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      label: "Investimento Hoje",
      value: `R$ ${totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-[#ff6e00]",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{metric.label}</p>
                <p className="text-lg font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
