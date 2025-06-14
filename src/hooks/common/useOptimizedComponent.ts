
import { useEffect } from "react";
import { usePerformanceTracking } from "@/utils/performanceUtils";
import { usePerformance } from "@/components/common/PerformanceProvider";

export function useOptimizedComponent(componentName: string, options: {
  trackPerformance?: boolean;
  preloadData?: boolean;
  cacheKey?: string;
} = {}) {
  const {
    trackPerformance = true,
    preloadData = false,
    cacheKey
  } = options;

  const { isOptimizationEnabled, cacheManager } = usePerformance();
  
  // Tracking de performance
  const performanceMetrics = usePerformanceTracking(
    trackPerformance && isOptimizationEnabled ? componentName : ""
  );

  // Preload de dados se solicitado
  useEffect(() => {
    if (preloadData && cacheKey && isOptimizationEnabled) {
      cacheManager.preloadData(cacheKey);
    }
  }, [preloadData, cacheKey, isOptimizationEnabled, cacheManager]);

  // Log de componentes lentos em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && performanceMetrics.isSlowComponent) {
      console.warn(`🐌 Componente lento: ${componentName}`, {
        renderTime: performanceMetrics.renderTime,
        rerenders: performanceMetrics.rerenders
      });
    }
  }, [componentName, performanceMetrics.isSlowComponent, performanceMetrics.renderTime, performanceMetrics.rerenders]);

  return {
    ...performanceMetrics,
    isOptimized: isOptimizationEnabled,
    cacheManager
  };
}
