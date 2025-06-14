
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthStats } from "./types";
import { Users, CheckCircle, AlertCircle, AlertTriangle, Minus } from "lucide-react";

interface HealthStatsOverviewProps {
  stats: HealthStats;
}

export function HealthStatsOverview({ stats }: HealthStatsOverviewProps) {
  const statCards = [
    {
      title: "Total de Clientes",
      value: stats.totalClients,
      icon: <Users className="w-5 h-5 text-gray-600" />,
      color: "bg-gray-50 border-gray-200",
      textColor: "text-gray-700"
    },
    {
      title: "Funcionando",
      value: stats.functioning,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700"
    },
    {
      title: "Sem Veiculação",
      value: stats.noSpend,
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      color: "bg-red-50 border-red-200",
      textColor: "text-red-700"
    },
    {
      title: "Sem Campanhas",
      value: stats.noCampaigns,
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      color: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-700"
    },
    {
      title: "Não Configurado",
      value: stats.notConfigured,
      icon: <Minus className="w-5 h-5 text-gray-500" />,
      color: "bg-gray-50 border-gray-300",
      textColor: "text-gray-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card key={index} className={`${stat.color} border hover:shadow-md transition-shadow`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
                <p className={`text-xs ${stat.textColor} opacity-75`}>
                  {stat.title}
                </p>
              </div>
              <div className="opacity-75">
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
