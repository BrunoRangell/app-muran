
import { useEffect, useRef, useState } from "react";

interface PerformanceMetrics {
  renderTime: number;
  componentMounts: number;
  rerenders: number;
  isSlowComponent: boolean;
}

export function usePerformanceMonitor(componentName: string, threshold = 16) {
  const renderStartTime = useRef<number>(performance.now());
  const mountCount = useRef<number>(0);
  const rerenderCount = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMounts: 0,
    rerenders: 0,
    isSlowComponent: false
  });

  useEffect(() => {
    mountCount.current += 1;
  }, []);

  useEffect(() => {
    rerenderCount.current += 1;
    const renderTime = performance.now() - renderStartTime.current;
    
    if (renderTime > threshold) {
      console.warn(`🐌 Componente lento detectado: ${componentName} levou ${renderTime.toFixed(2)}ms para renderizar`);
    }

    setMetrics({
      renderTime,
      componentMounts: mountCount.current,
      rerenders: rerenderCount.current,
      isSlowComponent: renderTime > threshold
    });

    // Reset timer para próximo render
    renderStartTime.current = performance.now();
  });

  return metrics;
}
