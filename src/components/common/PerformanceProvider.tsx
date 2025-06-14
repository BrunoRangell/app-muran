
import React, { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOptimizedCacheManager } from "@/utils/optimizedCacheUtils";

interface PerformanceContextType {
  isOptimizationEnabled: boolean;
  toggleOptimization: () => void;
  cacheManager: any;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(true);
  const queryClient = useQueryClient();
  const cacheManager = useOptimizedCacheManager(queryClient);

  useEffect(() => {
    if (isOptimizationEnabled) {
      // Warmup do cache na inicialização
      cacheManager.warmupCache();

      // Cleanup periódico de cache
      const cleanupInterval = setInterval(() => {
        cacheManager.cleanupStaleData();
      }, 10 * 60 * 1000); // 10 minutos

      return () => clearInterval(cleanupInterval);
    }
  }, [isOptimizationEnabled, cacheManager]);

  const toggleOptimization = () => {
    setIsOptimizationEnabled(prev => !prev);
  };

  return (
    <PerformanceContext.Provider value={{
      isOptimizationEnabled,
      toggleOptimization,
      cacheManager
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
