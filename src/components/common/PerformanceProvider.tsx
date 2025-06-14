
import React, { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOptimizedCacheManager } from "@/utils/optimizedCacheUtils";
import { PerformanceTracker } from "@/utils/performanceUtils";

interface PerformanceContextType {
  isOptimizationEnabled: boolean;
  toggleOptimization: () => void;
  cacheManager: any;
  performanceTracker: PerformanceTracker;
  systemHealth: {
    isHealthy: boolean;
    issues: string[];
  };
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(true);
  const [systemHealth, setSystemHealth] = useState({
    isHealthy: true,
    issues: [] as string[]
  });
  
  const queryClient = useQueryClient();
  const cacheManager = useOptimizedCacheManager(queryClient);
  const performanceTracker = PerformanceTracker.getInstance();

  // Sistema de monitoramento de saúde
  useEffect(() => {
    if (!isOptimizationEnabled) return;

    const healthCheck = () => {
      const report = performanceTracker.getFullReport();
      const issues: string[] = [];
      let isHealthy = true;

      // Verificar componentes lentos
      Object.entries(report).forEach(([componentName, stats]: [string, any]) => {
        if (stats?.isSlowComponent) {
          issues.push(`Componente lento detectado: ${componentName} (${stats.average}ms)`);
          isHealthy = false;
        }
      });

      // Verificar cache hit rate
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      const errorQueries = queries.filter(q => q.state.error).length;
      const errorRate = queries.length > 0 ? (errorQueries / queries.length) * 100 : 0;

      if (errorRate > 20) {
        issues.push(`Alta taxa de erro nas queries: ${errorRate.toFixed(1)}%`);
        isHealthy = false;
      }

      setSystemHealth({ isHealthy, issues });
    };

    // Warmup do cache na inicialização
    cacheManager.warmupCache();

    // Health check inicial
    healthCheck();

    // Intervalos de manutenção
    const healthInterval = setInterval(healthCheck, 30000); // 30 segundos
    const cleanupInterval = setInterval(() => {
      cacheManager.cleanupStaleData();
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      clearInterval(healthInterval);
      clearInterval(cleanupInterval);
    };
  }, [isOptimizationEnabled, cacheManager, queryClient, performanceTracker]);

  const toggleOptimization = () => {
    setIsOptimizationEnabled(prev => {
      const newValue = !prev;
      
      if (newValue) {
        console.log("🚀 Sistema de otimização ativado");
        cacheManager.warmupCache();
      } else {
        console.log("⏸️ Sistema de otimização desativado");
      }
      
      return newValue;
    });
  };

  return (
    <PerformanceContext.Provider value={{
      isOptimizationEnabled,
      toggleOptimization,
      cacheManager,
      performanceTracker,
      systemHealth
    }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error("usePerformance deve ser usado dentro de PerformanceProvider");
  }
  return context;
}
