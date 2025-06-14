
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { HealthDashboardStats, HealthAlert } from "./types/enhanced-types";

interface AlertsDashboardProps {
  stats: HealthDashboardStats;
  topAlerts: HealthAlert[];
  onAlertClick: (alert: HealthAlert) => void;
}

export function AlertsDashboard({ stats, topAlerts, onAlertClick }: AlertsDashboardProps) {
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return "🚨";
      case "high": return "⚠️";
      case "medium": return "⚡";
      default: return "ℹ️";
    }
  };

  const toggleAlertsExpansion = () => {
    setIsAlertsExpanded(!isAlertsExpanded);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleAlertsExpansion();
    }
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Alertas Críticos</p>
                <p className="text-lg font-bold text-red-600">{stats.criticalAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Precisa Atenção</p>
                <p className="text-lg font-bold text-orange-600">{stats.highAlerts + stats.mediumAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Score de Saúde</p>
                <p className="text-lg font-bold text-green-600">{stats.trends.healthScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50">
                <DollarSign className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Perda Estimada</p>
                <p className="text-lg font-bold text-gray-900">R$ {stats.estimatedLoss}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Prioritários */}
      {topAlerts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              onClick={toggleAlertsExpansion}
              onKeyDown={handleKeyDown}
              role="button"
              tabIndex={0}
              aria-expanded={isAlertsExpanded}
            >
              <CardTitle className="text-lg text-[#321e32] flex items-center gap-2">
                🚨 Ações Imediatas Necessárias
                <Badge variant="destructive" className="ml-2">
                  {topAlerts.length}
                </Badge>
              </CardTitle>
              <div className="transition-transform duration-200">
                {isAlertsExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>
          </CardHeader>
          
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isAlertsExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <CardContent className="space-y-3">
              {topAlerts.slice(0, 5).map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onAlertClick(alert)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-lg">{getSeverityIcon(alert.severity)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{alert.clientName}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.platform === 'meta' ? 'Meta' : 'Google'} Ads
                        </Badge>
                        <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                          {alert.severity === 'critical' ? 'Crítico' : 
                           alert.severity === 'high' ? 'Alto' : 
                           alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{alert.title}</p>
                      {alert.estimatedImpact && (
                        <p className="text-xs text-orange-600 font-medium">{alert.estimatedImpact}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="ml-3">
                    {alert.severity === 'critical' ? 'Resolver Agora' : 'Investigar'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
}
