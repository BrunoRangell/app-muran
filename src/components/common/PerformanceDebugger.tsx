
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PerformanceTracker } from "@/utils/performanceUtils";
import { Activity, RefreshCw, Trash2 } from "lucide-react";

export function PerformanceDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState<Record<string, any>>({});
  
  const tracker = PerformanceTracker.getInstance();

  const updateReport = () => {
    setReport(tracker.getFullReport());
  };

  useEffect(() => {
    updateReport();
    const interval = setInterval(updateReport, 5000); // Atualizar a cada 5s
    return () => clearInterval(interval);
  }, []);

  // Mostrar apenas em desenvolvimento
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <>
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50"
        size="sm"
        variant="outline"
      >
        <Activity className="h-4 w-4" />
      </Button>

      {isVisible && (
        <Card className="fixed bottom-16 right-4 w-96 max-h-96 overflow-auto z-50 bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Performance Monitor
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={updateReport}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    tracker.clearMetrics();
                    updateReport();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {Object.keys(report).length === 0 ? (
              <p className="text-muted-foreground">Nenhuma métrica disponível</p>
            ) : (
              Object.entries(report).map(([componentName, stats]) => (
                <div key={componentName} className="border-b pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{componentName}</span>
                    <Badge 
                      variant={stats?.isSlowComponent ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {stats?.isSlowComponent ? "Lento" : "OK"}
                    </Badge>
                  </div>
                  {stats && (
                    <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                      <span>Avg: {stats.average}ms</span>
                      <span>Max: {stats.maximum}ms</span>
                      <span>Samples: {stats.samples}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
