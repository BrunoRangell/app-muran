
import { useState, useCallback } from "react";

interface MetricItem {
  id: string;
  title: string;
  value: string | number;
  previousValue?: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface UseDashboardMetricsProps<T> {
  initialMetrics?: T[];
  calculateTrend?: (current: T, previous?: T) => { value: number; isPositive: boolean };
}

export function useDashboardMetrics<T extends MetricItem>({
  initialMetrics = [],
  calculateTrend
}: UseDashboardMetricsProps<T> = {}) {
  const [metrics, setMetrics] = useState<T[]>(initialMetrics);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMetric = useCallback((id: string, updates: Partial<T>) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === id 
        ? { ...metric, ...updates }
        : metric
    ));
  }, []);

  const addMetric = useCallback((metric: T) => {
    setMetrics(prev => [...prev, metric]);
  }, []);

  const removeMetric = useCallback((id: string) => {
    setMetrics(prev => prev.filter(metric => metric.id !== id));
  }, []);

  const refreshMetrics = useCallback(async (fetcher: () => Promise<T[]>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newMetrics = await fetcher();
      
      // Calcular trends se a função for fornecida
      if (calculateTrend) {
        const metricsWithTrends = newMetrics.map(metric => {
          const previousMetric = metrics.find(m => m.id === metric.id);
          const trend = calculateTrend(metric, previousMetric);
          return { ...metric, trend };
        });
        setMetrics(metricsWithTrends);
      } else {
        setMetrics(newMetrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas');
    } finally {
      setIsLoading(false);
    }
  }, [metrics, calculateTrend]);

  const getMetricById = useCallback((id: string) => {
    return metrics.find(metric => metric.id === id);
  }, [metrics]);

  const getMetricsByFilter = useCallback((filter: (metric: T) => boolean) => {
    return metrics.filter(filter);
  }, [metrics]);

  return {
    metrics,
    isLoading,
    error,
    updateMetric,
    addMetric,
    removeMetric,
    refreshMetrics,
    getMetricById,
    getMetricsByFilter,
    totalMetrics: metrics.length
  };
}
