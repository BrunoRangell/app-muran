
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Zap, 
  Database, 
  TrendingUp, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";
import { usePerformance } from "./PerformanceProvider";
import { useAutoOptimization } from "@/hooks/common/useAutoOptimization";

export function PerformanceDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const { 
    isOptimizationEnabled, 
    toggleOptimization, 
    systemHealth,
    performanceTracker 
  } = usePerformance();
  
  const {
    lastOptimization,
    optimizationCount,
    manualOptimize,
    getReport,
    reset
  } = useAutoOptimization(isOptimizationEnabled);

  const [report, setReport] = useState<any>(null);

  const handleGetReport = () => {
    const newReport = getReport();
    setReport(newReport);
  };

  // Mostrar apenas em desenvolvimento
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <>
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-16 right-16 z-50"
        size="sm"
        variant={systemHealth.isHealthy ? "outline" : "destructive"}
      >
        <Activity className="h-4 w-4 mr-1" />
        Performance
      </Button>

      {isVisible && (
        <Card className="fixed bottom-32 right-4 w-[500px] max-h-[600px] overflow-auto z-50 bg-white shadow-xl border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#ff6e00]" />
                Dashboard de Performance
              </span>
              <div className="flex gap-2">
                <Badge variant={systemHealth.isHealthy ? "default" : "destructive"}>
                  {systemHealth.isHealthy ? "Saudável" : "Problemas"}
                </Badge>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsVisible(false)}
                >
                  ✕
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="metrics">Métricas</TabsTrigger>
                <TabsTrigger value="optimizations">Otimizações</TabsTrigger>
                <TabsTrigger value="settings">Config</TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        {systemHealth.isHealthy ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          Sistema {systemHealth.isHealthy ? "Saudável" : "Com Problemas"}
                        </span>
                      </div>
                      {systemHealth.issues.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {systemHealth.issues.map((issue, index) => (
                            <div key={index} className="text-xs text-red-600">
                              • {issue}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Otimizações</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Total aplicadas: {optimizationCount}
                      </div>
                      {lastOptimization && (
                        <div className="text-xs text-gray-600">
                          Última: {lastOptimization.toLocaleTimeString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={manualOptimize}
                    disabled={!isOptimizationEnabled}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Otimizar Agora
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleGetReport}
                  >
                    <Database className="h-3 w-3 mr-1" />
                    Gerar Relatório
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                {report ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Performance dos Componentes</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {Object.entries(report.performance).map(([name, stats]: [string, any]) => (
                          <div key={name} className="text-xs border-b pb-1">
                            <div className="flex justify-between">
                              <span>{name}</span>
                              <Badge variant={stats?.isSlowComponent ? "destructive" : "default"} className="text-xs">
                                {stats?.average}ms
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Cache</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span>Hit Rate: {report.cache?.hitRate}%</span>
                        <span>Queries Ativas: {report.cache?.active}</span>
                        <span>Erros: {report.cache?.errors}</span>
                        <span>Sucessos: {report.cache?.success}</span>
                      </div>
                    </div>

                    {report.recommendations?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recomendações</h4>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {report.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="text-xs text-orange-600">
                              • {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Clique em "Gerar Relatório" para ver as métricas
                  </div>
                )}
              </TabsContent>

              <TabsContent value="optimizations" className="space-y-4">
                {report?.optimizations ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {report.optimizations.map(([component, applied]: [string, boolean], index: number) => (
                      <div key={index} className="flex justify-between items-center text-xs border-b pb-1">
                        <span>{component}</span>
                        <Badge variant={applied ? "default" : "secondary"}>
                          {applied ? "Aplicada" : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Nenhuma otimização registrada
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sistema de Otimização</span>
                    <Button 
                      size="sm" 
                      variant={isOptimizationEnabled ? "default" : "outline"}
                      onClick={toggleOptimization}
                    >
                      {isOptimizationEnabled ? "Ativado" : "Desativado"}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={reset}
                      className="flex-1"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset Sistema
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        performanceTracker.clearMetrics();
                        setReport(null);
                      }}
                      className="flex-1"
                    >
                      Limpar Métricas
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </>
  );
}
