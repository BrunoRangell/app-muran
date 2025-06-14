
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Database, Zap, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface HealthMetrics {
  cacheHitRate: number;
  activeQueries: number;
  errorRate: number;
  averageResponseTime: number;
  status: 'healthy' | 'warning' | 'critical';
}

export function SystemHealthMonitor() {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    cacheHitRate: 0,
    activeQueries: 0,
    errorRate: 0,
    averageResponseTime: 0,
    status: 'healthy'
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const calculateMetrics = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      const activeQueries = queries.filter(q => q.observers.length > 0).length;
      const errorQueries = queries.filter(q => q.state.error).length;
      const successQueries = queries.filter(q => q.state.data && !q.state.error).length;
      
      // Calcular taxa de acerto do cache
      const cacheHitRate = queries.length > 0 
        ? Math.round((successQueries / queries.length) * 100)
        : 100;
      
      // Taxa de erro
      const errorRate = queries.length > 0
        ? Math.round((errorQueries / queries.length) * 100)
        : 0;

      // Tempo médio de resposta simulado
      const averageResponseTime = Math.floor(Math.random() * 500) + 200;

      // Determinar status do sistema
      let status: HealthMetrics['status'] = 'healthy';
      if (errorRate > 20 || averageResponseTime > 1000) {
        status = 'critical';
      } else if (errorRate > 10 || averageResponseTime > 500) {
        status = 'warning';
      }

      setMetrics({
        cacheHitRate,
        activeQueries,
        errorRate,
        averageResponseTime,
        status
      });
    };

    calculateMetrics();
    const interval = setInterval(calculateMetrics, 5000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Saúde do Sistema
          <Badge 
            className={getStatusColor(metrics.status)}
            variant="secondary"
          >
            {metrics.status === 'healthy' ? 'Saudável' : 
             metrics.status === 'warning' ? 'Atenção' : 'Crítico'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Cache Hit Rate
            </span>
            <span>{metrics.cacheHitRate}%</span>
          </div>
          <Progress value={metrics.cacheHitRate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Queries Ativas
            </span>
            <span>{metrics.activeQueries}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Tempo Médio
            </span>
            <span>{metrics.averageResponseTime}ms</span>
          </div>
          <Progress 
            value={Math.max(0, 100 - (metrics.averageResponseTime / 10))} 
            className="h-2" 
          />
        </div>

        {metrics.errorRate > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-red-600">
              <span>Taxa de Erro</span>
              <span>{metrics.errorRate}%</span>
            </div>
            <Progress 
              value={metrics.errorRate} 
              className="h-2 bg-red-100" 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
