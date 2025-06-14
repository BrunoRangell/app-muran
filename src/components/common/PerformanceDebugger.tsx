
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  peakRenderTime: number;
  componentName: string;
}

interface PerformanceDebuggerProps {
  componentName: string;
  enabled?: boolean;
}

export const PerformanceDebugger: React.FC<PerformanceDebuggerProps> = ({
  componentName,
  enabled = import.meta.env.DEV
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    peakRenderTime: 0,
    componentName
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => {
        const newRenderCount = prev.renderCount + 1;
        const newAverageTime = ((prev.averageRenderTime * prev.renderCount) + renderTime) / newRenderCount;
        
        return {
          ...prev,
          renderCount: newRenderCount,
          averageRenderTime: newAverageTime,
          lastRenderTime: renderTime,
          peakRenderTime: Math.max(prev.peakRenderTime, renderTime)
        };
      });
    };
  }, [enabled]);

  // Não renderizar em produção
  if (!enabled || import.meta.env.PROD) {
    return null;
  }

  if (!isVisible) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        Debug Performance
      </Button>
    );
  }

  const getPerformanceStatus = () => {
    if (metrics.lastRenderTime > 16) return { icon: AlertTriangle, color: 'destructive', text: 'Lento' };
    if (metrics.lastRenderTime > 8) return { icon: Clock, color: 'warning', text: 'Moderado' };
    return { icon: CheckCircle, color: 'success', text: 'Rápido' };
  };

  const status = getPerformanceStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Performance: {componentName}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusIcon className="h-4 w-4" />
          <Badge variant={status.color as any}>{status.text}</Badge>
        </div>
        
        <div className="text-xs space-y-1">
          <div>Renders: {metrics.renderCount}</div>
          <div>Último: {metrics.lastRenderTime.toFixed(2)}ms</div>
          <div>Média: {metrics.averageRenderTime.toFixed(2)}ms</div>
          <div>Pico: {metrics.peakRenderTime.toFixed(2)}ms</div>
        </div>
      </CardContent>
    </Card>
  );
};
