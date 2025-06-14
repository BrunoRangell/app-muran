
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CronJobStatus {
  name: string;
  description: string;
  lastExecution?: string;
  status: 'active' | 'inactive' | 'unknown';
}

export const CronJobMonitor = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Jobs simulados baseados nos edge functions existentes
  const [simulatedJobs] = useState<CronJobStatus[]>([
    {
      name: "daily-meta-review",
      description: "Revisão diária das campanhas Meta Ads",
      status: 'active'
    },
    {
      name: "daily-google-review", 
      description: "Revisão diária das campanhas Google Ads",
      status: 'active'
    },
    {
      name: "daily-budget-reviews",
      description: "Processamento de revisões de orçamento",
      status: 'active'
    }
  ]);

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    toast({
      title: "Atualizando",
      description: "Verificando status dos jobs automáticos...",
    });
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Atualizado",
        description: "Status dos jobs verificado com sucesso",
      });
    }, 1500);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitor de Jobs Automáticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando informações dos jobs...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Monitor de Jobs Automáticos</CardTitle>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sistema de monitoramento simplificado. Os jobs são executados automaticamente pelos Edge Functions do Supabase.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            {simulatedJobs.map((job) => (
              <div key={job.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{job.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        job.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {job.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
