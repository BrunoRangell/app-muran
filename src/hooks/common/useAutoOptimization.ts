
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PerformanceOptimizer } from "@/utils/performanceOptimizer";

export function useAutoOptimization(enabled = true) {
  const [optimizer, setOptimizer] = useState<PerformanceOptimizer | null>(null);
  const [lastOptimization, setLastOptimization] = useState<Date | null>(null);
  const [optimizationCount, setOptimizationCount] = useState(0);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (enabled) {
      const optimizerInstance = PerformanceOptimizer.getInstance(queryClient);
      setOptimizer(optimizerInstance);

      // Auto-otimização a cada 2 minutos
      const interval = setInterval(() => {
        const result = optimizerInstance.autoOptimize();
        
        if (result.optimizationsApplied.length > 0) {
          setLastOptimization(new Date());
          setOptimizationCount(prev => prev + result.optimizationsApplied.length);
          
          console.log("🚀 Auto-otimização aplicada:", {
            componentes: result.optimizationsApplied,
            total: result.totalOptimizations
          });
        }
      }, 2 * 60 * 1000); // 2 minutos

      return () => clearInterval(interval);
    }
  }, [enabled, queryClient]);

  const manualOptimize = () => {
    if (optimizer) {
      const result = optimizer.autoOptimize();
      setLastOptimization(new Date());
      setOptimizationCount(prev => prev + result.optimizationsApplied.length);
      return result;
    }
    return null;
  };

  const getReport = () => {
    return optimizer?.getOptimizationReport() || null;
  };

  const reset = () => {
    optimizer?.reset();
    setLastOptimization(null);
    setOptimizationCount(0);
  };

  return {
    isEnabled: enabled,
    lastOptimization,
    optimizationCount,
    manualOptimize,
    getReport,
    reset
  };
}
