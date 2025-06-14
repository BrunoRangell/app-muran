
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Zap, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { HealthDashboardStats, HealthAlert } from "./types/enhanced-types";

interface AlertsDashboardProps {
  stats: HealthDashboardStats;
  topAlerts: HealthAlert[];
  onAlertClick: (alert: HealthAlert) => void;
  onUrgencyFilterClick?: (urgency: string) => void;
}

export function AlertsDashboard({ stats, topAlerts, onAlertClick, onUrgencyFilterClick }: AlertsDashboardProps) {
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

  const urgencyMetrics = [
    {
      level: "critical",
      icon: AlertTriangle,
      label: "Crítico",
      count: stats.criticalAlerts,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      textColor: "text-red-600",
      hoverBg: "hover:bg-red-100"
    },
    {
      level: "high", 
      icon: AlertCircle,
      label: "Alto",
      count: stats.highAlerts,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      textColor: "text-orange-600",
      hoverBg: "hover:bg-orange-100"
    },
    {
      level: "medium",
      icon: Zap,
      label: "Médio", 
      count: stats.mediumAlerts,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-600",
      hoverBg: "hover:bg-yellow-100"
    },
    {
      level: "ok",
      icon: CheckCircle,
      label: "OK",
      count: stats.functioning,
      bgColor: "bg-green-50",
      iconColor: "text-green-600", 
      textColor: "text-green-600",
      hoverBg: "hover:bg-green-100"
    }
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Métricas de Urgência */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {urgencyMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card 
              key={metric.level}
              className={`border-0 shadow-sm cursor-pointer transition-all duration-200 ${metric.hoverBg}`}
              onClick={() => onUrgencyFilterClick?.(metric.level)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{metric.label}</p>
                    <p className={`text-lg font-bold ${metric.textColor}`}>{metric.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
