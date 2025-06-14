
import { usePerformanceMonitor } from "@/hooks/common/usePerformanceMonitor";

// Utilitários para medição de performance
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  // Registrar tempo de renderização
  trackRenderTime(componentName: string, renderTime: number) {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }
    
    const times = this.metrics.get(componentName)!;
    times.push(renderTime);
    
    // Manter apenas os últimos 100 registros
    if (times.length > 100) {
      times.shift();
    }
  }

  // Obter estatísticas de performance
  getStats(componentName: string) {
    const times = this.metrics.get(componentName) || [];
    if (times.length === 0) return null;

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    return {
      average: Number(avg.toFixed(2)),
      maximum: Number(max.toFixed(2)),
      minimum: Number(min.toFixed(2)),
      samples: times.length,
      isSlowComponent: avg > 16 // 60fps = 16ms por frame
    };
  }

  // Obter relatório completo
  getFullReport() {
    const report: Record<string, any> = {};
    
    for (const [componentName] of this.metrics) {
      report[componentName] = this.getStats(componentName);
    }
    
    return report;
  }

  // Limpar métricas
  clearMetrics(componentName?: string) {
    if (componentName) {
      this.metrics.delete(componentName);
    } else {
      this.metrics.clear();
    }
  }
}

// Hook para facilitar o uso do tracker
export const usePerformanceTracking = (componentName: string) => {
  const metrics = usePerformanceMonitor(componentName);
  const tracker = PerformanceTracker.getInstance();

  // Registrar métricas automaticamente
  if (metrics.renderTime > 0) {
    tracker.trackRenderTime(componentName, metrics.renderTime);
  }

  return {
    ...metrics,
    getStats: () => tracker.getStats(componentName),
    clearStats: () => tracker.clearMetrics(componentName)
  };
};
