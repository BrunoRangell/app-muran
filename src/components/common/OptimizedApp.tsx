
import React from "react";
import { PerformanceProvider } from "./PerformanceProvider";
import { PerformanceDebugger } from "./PerformanceDebugger";
import { SystemHealthMonitor } from "./SystemHealthMonitor";
import { PerformanceDashboard } from "./PerformanceDashboard";
import { usePerformance } from "./PerformanceProvider";

function AppContent({ children }: { children: React.ReactNode }) {
  const { systemHealth, isOptimizationEnabled } = usePerformance();

  return (
    <>
      {children}
      
      {/* Componentes de desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <PerformanceDebugger />
          <PerformanceDashboard />
          {!systemHealth.isHealthy && (
            <div className="fixed top-4 left-4 z-50">
              <SystemHealthMonitor />
            </div>
          )}
        </>
      )}
      
      {/* Indicador de status de otimização */}
      {isOptimizationEnabled && (
        <div className="fixed bottom-4 left-4 z-40 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
          ⚡ Sistema Otimizado - Fase 8
        </div>
      )}
    </>
  );
}

export function OptimizedApp({ children }: { children: React.ReactNode }) {
  return (
    <PerformanceProvider>
      <AppContent>{children}</AppContent>
    </PerformanceProvider>
  );
}
