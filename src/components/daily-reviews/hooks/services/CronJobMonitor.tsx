
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Play, Pause, AlertTriangle } from "lucide-react";

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
}

interface CronExecution {
  id: string;
  job_name: string;
  execution_time: string;
  status: string;
  details: any;
}

export function CronJobMonitor() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [executions, setExecutions] = useState<CronExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Buscar jobs usando a função do banco
      const { data: jobsData, error: jobsError } = await supabase
        .rpc('get_cron_jobs', { 
          job_names: ['google-ads-token-check-job', 'cron-health-check'] 
        });

      if (jobsError) {
        console.error("Erro ao buscar jobs:", jobsError);
      } else {
        setJobs(jobsData || []);
      }

      // Buscar execuções recentes
      const { data: execData, error: execError } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .order('execution_time', { ascending: false })
        .limit(20);

      if (execError) {
        console.error("Erro ao buscar execuções:", execError);
      } else {
        setExecutions(execData || []);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'bg-green-500';
      case 'error':
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Monitor de Jobs Cron</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jobs">Jobs Ativos ({jobs.length})</TabsTrigger>
            <TabsTrigger value="executions">Execuções ({executions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            {jobs.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum job encontrado ou erro ao carregar jobs.
                </AlertDescription>
              </Alert>
            ) : (
              jobs.map((job) => (
                <div key={job.jobid} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{job.jobname}</h3>
                    <Badge variant={job.active ? "default" : "secondary"}>
                      {job.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Schedule: <code className="bg-gray-100 px-1 rounded">{job.schedule}</code></p>
                    <p>ID: {job.jobid}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            {executions.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma execução encontrada.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {executions.map((execution) => (
                  <div key={execution.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{execution.job_name}</span>
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {formatDateTime(execution.execution_time)}
                    </div>
                    {execution.details && (
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(execution.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
