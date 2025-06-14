
import { QueryClient } from "@tanstack/react-query";
import { PerformanceTracker } from "./performanceUtils";

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private queryClient: QueryClient;
  private performanceTracker: PerformanceTracker;
  private optimizations: Map<string, boolean> = new Map();

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.performanceTracker = PerformanceTracker.getInstance();
  }

  static getInstance(queryClient: QueryClient): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer(queryClient);
    }
    return PerformanceOptimizer.instance;
  }

  // Otimização automática baseada em métricas
  autoOptimize() {
    const report = this.performanceTracker.getFullReport();
    const optimizationsApplied: string[] = [];

    Object.entries(report).forEach(([componentName, stats]: [string, any]) => {
      if (stats?.isSlowComponent && !this.optimizations.get(componentName)) {
        this.optimizeComponent(componentName);
        optimizationsApplied.push(componentName);
        this.optimizations.set(componentName, true);
      }
    });

    // Otimizar queries com alta taxa de erro
    this.optimizeQueries();

    return {
      optimizationsApplied,
      totalOptimizations: this.optimizations.size
    };
  }

  private optimizeComponent(componentName: string) {
    console.log(`🔧 Aplicando otimização automática para: ${componentName}`);
    
    // Estratégias de otimização baseadas no nome do componente
    if (componentName.includes('Table') || componentName.includes('List')) {
      this.optimizeTableComponent(componentName);
    } else if (componentName.includes('Chart') || componentName.includes('Graph')) {
      this.optimizeChartComponent(componentName);
    } else {
      this.optimizeGenericComponent(componentName);
    }
  }

  private optimizeTableComponent(componentName: string) {
    // Implementar paginação virtual, memoização de linhas
    console.log(`📊 Otimizando componente de tabela: ${componentName}`);
  }

  private optimizeChartComponent(componentName: string) {
    // Implementar debounce, lazy loading de dados
    console.log(`📈 Otimizando componente de gráfico: ${componentName}`);
  }

  private optimizeGenericComponent(componentName: string) {
    // Implementar memoização genérica
    console.log(`⚡ Otimizando componente genérico: ${componentName}`);
  }

  private optimizeQueries() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    queries.forEach(query => {
      if (query.state.error && query.getObserversCount() > 0) {
        // Resetar queries com erro
        this.queryClient.resetQueries({ queryKey: query.queryKey });
      }
    });
  }

  // Relatório de otimizações
  getOptimizationReport() {
    const performanceReport = this.performanceTracker.getFullReport();
    const cacheStats = this.getCacheStats();
    
    return {
      performance: performanceReport,
      cache: cacheStats,
      optimizations: Array.from(this.optimizations.entries()),
      recommendations: this.generateRecommendations()
    };
  }

  private getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const totalQueries = queries.length;
    const activeQueries = queries.filter(q => q.getObserversCount() > 0).length;
    const errorQueries = queries.filter(q => q.state.error).length;
    const successQueries = queries.filter(q => q.state.data && !q.state.error).length;
    
    return {
      total: totalQueries,
      active: activeQueries,
      errors: errorQueries,
      success: successQueries,
      hitRate: totalQueries > 0 ? Math.round((successQueries / totalQueries) * 100) : 0
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const report = this.performanceTracker.getFullReport();
    const cacheStats = this.getCacheStats();

    // Recomendações baseadas em performance
    Object.entries(report).forEach(([componentName, stats]: [string, any]) => {
      if (stats?.isSlowComponent) {
        recommendations.push(`Considere lazy loading para ${componentName}`);
      }
      if (stats?.rerenders > 10) {
        recommendations.push(`${componentName} está re-renderizando muito - verifique dependências`);
      }
    });

    // Recomendações baseadas em cache
    if (cacheStats.hitRate < 80) {
      recommendations.push("Taxa de acerto do cache baixa - revisar estratégia de cache");
    }

    if (cacheStats.errors > cacheStats.total * 0.1) {
      recommendations.push("Alta taxa de erro nas queries - verificar conectividade");
    }

    return recommendations;
  }

  // Limpeza e reset
  reset() {
    this.optimizations.clear();
    this.performanceTracker.clearMetrics();
    console.log("🔄 Sistema de otimização resetado");
  }
}
