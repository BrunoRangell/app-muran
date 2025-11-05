import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, UserPlus, DollarSign } from "lucide-react";

interface KPICardsProps {
  clientMetrics: {
    activeCount: number;
    newCount: number;
  } | undefined;
}

export const KPICards = ({ clientMetrics }: KPICardsProps) => {
  const kpis = [
    {
      title: "Clientes Ativos",
      value: clientMetrics?.activeCount || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: null,
    },
    {
      title: "Novos Este Mês",
      value: clientMetrics?.newCount || 0,
      icon: UserPlus,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: clientMetrics?.newCount && clientMetrics.newCount > 0 ? "up" : null,
    },
    {
      title: "Taxa de Crescimento",
      value: clientMetrics?.activeCount && clientMetrics?.newCount 
        ? `+${Math.round((clientMetrics.newCount / clientMetrics.activeCount) * 100)}%`
        : "0%",
      icon: TrendingUp,
      color: "text-muran-primary",
      bgColor: "bg-orange-50",
      trend: clientMetrics?.newCount && clientMetrics.newCount > 0 ? "up" : null,
    },
    {
      title: "MRR Total",
      value: "Em breve",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card 
            key={index} 
            className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                {kpi.trend === "up" && (
                  <span className="text-green-600 text-xs font-medium">↑</span>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {kpi.value}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {kpi.title}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
