import { AlertTriangle, DollarSign, Pause, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterState } from "./SmartFilters";

interface CriticalAlertsProps {
  filters: FilterState;
}

// Mock data - em produção viria da API
const mockCriticalAlerts = [
  {
    id: 1,
    type: "balance",
    urgency: "critical" as const,
    client: "Cliente ABC",
    platform: "meta" as const,
    title: "Saldo crítico - R$ 45",
    description: "Conta pode parar em 8 horas",
    action: "Fazer recarga",
    actionType: "recharge" as const
  },
  {
    id: 2,
    type: "campaign",
    urgency: "high" as const,
    client: "Cliente XYZ", 
    platform: "google" as const,
    title: "Campanha parada há 2 dias",
    description: "Campanha 'Produtos Verão' sem impressões",
    action: "Reativar campanha",
    actionType: "activate" as const
  },
  {
    id: 3,
    type: "budget",
    urgency: "medium" as const,
    client: "Cliente DEF",
    platform: "meta" as const,
    title: "Orçamento 150% do previsto",
    description: "R$ 1.500 gastos de R$ 1.000 planejados",
    action: "Ajustar orçamento",
    actionType: "adjust" as const
  }
];

const urgencyConfig = {
  critical: { 
    color: "border-red-500 bg-red-50",
    badge: "bg-red-100 text-red-800",
    icon: AlertTriangle,
    iconColor: "text-red-500"
  },
  high: { 
    color: "border-orange-500 bg-orange-50", 
    badge: "bg-orange-100 text-orange-800",
    icon: AlertTriangle,
    iconColor: "text-orange-500"
  },
  medium: { 
    color: "border-yellow-500 bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-800", 
    icon: TrendingUp,
    iconColor: "text-yellow-600"
  }
};

const typeIcons = {
  balance: DollarSign,
  campaign: Pause,
  budget: TrendingUp
};

export const CriticalAlertsSection = ({ filters }: CriticalAlertsProps) => {
  // Filtrar alertas baseado nos filtros
  const filteredAlerts = mockCriticalAlerts.filter(alert => {
    if (filters.urgency !== "all" && alert.urgency !== filters.urgency) return false;
    if (filters.platform !== "all" && alert.platform !== filters.platform) return false;
    if (filters.clientSearch && !alert.client.toLowerCase().includes(filters.clientSearch.toLowerCase())) return false;
    if (filters.problemType !== "all" && alert.type !== filters.problemType) return false;
    return true;
  });

  const handleQuickAction = (alert: typeof mockCriticalAlerts[0]) => {
    // Aqui implementaria as ações rápidas
    console.log(`Executando ação: ${alert.actionType} para ${alert.client}`);
  };

  if (filteredAlerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3 text-green-700">
            <Zap className="w-6 h-6" />
            <span className="text-lg font-medium">
              Tudo funcionando perfeitamente! Nenhum problema crítico encontrado.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h2 className="text-xl font-semibold text-muran-dark">
          Ações Imediatas Necessárias
        </h2>
        <Badge variant="destructive">{filteredAlerts.length}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAlerts.map((alert) => {
          const config = urgencyConfig[alert.urgency];
          const TypeIcon = typeIcons[alert.type as keyof typeof typeIcons];
          const UrgencyIcon = config.icon;

          return (
            <Card key={alert.id} className={`${config.color} border-2 transition-all hover:shadow-lg`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4 text-muran-dark/60" />
                    <CardTitle className="text-sm font-medium text-muran-dark">
                      {alert.client}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={config.badge} variant="secondary">
                      {alert.urgency === "critical" ? "Crítico" : 
                       alert.urgency === "high" ? "Alto" : "Médio"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.platform === "meta" ? "Meta" : "Google"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-muran-dark text-sm mb-1">
                      {alert.title}
                    </h3>
                    <p className="text-xs text-muran-dark/70">
                      {alert.description}
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction(alert)}
                    className="w-full bg-muran-primary hover:bg-muran-primary/90"
                  >
                    <UrgencyIcon className={`w-3 h-3 mr-2 ${config.iconColor}`} />
                    {alert.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};