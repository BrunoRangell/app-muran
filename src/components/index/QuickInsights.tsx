import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface QuickInsightsProps {
  clientMetrics: {
    activeCount: number;
    newCount: number;
  } | undefined;
}

export const QuickInsights = ({ clientMetrics }: QuickInsightsProps) => {
  const insights = [
    {
      type: "success",
      icon: CheckCircle,
      title: "Carteira Saudável",
      message: `${clientMetrics?.activeCount || 0} clientes ativos gerando receita`,
      priority: "Estável"
    },
    {
      type: "info",
      icon: TrendingUp,
      title: "Crescimento Ativo",
      message: `${clientMetrics?.newCount || 0} novos clientes adicionados este mês`,
      priority: clientMetrics?.newCount && clientMetrics.newCount > 0 ? "Em Alta" : "Normal"
    },
    {
      type: "warning",
      icon: AlertCircle,
      title: "Atenção",
      message: "Acompanhe as métricas de campanhas regularmente",
      priority: "Importante"
    }
  ];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-muted border-border";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityVariant = (priority: string): "default" | "outline" | "secondary" => {
    if (priority === "Em Alta") return "default";
    if (priority === "Importante") return "secondary";
    return "outline";
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Lightbulb className="text-muran-primary h-5 w-5" />
          Insights Rápidos
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Principais destaques do momento
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all duration-300 hover:shadow-sm ${getTypeStyles(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getIconColor(insight.type)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-foreground">
                        {insight.title}
                      </h4>
                      <Badge 
                        variant={getPriorityVariant(insight.priority)}
                        className="text-xs shrink-0"
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
